import { emailService } from '../services/email.service';
import { elasticsearchService } from '../services/elasticsearch.service';
import { prisma } from '../config/database';
import { emailQueue } from '../queues/email.queue';
import { stopEmailWorker } from '../workers/email.worker';

async function runEsAndQueriesTest() {
  console.log('[ES & Query Test] Starting Level 12 & Level 13 verification...');

  // Step 1: Ensure Elasticsearch index exists
  await elasticsearchService.ensureIndexExists();
  console.log('[Step 1] Elasticsearch index verified! ✅');

  // Step 2: Schedule unique test emails
  const uniqueTag = `es-test-${Date.now()}`;
  console.log(`\n[Step 2] Scheduling emails with tag: ${uniqueTag}...`);

  const scheduleResult = await emailService.scheduleEmails({
    subject: `Elasticsearch Indexing Test Subject ${uniqueTag}`,
    body: `<p>Contains unique search term: <strong>supercalifragilistic-${uniqueTag}</strong></p>`,
    recipients: [`user-${uniqueTag}@example.com`],
    delayBetweenEmails: 0,
  });

  const createdEmail = scheduleResult.emails[0];
  console.log(`[Step 2] Created email ID: ${createdEmail.id}`);

  // Step 3: Wait briefly and search in Elasticsearch
  console.log('\n[Step 3] Testing full-text search in Elasticsearch...');
  await new Promise((r) => setTimeout(r, 1500)); // Allow ES refresh

  const searchSubjectResults = await emailService.searchEmails(uniqueTag);
  console.log(`- Search for tag "${uniqueTag}": found ${searchSubjectResults.count} matches`);
  if (searchSubjectResults.count === 0) {
    throw new Error('Elasticsearch search failed: no matches found for scheduled email');
  }

  const searchBodyResults = await emailService.searchEmails(`supercalifragilistic-${uniqueTag}`);
  console.log(`- Search for body term: found ${searchBodyResults.count} matches`);
  if (searchBodyResults.count === 0) {
    throw new Error('Elasticsearch body search failed');
  }
  console.log('[Step 3] Elasticsearch full-text search verified! ✅');

  // Step 4: Test Level 13 Scheduled Emails API
  console.log('\n[Step 4] Testing getScheduledEmails query...');
  const scheduledList = await emailService.getScheduledEmails({ page: 1, limit: 10 });
  console.log(`- Scheduled list total: ${scheduledList.pagination.total}, returned items: ${scheduledList.items.length}`);
  if (scheduledList.items.length === 0) {
    throw new Error('getScheduledEmails returned empty items');
  }

  // Step 5: Test Level 13 Sent Emails API
  console.log('\n[Step 5] Testing getSentEmails query...');
  const sentList = await emailService.getSentEmails({ page: 1, limit: 10 });
  console.log(`- Sent list total: ${sentList.pagination.total}, returned items: ${sentList.items.length}`);

  // Step 6: Test getEmailById
  console.log('\n[Step 6] Testing getEmailById...');
  const singleEmail = await emailService.getEmailById(createdEmail.id);
  console.log(`- Fetched email by ID: id=${singleEmail.id}, recipient=${singleEmail.recipient}, status=${singleEmail.status}`);
  if (singleEmail.id !== createdEmail.id) {
    throw new Error('getEmailById returned mismatched email ID');
  }

  // Clean up
  await stopEmailWorker();
  await emailQueue.close();
  await prisma.$disconnect();

  console.log('\n[ES & Query Test] Level 12 & Level 13 verification PASSED! 🚀');
  process.exit(0);
}

runEsAndQueriesTest().catch(async (err) => {
  console.error('[ES & Query Test] Test failed:', err);
  await stopEmailWorker();
  await emailQueue.close();
  await prisma.$disconnect();
  process.exit(1);
});
