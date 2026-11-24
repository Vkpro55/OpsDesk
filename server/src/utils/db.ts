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

// Auto-attaches the active transaction's session to every operation inside the callback,
// so a forgotten `{ session }` can't silently write outside the transaction.
mongoose.set('transactionAsyncLocalStorage', true);

// Retries on transient conflicts and always ends the session.
export const withTransaction = <T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> => mongoose.connection.transaction(fn);