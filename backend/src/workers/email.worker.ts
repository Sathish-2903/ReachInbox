import { Worker, Job, DelayedError } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { config } from '../config/env';
import { EMAIL_QUEUE_NAME, EmailJobData } from '../queues/email.queue';
import { prisma } from '../config/database';
import { smtpService } from '../services/smtp.service';
import { rateLimiterService } from '../services/rate-limiter.service';
import { slackService } from '../services/slack.service';
import { elasticsearchService } from '../services/elasticsearch.service';

export async function processEmailJob(job: Job<EmailJobData>, token?: string) {
  const { emailId, recipient, subject, body } = job.data;
  console.log(`[Worker] Processing job ${job.id} for emailId=${emailId} to=${recipient}`);

  // 1. Fetch persistent email record from PostgreSQL
  const email = await prisma.email.findUnique({
    where: { id: emailId },
  });

  if (!email) {
    console.warn(`[Worker] Email record ${emailId} not found in DB. Skipping.`);
    return { skipped: true, reason: 'Email not found in DB' };
  }

  // 2. Idempotency guard: If already marked SENT, do not re-send
  if (email.status === 'SENT') {
    console.log(`[Worker] Idempotency guard: Email ${emailId} is already SENT. Skipping.`);
    return { skipped: true, reason: 'Already SENT', sentAt: email.sentAt };
  }

  const sender = email.senderEmail || 'default';

  // 3. Distributed Hourly Rate Limiting (Level 10)
  const rateCheck = await rateLimiterService.checkAndConsumeHourlyRate(
    sender,
    config.worker.maxEmailsPerHour
  );

  if (!rateCheck.allowed) {
    const nextScheduledTime = new Date(Date.now() + rateCheck.retryAfterMs);
    console.warn(
      `[Worker] Hourly limit hit for sender "${sender}" (${rateCheck.currentCount}/${rateCheck.limit}). Rescheduling email ${emailId} for ${nextScheduledTime.toISOString()} (${rateCheck.retryAfterMs}ms delay)`
    );

    // Send Slack notification if connected (non-blocking / non-fatal) (Level 11)
    slackService
      .sendRateLimitNotification({
        sender,
        limit: rateCheck.limit,
        nextWindow: nextScheduledTime.toISOString(),
        userId: email.userId || undefined,
      })
      .catch((err) => console.warn('[Worker] Slack notification failed:', err.message));

    // Update DB status back to SCHEDULED with new scheduledAt timestamp
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: 'SCHEDULED',
        scheduledAt: nextScheduledTime,
      },
    });

    // Sync state change with Elasticsearch (Level 12)
    elasticsearchService
      .indexEmail({
        id: email.id,
        userId: email.userId,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        status: 'SCHEDULED',
        scheduledAt: nextScheduledTime,
      })
      .catch((err) => console.warn('[Worker] ES indexing error:', err.message));

    // Move BullMQ job to delayed queue for next window
    if (token) {
      await job.moveToDelayed(Date.now() + rateCheck.retryAfterMs, token);
      throw new DelayedError();
    }

    return {
      rescheduled: true,
      reason: 'Hourly rate limit exceeded',
      retryAfterMs: rateCheck.retryAfterMs,
      nextScheduledAt: nextScheduledTime.toISOString(),
    };
  }

  // 4. Minimum Delay Throttling (Level 9)
  await rateLimiterService.enforceMinimumDelay(
    sender,
    config.worker.minEmailDelayMs
  );

  // 5. Mark state as PROCESSING
  await prisma.email.update({
    where: { id: emailId },
    data: { status: 'PROCESSING' },
  });

  try {
    // 6. Send email via Ethereal SMTP
    const sendResult = await smtpService.sendEmail({
      to: recipient,
      subject: subject,
      body: body,
      from: email.senderEmail || undefined,
    });

    // 7. Update DB status to SENT + record sentAt timestamp
    const sentAt = new Date();
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: 'SENT',
        sentAt,
        error: null,
      },
    });

    // 8. Update Elasticsearch document to SENT (Level 12)
    elasticsearchService
      .indexEmail({
        id: email.id,
        userId: email.userId,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        status: 'SENT',
        scheduledAt: email.scheduledAt,
        sentAt,
      })
      .catch((err) => console.warn('[Worker] ES indexing error:', err.message));

    console.log(`[Worker] Email ${emailId} successfully sent! Preview: ${sendResult.previewUrl || 'N/A'}`);

    return {
      success: true,
      emailId,
      messageId: sendResult.messageId,
      previewUrl: sendResult.previewUrl,
      sentAt: sentAt.toISOString(),
    };
  } catch (error: any) {
    console.error(`[Worker] Error sending email ${emailId}: ${error.message}`);

    // Mark state as FAILED and record error message
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: 'FAILED',
        error: error.message || 'SMTP sending error',
      },
    });

    // Update Elasticsearch document to FAILED (Level 12)
    elasticsearchService
      .indexEmail({
        id: email.id,
        userId: email.userId,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        status: 'FAILED',
        scheduledAt: email.scheduledAt,
      })
      .catch((err) => console.warn('[Worker] ES indexing error:', err.message));

    throw error;
  }
}

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  processEmailJob,
  {
    connection: redisConnectionOptions,
    concurrency: config.worker.concurrency,
  }
);

emailWorker.on('active', (job: Job<EmailJobData>) => {
  console.log(`[Worker Event] Job ${job.id} is ACTIVE (emailId=${job.data.emailId})`);
});

emailWorker.on('completed', (job: Job<EmailJobData>, result) => {
  console.log(`[Worker Event] Job ${job.id} COMPLETED (emailId=${job.data.emailId})`);
});

emailWorker.on('failed', (job: Job<EmailJobData> | undefined, error: Error) => {
  if (error.name === 'DelayedError') {
    console.log(`[Worker Event] Job ${job?.id} rescheduled to delayed state`);
    return;
  }
  console.error(`[Worker Event] Job ${job?.id} FAILED: ${error.message}`);
});

emailWorker.on('error', (error: Error) => {
  console.error(`[Worker Event] Worker error: ${error.message}`);
});

export async function stopEmailWorker() {
  console.log('[Worker] Shutting down email worker gracefully...');
  await emailWorker.close();
  console.log('[Worker] Email worker closed.');
}
