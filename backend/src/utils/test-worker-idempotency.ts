import { emailService } from '../services/email.service';
import { prisma } from '../config/database';
import { emailQueue, EMAIL_QUEUE_NAME } from '../queues/email.queue';
import { emailWorker, stopEmailWorker, processEmailJob } from '../workers/email.worker';
import { QueueEvents, Job } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';

async function runWorkerIdempotencyTest() {
  console.log('[Worker & Idempotency Test] Starting Level 8 verification...');

  const queueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
    connection: redisConnectionOptions,
  });

  // Step 1: Schedule an immediate email
  console.log('\n[Step 1] Scheduling an immediate email...');
  const scheduleResult = await emailService.scheduleEmails({
    subject: 'Idempotency Test Email',
    body: '<p>Testing worker processing and idempotency.</p>',
    recipients: ['idempotency-test@example.com'],
    delayBetweenEmails: 0,
  });

  const scheduledEmail = scheduleResult.emails[0];
  console.log(`[Step 1] Scheduled email record ID: ${scheduledEmail.id}, jobId: ${scheduledEmail.jobId}`);

  // Step 2: Wait for worker to process and complete
  console.log('\n[Step 2] Waiting for job completion via BullMQ QueueEvents...');
  const job = await emailQueue.getJob(scheduledEmail.jobId);
  if (!job) throw new Error('Job not found in queue');

  const result = await job.waitUntilFinished(queueEvents, 15000);
  console.log('[Step 2] Job finished! Worker result:', result);

  // Step 3: Verify PostgreSQL state
  console.log('\n[Step 3] Checking PostgreSQL record status...');
  const dbRecord = await prisma.email.findUnique({
    where: { id: scheduledEmail.id },
  });

  console.log(`[Step 3] DB Status: ${dbRecord?.status}, SentAt: ${dbRecord?.sentAt?.toISOString()}`);
  if (dbRecord?.status !== 'SENT' || !dbRecord?.sentAt) {
    throw new Error('Email status in DB was not updated to SENT!');
  }
  const firstSentAt = dbRecord.sentAt;

  // Step 4: Test Idempotency Guard (Simulate replay of the same job)
  console.log('\n[Step 4] Simulating replay/duplicate execution of the same job...');
  const fakeReplayJob = {
    id: 'replay-job-1',
    data: {
      emailId: scheduledEmail.id,
      recipient: 'idempotency-test@example.com',
      subject: 'Idempotency Test Email',
      body: '<p>Testing worker processing and idempotency.</p>',
    },
  } as Job;

  const replayResult = await processEmailJob(fakeReplayJob);
  console.log('[Step 4] Replay execution result:', replayResult);

  if (!replayResult.skipped || replayResult.reason !== 'Already SENT') {
    throw new Error('Idempotency guard failed: email was not skipped!');
  }

  // Step 5: Verify DB sentAt remained unchanged
  const postReplayRecord = await prisma.email.findUnique({
    where: { id: scheduledEmail.id },
  });
  if (postReplayRecord?.sentAt?.getTime() !== firstSentAt.getTime()) {
    throw new Error('sentAt timestamp was overwritten during replay!');
  }

  // Clean up
  await queueEvents.close();
  await stopEmailWorker();
  await emailQueue.close();
  await prisma.$disconnect();

  console.log('\n[Worker & Idempotency Test] Level 8 verification PASSED! 🚀');
  process.exit(0);
}

runWorkerIdempotencyTest().catch(async (err) => {
  console.error('[Worker & Idempotency Test] Test failed:', err);
  await stopEmailWorker();
  await emailQueue.close();
  await prisma.$disconnect();
  process.exit(1);
});
