import mongoose from 'mongoose';

const connectDB = async (retries = 5): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL as string, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    if (retries > 0) {
      console.log(`⏳ Retrying in 5s... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('💥 Could not connect to MongoDB after multiple retries.');
      process.exit(1);
    }
  }
};

export default connectDB;
