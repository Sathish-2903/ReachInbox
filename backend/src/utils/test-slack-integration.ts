import { slackService } from '../services/slack.service';
import { prisma } from '../config/database';

async function runSlackTest() {
  console.log('[Slack Integration Test] Starting Level 11 verification...');

  // Test 1: Generate Slack OAuth URL
  const authUrl = slackService.getAuthorizationUrl('state-123');
  console.log('[Test 1] Generated Slack Authorization URL:', authUrl);
  if (!authUrl.includes('https://slack.com/oauth/v2/authorize') || !authUrl.includes('chat%3Awrite')) {
    throw new Error('OAuth URL generation failed');
  }
  console.log('[Test 1] Slack OAuth URL verified! ✅');

  // Test 2: Status check when not connected
  const status = await slackService.getSlackStatus();
  console.log('[Test 2] Slack status (unconnected):', status);

  // Test 3: Safe rate-limit notification dispatch (should not crash if not connected)
  const notificationSent = await slackService.sendRateLimitNotification({
    sender: 'test-sender',
    limit: 100,
    nextWindow: '2026-08-28T13:00:00.000Z',
  });
  console.log('[Test 3] Notification dispatch result (without token):', notificationSent);

  // Test 4: Token storage and removal cycle on a mock user
  console.log('[Test 4] Testing User Slack token persistence...');
  const testUser = await prisma.user.upsert({
    where: { googleId: 'test-slack-user-1' },
    update: {},
    create: {
      googleId: 'test-slack-user-1',
      name: 'Slack Test User',
      email: 'slack-test@example.com',
    },
  });

  await slackService.saveUserSlackToken(testUser.id, 'xoxb-mock-test-token-12345');
  const connectedStatus = await slackService.getSlackStatus(testUser.id);
  console.log('[Test 4] Status after saving token:', connectedStatus);
  if (!connectedStatus.connected) {
    throw new Error('User should be marked connected after saving token');
  }

  await slackService.disconnectUserSlack(testUser.id);
  const disconnectedStatus = await slackService.getSlackStatus(testUser.id);
  console.log('[Test 4] Status after disconnecting:', disconnectedStatus);
  if (disconnectedStatus.connected) {
    throw new Error('User should be disconnected');
  }

  // Clean up
  await prisma.user.delete({ where: { id: testUser.id } });
  await prisma.$disconnect();

  console.log('\n[Slack Integration Test] Level 11 verification PASSED! 🚀');
  process.exit(0);
}

runSlackTest().catch(async (err) => {
  console.error('[Slack Integration Test] Test failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
