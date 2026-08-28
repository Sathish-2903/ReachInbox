import { Queue, JobsOptions } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-queue';

export interface EmailJobData {
  emailId: string;
  userId?: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt?: string;
}

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 1000,
    },
    removeOnFail: {
      count: 5000,
    },
  },
});

export async function addEmailJob(
  name: string,
  data: EmailJobData,
  opts?: JobsOptions
) {
  const job = await emailQueue.add(name, data, opts);
  console.log(`[Queue] Added job ${job.id} for emailId=${data.emailId} (delay=${opts?.delay ?? 0}ms)`);
  return job;
}
