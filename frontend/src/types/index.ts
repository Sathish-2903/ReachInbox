export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  hasSlackConnected: boolean;
  createdAt: string;
}

export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface EmailItem {
  id: string;
  recipient: string;
  subject: string;
  body?: string;
  scheduledAt: string;
  sentAt?: string | null;
  status: EmailStatus;
  jobId?: string | null;
  createdAt: string;
}

export interface SchedulePayload {
  subject: string;
  body: string;
  recipients: string[];
  startTime?: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
}

export interface UploadResult {
  detected: number;
  valid: number;
  invalid: number;
  invalidItems: string[];
  unique: number;
  emails: string[];
}

export type TabType = 'scheduled' | 'sent';
