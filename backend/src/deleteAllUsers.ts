import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.model';
import { UserActivity } from './models/UserActivity.model';
import { Message } from './models/Message.model';
import { Rating } from './models/Rating.model';
import { Payment } from './models/Payment.model';
import { Booking } from './models/Booking.model';
import { WorkerProfile } from './models/WorkerProfile.model';

dotenv.config();

async function deleteAllUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL as string);

    // Delete in order to respect constraints roughly (though Mongo doesn't enforce standard FK)
    console.log('Deleting dependent records...');
    await UserActivity.deleteMany({});
    await Message.deleteMany({});
    await Rating.deleteMany({});
    await Payment.deleteMany({});
    await Booking.deleteMany({});
    await WorkerProfile.deleteMany({});
    
    console.log('Deleting all users...');
    const result = await User.deleteMany({});
    
    console.log(`Successfully deleted ${result.deletedCount} users.`);
  } catch (error) {
    console.error('Error deleting users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

deleteAllUsers();
