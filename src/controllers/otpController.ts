import mongoose from 'mongoose';
import { Otp } from '../models/otp';
import { User } from '../models/user';
import { createTransaction } from '../services/transactionService';

/**
 * Verifies if the provided OTP code is valid for the user.
 */
export const verifyOtpCode = async (
  userId: string,
  otpId: string,
  code: string
): Promise<boolean> => {
  const otp = await Otp.findOne({
    _id: otpId,
    user: userId,
    code,
    expiresAt: { $gt: new Date() }, // must not be expired
  }).exec();

  return Boolean(otp);
};

/**
 * Completes a money transfer after OTP validation, wrapped in a transaction.
 */
export const completeTransfer = async (
  senderId: string,
  otpId: string
): Promise<{ amount: number; recipient: { phone: string; name: string } }> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const otp = await Otp.findById(otpId).session(session).exec();
    if (!otp || otp.user.toString() !== senderId) {
      throw new Error('Invalid OTP or user mismatch');
    }

    if (!otp.meta || typeof otp.meta !== 'object') {
      throw new Error('OTP metadata missing or malformed');
    }

    const to = otp.meta['to'];
    const amount = otp.meta['amount'];

    if (typeof to !== 'string' || typeof amount !== 'number') {
      throw new Error('OTP metadata fields are invalid');
    }

    const sender = await User.findById(senderId).session(session).exec();
    const recipient = await User.findById(to).session(session).exec();

    if (!sender || !recipient) throw new Error('User not found');
    if (sender.balance < amount) throw new Error('Insufficient funds');

    // 💰 Update balances
    sender.balance -= amount;
    recipient.balance += amount;

    await sender.save({ session });
    await recipient.save({ session });

    // 🧾 Record transactions with fixed signature
    await createTransaction({
      userId: senderId,
      type: 'TRANSFER_OUT',
      amount,
      meta: { to: recipient.id },
      session,
    });

    await createTransaction({
      userId: recipient.id,
      type: 'TRANSFER_IN',
      amount,
      meta: { from: sender.id },
      session,
    });

    // 🔒 Mark OTP as used
    otp.expiresAt = new Date();
    await otp.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      amount,
      recipient: {
        phone: recipient.phone,
        name: recipient.name,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};