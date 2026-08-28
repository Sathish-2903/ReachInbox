import { prisma } from '../config/database';
import { config } from '../config/env';
import { addEmailJob } from '../queues/email.queue';
import { elasticsearchService } from './elasticsearch.service';
import {
  AppError,
  ScheduleEmailInput,
  ScheduleEmailsResponse,
  ScheduledEmailItem,
} from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GetEmailsQueryOptions {
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class EmailService {
  /**
   * Validates and schedules emails for multiple recipients with staggered delays.
   */
  async scheduleEmails(input: ScheduleEmailInput): Promise<ScheduleEmailsResponse> {
    if (!input.subject || typeof input.subject !== 'string' || input.subject.trim() === '') {
      throw new AppError('Subject is required and cannot be empty', 400);
    }

    if (!input.body || typeof input.body !== 'string' || input.body.trim() === '') {
      throw new AppError('Body is required and cannot be empty', 400);
    }

    if (!input.recipients || !Array.isArray(input.recipients) || input.recipients.length === 0) {
      throw new AppError('Recipients must be a non-empty array of email addresses', 400);
    }

    // Clean and validate recipient email list
    const validRecipients = input.recipients
      .map((r) => (typeof r === 'string' ? r.trim().toLowerCase() : ''))
      .filter((r) => EMAIL_REGEX.test(r));

    if (validRecipients.length === 0) {
      throw new AppError('No valid recipient email addresses provided', 400);
    }

    // Determine start timestamp
    const now = Date.now();
    let baseTime = now;
    if (input.startTime) {
      const parsedStart = new Date(input.startTime).getTime();
      if (isNaN(parsedStart)) {
        throw new AppError('Invalid startTime format. Provide a valid ISO-8601 date string', 400);
      }
      baseTime = Math.max(parsedStart, now);
    }

    // Delay between consecutive emails (defaults to config min delay)
    const delayStepMs =
      typeof input.delayBetweenEmails === 'number' && input.delayBetweenEmails >= 0
        ? input.delayBetweenEmails
        : config.worker.minEmailDelayMs;

    const scheduledItems: ScheduledEmailItem[] = [];

    // Schedule each recipient
    for (let i = 0; i < validRecipients.length; i++) {
      const recipient = validRecipients[i];
      const scheduledTimeMs = baseTime + i * delayStepMs;
      const scheduledDate = new Date(scheduledTimeMs);
      const delayMs = Math.max(0, scheduledTimeMs - Date.now());

      // 1. Create persistent Email record in PostgreSQL (status: SCHEDULED)
      const emailRecord = await prisma.email.create({
        data: {
          userId: input.userId || null,
          recipient,
          subject: input.subject.trim(),
          body: input.body,
          scheduledAt: scheduledDate,
          status: 'SCHEDULED',
          senderEmail: input.senderEmail || null,
        },
      });

      // 2. Schedule delayed BullMQ job with unique jobId matching emailRecord.id for idempotency
      const job = await addEmailJob(
        'send-email',
        {
          emailId: emailRecord.id,
          userId: input.userId,
          recipient,
          subject: input.subject.trim(),
          body: input.body,
          scheduledAt: scheduledDate.toISOString(),
        },
        {
          delay: delayMs,
          jobId: emailRecord.id, // Guarantees 1:1 mapping between DB record and BullMQ job
        }
      );

      // 3. Persist BullMQ jobId on Email record
      const updatedRecord = await prisma.email.update({
        where: { id: emailRecord.id },
        data: { jobId: String(job.id) },
      });

      // 4. Index in Elasticsearch (Level 12)
      elasticsearchService
        .indexEmail({
          id: updatedRecord.id,
          userId: updatedRecord.userId,
          recipient: updatedRecord.recipient,
          subject: updatedRecord.subject,
          body: updatedRecord.body,
          status: updatedRecord.status,
          scheduledAt: updatedRecord.scheduledAt,
          sentAt: updatedRecord.sentAt,
          createdAt: updatedRecord.createdAt,
        })
        .catch((err) => console.warn('[EmailService] ES indexing warning:', err.message));

      scheduledItems.push({
        id: updatedRecord.id,
        recipient: updatedRecord.recipient,
        subject: updatedRecord.subject,
        scheduledAt: updatedRecord.scheduledAt.toISOString(),
        jobId: String(job.id),
        status: updatedRecord.status,
      });
    }

    return {
      scheduledCount: scheduledItems.length,
      emails: scheduledItems,
    };
  }

  /**
   * Retrieves paginated scheduled emails (Level 13)
   */
  async getScheduledEmails(options: GetEmailsQueryOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      status: { in: ['SCHEDULED', 'PROCESSING'] },
    };
    if (options.userId) {
      where.userId = options.userId;
    }

    const [total, items] = await Promise.all([
      prisma.email.count({ where }),
      prisma.email.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: options.sortOrder || 'asc' },
        select: {
          id: true,
          recipient: true,
          subject: true,
          body: true,
          scheduledAt: true,
          status: true,
          jobId: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves paginated sent emails (Level 13)
   */
  async getSentEmails(options: GetEmailsQueryOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'SENT',
    };
    if (options.userId) {
      where.userId = options.userId;
    }

    const [total, items] = await Promise.all([
      prisma.email.count({ where }),
      prisma.email.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: options.sortOrder || 'desc' },
        select: {
          id: true,
          recipient: true,
          subject: true,
          body: true,
          sentAt: true,
          scheduledAt: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single email by ID (Level 13)
   */
  async getEmailById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const email = await prisma.email.findFirst({ where });
    if (!email) {
      throw new AppError('Email not found', 404);
    }
    return email;
  }

  /**
   * Full-text search across emails using Elasticsearch with fallback (Level 12)
   */
  async searchEmails(query: string, userId?: string) {
    if (!query || query.trim() === '') {
      const fallback = await this.getScheduledEmails({ userId, limit: 50 });
      return {
        query: '',
        count: fallback.pagination.total,
        items: fallback.items,
      };
    }

    const esResults = await elasticsearchService.searchEmails(query, userId);
    return {
      query,
      count: esResults.length,
      items: esResults,
    };
  }
}

export const emailService = new EmailService();
