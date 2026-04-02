import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.model';

dotenv.config();

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL as string);

    const adminEmail = 'superadmin@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin@123', salt);

    await User.create({
      name: 'Super Admin',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN' // Ensure this matches exactly the Role enum
    });

    console.log('Admin user seeded successfully. Email: superadmin@gmail.com, Password: admin@123');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
