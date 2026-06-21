import mongoose from 'mongoose';
import config from '../config/index.js';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // process.exit(1) is removed because it causes serverless function to crash abruptly
  }
};

export default connectDB;
