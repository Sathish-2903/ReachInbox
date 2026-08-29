import dotenv from 'dotenv';
import path from 'path';

// Load .env reliably from backend directory, fallback to process.cwd()
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Removed second dotenv.config() to avoid overriding backend .env values


export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',

  databaseUrl: process.env.DATABASE_URL || 'postgresql://reachinbox:reachinbox@localhost:5432/reachinbox',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    minEmailDelayMs: parseInt(process.env.MIN_EMAIL_DELAY_MS || '2000', 10),
    maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '100', 10),
  },

  ethereal: {
    host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.ETHEREAL_PORT || '587', 10),
    user: process.env.ETHEREAL_USER || '',
    password: process.env.ETHEREAL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'ReachInbox <noreply@reachinbox.dev>',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  },

  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-reachinbox-scheduler-jwt',

  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',

  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/api/slack/callback',
  },
};
