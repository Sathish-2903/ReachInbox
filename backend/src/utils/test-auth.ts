import { authService } from '../services/auth.service';
import { prisma } from '../config/database';

async function runAuthTest() {
  console.log('[Auth Test] Starting Level 15 Google OAuth & JWT verification...');

  // Test 1: Google OAuth URL generation
  const authUrl = authService.getGoogleAuthUrl('test-state-abc');
  console.log('[Test 1] Generated Google Auth URL:', authUrl);
  if (!authUrl.includes('https://accounts.google.com/o/oauth2/v2/auth') || !authUrl.includes('scope=openid+profile+email')) {
    throw new Error('Google OAuth URL generation failed');
  }

  // Test 2: User creation & JWT lifecycle
  console.log('\n[Test 2] Creating mock OAuth user in database...');
  const mockProfile = {
    id: `google-uid-${Date.now()}`,
    name: 'Sathish Kumar',
    email: `sathish-${Date.now()}@example.com`,
    picture: 'https://lh3.googleusercontent.com/a/default-avatar',
  };

  const user = await authService.findOrCreateUser(mockProfile);
  console.log(`[Test 2] Created user in DB: id=${user.id}, email=${user.email}, name=${user.name}`);

  // Test 3: JWT Token Generation & Verification
  console.log('\n[Test 3] Generating and verifying JWT token...');
  const token = authService.generateToken(user);
  console.log(`- Generated JWT: ${token.slice(0, 30)}...`);

  const decoded = authService.verifyToken(token);
  console.log('- Decoded JWT payload:', decoded);
  if (decoded.id !== user.id || decoded.email !== user.email) {
    throw new Error('JWT verification mismatch');
  }

  // Test 4: Get user details
  console.log('\n[Test 4] Fetching user by ID...');
  const userDetails = await authService.getUserById(user.id);
  console.log('- User details:', userDetails);
  if (!userDetails || userDetails.hasSlackConnected !== false) {
    throw new Error('User details lookup failed');
  }

  // Clean up
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();

  console.log('\n[Auth Test] Level 15 verification PASSED! 🚀');
  process.exit(0);
}

runAuthTest().catch(async (err) => {
  console.error('[Auth Test] Test failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
