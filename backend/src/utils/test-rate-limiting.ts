import { rateLimiterService } from '../services/rate-limiter.service';
import { emailService } from '../services/email.service';
import { prisma } from '../config/database';
import { emailQueue, EMAIL_QUEUE_NAME } from '../queues/email.queue';
import { emailWorker, stopEmailWorker } from '../workers/email.worker';
import { QueueEvents } from 'bullmq';
import { redisConnectionOptions, redisClient } from '../config/redis';

async function runRateLimitingTests() {
  console.log('[Rate Limiting Test] Starting Level 9 & Level 10 verification...');

  const queueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
    connection: redisConnectionOptions,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1: Level 10 — Distributed Hourly Rate Limiting Logic
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[Test 1] Testing Hourly Rate Limiter (Atomic Redis Lua logic)...');
  const testSender = `rate-test-sender-${Date.now()}`;
  const maxLimit = 2; // Small limit for testing

  await rateLimiterService.resetSenderRate(testSender);

  const check1 = await rateLimiterService.checkAndConsumeHourlyRate(testSender, maxLimit);
  console.log(`- Request 1: allowed=${check1.allowed}, count=${check1.currentCount}/${check1.limit}`);
  if (!check1.allowed || check1.currentCount !== 1) {
    throw new Error('Test 1 failed: Request 1 should be allowed with count 1');
  }

  const check2 = await rateLimiterService.checkAndConsumeHourlyRate(testSender, maxLimit);
  console.log(`- Request 2: allowed=${check2.allowed}, count=${check2.currentCount}/${check2.limit}`);
  if (!check2.allowed || check2.currentCount !== 2) {
    throw new Error('Test 1 failed: Request 2 should be allowed with count 2');
  }

  const check3 = await rateLimiterService.checkAndConsumeHourlyRate(testSender, maxLimit);
  console.log(`- Request 3 (Exceeded): allowed=${check3.allowed}, count=${check3.currentCount}/${check3.limit}, retryAfterMs=${check3.retryAfterMs}ms`);
  if (check3.allowed || check3.currentCount !== 2 || check3.retryAfterMs <= 0) {
    throw new Error('Test 1 failed: Request 3 should be blocked and provide retryAfterMs');
  }
  console.log('[Test 1] Hourly rate limiting logic verified successfully! ✅');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2: Level 9 — Minimum Delay Throttling
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[Test 2] Testing Minimum Delay Throttling...');
  const delaySender = `delay-test-sender-${Date.now()}`;
  const minDelay = 1500; // 1.5 seconds

  const startT = Date.now();
  const wait1 = await rateLimiterService.enforceMinimumDelay(delaySender, minDelay);
  const wait2 = await rateLimiterService.enforceMinimumDelay(delaySender, minDelay);
  const elapsed = Date.now() - startT;

  console.log(`- 1st call wait: ${wait1}ms | 2nd call wait: ${wait2}ms | Total elapsed: ${elapsed}ms`);
  if (elapsed < minDelay - 100) {
    throw new Error(`Test 2 failed: Minimum delay was not enforced (elapsed ${elapsed}ms < minDelay ${minDelay}ms)`);
  }
  console.log('[Test 2] Minimum delay throttling verified successfully! ✅');

  // Clean up
  await rateLimiterService.resetSenderRate(testSender);
  await rateLimiterService.resetSenderRate(delaySender);
  await queueEvents.close();
  await stopEmailWorker();
  await emailQueue.close();
  await redisClient.quit();
  await prisma.$disconnect();

  console.log('\n[Rate Limiting Test] Level 9 & Level 10 verification PASSED! 🚀');
  process.exit(0);
}

runRateLimitingTests().catch(async (err) => {
  console.error('[Rate Limiting Test] Test failed:', err);
  await stopEmailWorker();
  await emailQueue.close();
  await redisClient.quit();
  await prisma.$disconnect();
  process.exit(1);
});
