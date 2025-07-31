import mongoose from 'mongoose';
import { Transaction } from '../models/transaction';

export const getTransactionsForUser = async (userId: string) => {
  return await Transaction.find({ user: userId }).sort({ timestamp: -1 }).limit(50).exec();
};

/**
 * Creates a transaction document using a single object parameter.
 */
export const createTransaction = async ({
  userId,
  type,
  amount,
  meta,
  session,
}: {
  userId: string;
  type: string;
  amount: number;
  meta?: Record<string, any>;
  session?: mongoose.ClientSession;
}) => {
  const txn = new Transaction({
    user: userId,
    type,
    amount,
    timestamp: new Date(),
    meta,
  });

  return await txn.save({ session });
};