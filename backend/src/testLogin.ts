import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  const email = 'superadmin@gmail.com';
  const password = 'admin@123';
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found in DB');
    return;
  }
  
  console.log('User found:', user.email, 'Role:', user.role);
  console.log('Stored hash:', user.passwordHash);
  
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log('Password match:', isMatch);
  
  if (!isMatch) {
    // try encrypting the password to see what it looks like
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(password, salt);
    console.log('A new hash of this password would be:', newHash);
  }
}

testLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
