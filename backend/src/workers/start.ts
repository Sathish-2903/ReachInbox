import '../config/env';
import { emailWorker, recoverStuckProcessingEmails } from './email.worker';

console.log('================================================================');
console.log('⚡ ReachInbox Email Scheduler — Standalone Worker Started');
console.log('================================================================');

recoverStuckProcessingEmails().then(() => {
  console.log('[Worker] Worker listener active. Waiting for BullMQ email jobs...');
});

// Handle graceful termination
process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received. Closing BullMQ worker...');
  await emailWorker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received. Closing BullMQ worker...');
  await emailWorker.close();
  process.exit(0);
});
