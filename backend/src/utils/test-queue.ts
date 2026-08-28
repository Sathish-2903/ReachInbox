import { QueueEvents } from 'bullmq';
import { emailQueue, addEmailJob, EMAIL_QUEUE_NAME } from '../queues/email.queue';
import { emailWorker, stopEmailWorker } from '../workers/email.worker';
import { redisConnectionOptions } from '../config/redis';

async function runQueueTest() {
  console.log('[Queue Test] Starting BullMQ + Redis integration test...');

  const queueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
    connection: redisConnectionOptions,
  });

  const testEmailId = `test-${Date.now()}`;
  
  // 1. Add a test job
  const job = await addEmailJob('send-email', {
    emailId: testEmailId,
    recipient: 'test@example.com',
    subject: 'Test BullMQ Email',
    body: 'This is a test message payload for BullMQ verification',
  });

  console.log(`[Queue Test] Job added with ID: ${job.id}`);

  // 2. Wait for job to be completed via QueueEvents
  const result = await job.waitUntilFinished(queueEvents, 10000);
  console.log('[Queue Test] Job finished successfully! Result:', result);

  // 3. Check queue metrics in Redis
  const counts = await emailQueue.getJobCounts('completed', 'failed', 'delayed', 'active', 'waiting');
  console.log('[Queue Test] Current Redis Queue Job Counts:', counts);

  // 4. Clean up / graceful shutdown
  await queueEvents.close();
  await stopEmailWorker();
  await emailQueue.close();

  console.log('[Queue Test] Verification complete!');
  process.exit(0);
}

runQueueTest().catch(async (err) => {
  console.error('[Queue Test] Error during test:', err);
  await stopEmailWorker();
  await emailQueue.close();
  process.exit(1);
});
