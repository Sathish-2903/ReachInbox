import prisma from '../config/database';

async function testDb() {
  try {
    const userCount = await prisma.user.count();
    const emailCount = await prisma.email.count();
    console.log(`[DB Test] Success! User count: ${userCount}, Email count: ${emailCount}`);
  } catch (error) {
    console.error('[DB Test] Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDb();
