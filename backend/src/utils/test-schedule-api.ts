import { emailService } from '../services/email.service';
import { prisma } from '../config/database';
import { emailQueue } from '../queues/email.queue';
import { stopEmailWorker } from '../workers/email.worker';

async function runScheduleTest() {
  console.log('[Schedule API Test] Testing Email Scheduling Service...');

  const startTime = new Date(Date.now() + 60000).toISOString(); // 1 minute in the future
  const delayMs = 3000;

  // Test 1: Schedule 3 recipients
  console.log('\n[Test 1] Scheduling 3 emails with 3000ms delay...');
  const scheduleResult = await emailService.scheduleEmails({
    subject: 'Welcome to ReachInbox Platform',
    body: '<p>Hello and welcome!</p>',
    recipients: ['alice@example.com', 'bob@example.com', 'charlie@example.com'],
    startTime,
    delayBetweenEmails: delayMs,
  });

  console.log(`[Test 1] Scheduled ${scheduleResult.scheduledCount} emails successfully!`);
  console.log('Result:', JSON.stringify(scheduleResult, null, 2));

  // Test 2: Verify database records
  console.log('\n[Test 2] Verifying records in PostgreSQL...');
  for (const item of scheduleResult.emails) {
    const dbRecord = await prisma.email.findUnique({ where: { id: item.id } });
    console.log(`- DB record ${item.id}: status=${dbRecord?.status}, recipient=${dbRecord?.recipient}, jobId=${dbRecord?.jobId}, scheduledAt=${dbRecord?.scheduledAt.toISOString()}`);
    if (!dbRecord || dbRecord.status !== 'SCHEDULED' || dbRecord.jobId !== item.jobId) {
      throw new Error(`DB verification failed for email ${item.id}`);
    }
  }

  // Test 3: Verify BullMQ delayed jobs in Redis
  console.log('\n[Test 3] Verifying BullMQ delayed jobs in Redis...');
  for (const item of scheduleResult.emails) {
    const job = await emailQueue.getJob(item.jobId);
    if (!job) {
      throw new Error(`BullMQ job not found for jobId ${item.jobId}`);
    }
    const state = await job.getState();
    console.log(`- BullMQ Job ${job.id}: state=${state}, delay=${job.opts.delay}ms, recipient=${job.data.recipient}`);
  }

  // Test 4: Validation failures
  console.log('\n[Test 4] Verifying input validations...');
  try {
    await emailService.scheduleEmails({
      subject: '',
      body: 'test',
      recipients: ['test@example.com'],
    });
    throw new Error('Validation should have failed for empty subject');
  } catch (err: any) {
    console.log(`- Empty subject correctly rejected: "${err.message}"`);
  }

  try {
    await emailService.scheduleEmails({
      subject: 'Valid Subject',
      body: 'test',
      recipients: ['not-an-email'],
    });
    throw new Error('Validation should have failed for invalid email');
  } catch (err: any) {
    console.log(`- Invalid email correctly rejected: "${err.message}"`);
  }

  // Clean up
  await stopEmailWorker();
  await emailQueue.close();
  await prisma.$disconnect();

  console.log('\n[Schedule API Test] All Level 6 tests PASSED successfully! 🚀');
  process.exit(0);
}

runScheduleTest().catch(async (err) => {
  console.error('[Schedule API Test] Test failed with error:', err);
  await stopEmailWorker();
  await emailQueue.close();
  await prisma.$disconnect();
  process.exit(1);
});
