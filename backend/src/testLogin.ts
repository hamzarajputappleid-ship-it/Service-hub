import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.model';

dotenv.config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.DATABASE_URL as string);

    const email = 'superadmin@gmail.com';
    const password = 'admin@123';
    
    const user = await User.findOne({ email });
    
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
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

testLogin();
