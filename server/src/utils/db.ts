import mongoose, { ClientSession } from 'mongoose';
import { config } from '../config/config.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUrl);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB: ', error);
    process.exit(1);
  }
};

// Forgotten { session } can't escape transaction.
mongoose.set('transactionAsyncLocalStorage', true);

export const withTransaction = <T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> => mongoose.connection.transaction(fn);