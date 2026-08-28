import { redisClient } from '../config/redis';
import { config } from '../config/env';

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  retryAfterMs: number;
}

export class RateLimiterService {
  /**
   * Generates the UTC hour window identifier (e.g. "2026-08-28-12")
   */
  getHourWindow(date = new Date()): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    return `${year}-${month}-${day}-${hour}`;
  }

  /**
   * Calculates milliseconds until the start of the next hour window
   */
  getNextHourDelayMs(date = new Date()): number {
    const nextHour = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours() + 1,
        0,
        0,
        500 // 500ms safety buffer
      )
    );
    return Math.max(1000, nextHour.getTime() - date.getTime());
  }

  /**
   * Enforces minimum delay between consecutive email dispatches per sender across distributed workers.
   * Atomically schedules and sleeps if the minimum delay hasn't elapsed.
   */
  async enforceMinimumDelay(
    sender = 'default',
    minDelayMs = config.worker.minEmailDelayMs
  ): Promise<number> {
    if (minDelayMs <= 0) return 0;

    const key = `email-last-sent:${sender}`;
    const now = Date.now();

    // Atomic Lua script to check last sent time and reserve execution slot
    const luaScript = `
      local lastSent = redis.call('GET', KEYS[1])
      local now = tonumber(ARGV[1])
      local minDelay = tonumber(ARGV[2])
      local waitTime = 0
      if lastSent then
        local diff = now - tonumber(lastSent)
        if diff < minDelay then
          waitTime = minDelay - diff
        end
      end
      local nextSlot = now + waitTime
      redis.call('SET', KEYS[1], tostring(nextSlot), 'PX', 86400000)
      return waitTime
    `;

    const waitTime = (await redisClient.eval(
      luaScript,
      1,
      key,
      now.toString(),
      minDelayMs.toString()
    )) as number;

    if (waitTime > 0) {
      console.log(`[RateLimiter] Enforcing min delay: sender="${sender}" sleeping for ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    return waitTime;
  }

  /**
   * Atomically consumes one send quota for the current hour window.
   * If limit is exceeded, returns allowed=false with calculated retryAfterMs.
   */
  async checkAndConsumeHourlyRate(
    sender = 'default',
    maxPerHour = config.worker.maxEmailsPerHour
  ): Promise<RateLimitResult> {
    const hourWindow = this.getHourWindow();
    const key = `email-rate:${sender}:${hourWindow}`;

    // Atomic increment and rate check
    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local current = redis.call('INCR', key)
      if current == 1 then
        redis.call('EXPIRE', key, 7200)
      end
      if current > limit then
        redis.call('DECR', key)
        return { 0, current - 1 }
      else
        return { 1, current }
      end
    `;

    const [allowedFlag, currentCount] = (await redisClient.eval(
      luaScript,
      1,
      key,
      maxPerHour.toString()
    )) as [number, number];

    const isAllowed = allowedFlag === 1;
    const retryAfterMs = isAllowed ? 0 : this.getNextHourDelayMs();

    return {
      allowed: isAllowed,
      currentCount,
      limit: maxPerHour,
      retryAfterMs,
    };
  }

  /**
   * Retrieves current hourly email count for a sender
   */
  async getHourlyCount(sender = 'default', hourWindow?: string): Promise<number> {
    const window = hourWindow || this.getHourWindow();
    const key = `email-rate:${sender}:${window}`;
    const val = await redisClient.get(key);
    return val ? parseInt(val, 10) : 0;
  }

  /**
   * Clears the rate counter for testing or administrative resets
   */
  async resetSenderRate(sender = 'default', hourWindow?: string): Promise<void> {
    const window = hourWindow || this.getHourWindow();
    const key = `email-rate:${sender}:${window}`;
    const lastSentKey = `email-last-sent:${sender}`;
    await redisClient.del(key, lastSentKey);
  }
}

export const rateLimiterService = new RateLimiterService();
