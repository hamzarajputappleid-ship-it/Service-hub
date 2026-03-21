import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting dependent records...');
    await prisma.userActivity.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.rating.deleteMany({}); // Corrected from review to rating
    await prisma.payment.deleteMany({}); // Delete payments before bookings
    await prisma.booking.deleteMany({});
    await prisma.workerProfile.deleteMany({});
    
    console.log('Deleting all users...');
    const result = await prisma.user.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} users.`);
  } catch (error) {
    console.error('Error deleting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUsers();
