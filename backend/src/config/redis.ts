import { ConnectionOptions } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';
import { config } from './env';

export const redisConnectionOptions: ConnectionOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
};

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});
