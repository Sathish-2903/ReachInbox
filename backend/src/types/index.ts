export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ScheduleEmailInput {
  subject: string;
  body: string;
  recipients: string[];
  startTime?: string | Date;
  delayBetweenEmails?: number; // ms delay between consecutive emails
  hourlyLimit?: number;
  userId?: string;
  senderEmail?: string;
}

export interface ScheduledEmailItem {
  id: string;
  recipient: string;
  subject: string;
  scheduledAt: string;
  jobId: string;
  status: string;
}

export interface ScheduleEmailsResponse {
  scheduledCount: number;
  emails: ScheduledEmailItem[];
}

