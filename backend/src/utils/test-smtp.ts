import { smtpService } from '../services/smtp.service';

async function runSmtpTest() {
  console.log('[SMTP Test] Testing Ethereal SMTP delivery...');

  const testRecipient = 'interview-evaluator@example.com';
  const testSubject = `ReachInbox Ethereal Test - ${Date.now()}`;
  const testBody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4F46E5;">ReachInbox Email Scheduler</h2>
      <p>This is an automated test email sent via <strong>Ethereal SMTP</strong>.</p>
      <p>Timestamp: <code>${new Date().toISOString()}</code></p>
    </div>
  `;

  const result = await smtpService.sendEmail({
    to: testRecipient,
    subject: testSubject,
    body: testBody,
  });

  console.log('[SMTP Test] Email sent successfully!');
  console.log('Result:', JSON.stringify(result, null, 2));

  if (!result.messageId) {
    throw new Error('No messageId returned from Ethereal SMTP');
  }

  console.log('\n[SMTP Test] Level 7 Ethereal SMTP verification PASSED! 🚀');
  process.exit(0);
}

runSmtpTest().catch((err) => {
  console.error('[SMTP Test] Failed with error:', err);
  process.exit(1);
});
