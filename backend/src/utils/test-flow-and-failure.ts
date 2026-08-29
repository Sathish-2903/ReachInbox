import '../config/env';
import { prisma } from '../config/database';
import { authService } from '../services/auth.service';
import { emailService } from '../services/email.service';
import { smtpService } from '../services/smtp.service';
import { stopEmailWorker } from '../workers/email.worker';
import { emailQueue } from '../queues/email.queue';

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('🚀 ReachInbox Email Scheduler — Full Flow & Failure Verification');
  console.log('================================================================\n');

  // STEP 1: Google Auth & Token Generation
  console.log('[Flow 1/6] Testing Google Auth Lifecycle...');
  const mockProfile = {
    id: `google-user-${Date.now()}`,
    name: 'Verified Tester',
    email: `tester-${Date.now()}@reachinbox.dev`,
    picture: 'https://lh3.googleusercontent.com/a/default-avatar',
  };

  const user = await authService.findOrCreateUser(mockProfile);
  const token = authService.generateToken(user);
  const decoded = authService.verifyToken(token);
  console.log(`  ✓ Authenticated user: ${user.email} (id: ${user.id})`);
  console.log(`  ✓ JWT verified: exp=${new Date(decoded.exp * 1000).toISOString()}`);

  // STEP 2: Create Email Campaign & Persist in PostgreSQL & BullMQ
  console.log('\n[Flow 2/6] Scheduling Outreach Email Campaign...');
  const recipient = `recipient-${Date.now()}@example.com`;
  const scheduleResult = await emailService.scheduleEmails({
    userId: user.id,
    recipients: [recipient],
    subject: 'End-to-End Outreach Flow Verification',
    body: '<h1>Hello from ReachInbox</h1><p>Verifying BullMQ and SMTP delivery pipeline.</p>',
    delayBetweenEmails: 0,
  });

  const scheduledEmail = scheduleResult.emails[0];
  console.log(`  ✓ Campaign created with ${scheduleResult.scheduledCount} email(s)`);
  console.log(`  ✓ Saved in DB: id=${scheduledEmail.id}, status=${scheduledEmail.status}`);

  // STEP 3: Wait for Worker to Pick Up & Deliver via SMTP
  console.log('\n[Flow 3/6] Waiting for Worker to Process and Send Email...');
  let attempts = 0;
  let updatedEmail = null;
  while (attempts < 20) {
    await new Promise((r) => setTimeout(r, 1000));
    updatedEmail = await prisma.email.findUnique({
      where: { id: scheduledEmail.id },
    });
    if (updatedEmail && updatedEmail.status === 'SENT') {
      break;
    }
    attempts++;
  }

  if (!updatedEmail || updatedEmail.status !== 'SENT') {
    throw new Error(`Email did not reach SENT state. Current status: ${updatedEmail?.status}, error: ${updatedEmail?.error}`);
  }

  console.log(`  ✓ Email transitioned to SENT at ${updatedEmail.sentAt?.toISOString()}`);

  // STEP 4: Query Sent Emails API
  console.log('\n[Flow 4/6] Querying Sent Emails List...');
  const sentList = await emailService.getSentEmails({ userId: user.id });
  const foundInSent = sentList.items.some((item) => item.id === scheduledEmail.id);
  if (!foundInSent) {
    throw new Error('Scheduled email not found in user sent list');
  }
  console.log(`  ✓ Email verified in Sent Emails tab (Total user sent: ${sentList.pagination.total})`);

  // STEP 5: Test Failure Handling (Invalid SMTP / Fail state)
  console.log('\n[Flow 5/6] Testing Failure Handling Pipeline...');
  const failRecipient = `fail-test-${Date.now()}@invalid-domain-test.local`;
  const failRecord = await prisma.email.create({
    data: {
      userId: user.id,
      recipient: failRecipient,
      subject: 'Failure Simulation Email',
      body: 'This will test error capture and FAILED state update.',
      scheduledAt: new Date(),
      status: 'PROCESSING',
    },
  });

  // Temporarily force SMTP to simulate failure
  const originalSendMail = (smtpService as any).sendEmail;
  (smtpService as any).sendEmail = async () => {
    throw new Error('Simulated SMTP Connection Refused / 535 Auth Error');
  };

  try {
    const { processEmailJob } = await import('../workers/email.worker');
    await processEmailJob({
      id: 'simulated-job-fail',
      data: {
        emailId: failRecord.id,
        recipient: failRecipient,
        subject: 'Failure Simulation Email',
        body: 'Testing failure handling',
      },
    } as any);
  } catch (err: any) {
    console.log(`  ✓ Worker caught error as expected: ${err.message}`);
  } finally {
    // Restore SMTP
    (smtpService as any).sendEmail = originalSendMail;
  }

  const failedDbRecord = await prisma.email.findUnique({
    where: { id: failRecord.id },
  });

  if (!failedDbRecord || failedDbRecord.status !== 'FAILED') {
    throw new Error(`Expected email status to be FAILED, got ${failedDbRecord?.status}`);
  }

  console.log(`  ✓ Database updated to FAILED with error: "${failedDbRecord.error}"`);

  // STEP 6: Clean Up Test Artifacts
  console.log('\n[Flow 6/6] Cleaning up test data...');
  await prisma.email.deleteMany({
    where: { id: { in: [scheduledEmail.id, failRecord.id] } },
  });
  await prisma.user.delete({ where: { id: user.id } });

  console.log('\n================================================================');
  console.log('🎉 COMPLETE END-TO-END FLOW & FAILURE HANDLING VERIFIED 100%!');
  console.log('================================================================');

  await stopEmailWorker();
  await emailQueue.close();
  await prisma.$disconnect();
  process.exit(0);
}

runEndToEndVerification().catch(async (err) => {
  console.error('\n❌ Verification failed:', err);
  await stopEmailWorker();
  await emailQueue.close();
  await prisma.$disconnect();
  process.exit(1);
});
