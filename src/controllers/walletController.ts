import { getUserById, getUserByPhone } from '../services/userService';
import { createTransaction, getTransactionsForUser } from '../services/transactionService';
import { createOtp, getOtpById } from '../services/otpService';
import { sendOtpEmail } from '../services/emailService';
import { logTransferEvent } from '../services/auditService';

export const getUserBalance = async (userId: string): Promise<number> => {
  const user = await getUserById(userId);
  return user?.balance ?? 0;
};

export const getUserTransactions = async (userId: string) => {
  return await getTransactionsForUser(userId);
};

export const generateOtpForTransfer = async (
  senderId: string,
  recipientPhone: string,
  amount: number,
  pin: string
): Promise<{ otpId: string; code: string; expiresAt: Date }> => {
  const sender = await getUserById(senderId);
  if (!sender) throw new Error('Sender not found');
  if (sender.transfer_pin !== pin) throw new Error('Invalid transfer PIN');
  if (sender.balance < amount) throw new Error('Insufficient balance');

  const recipient = await getUserByPhone(recipientPhone);
  if (!recipient) throw new Error('Recipient not found');

  const otp = await createOtp({
    userId: senderId,
    type: 'TRANSFER',
    meta: {
      to: recipient.id,
      amount,
    },
  });

  if ('email' in sender && typeof sender.email === 'string') {
    await sendOtpEmail(sender.email, otp.code);
  }

  await logTransferEvent(senderId, 'OTP_CREATED', {
    otpId: otp.id,
    recipientId: recipient.id,
    amount,
  });

  return {
    otpId: otp.id,
    code: otp.code,
    expiresAt: otp.expiresAt,
  };
};

export const verifyOtpAndCompleteTransfer = async (
  otp_id: string,
  code: string
): Promise<{ success: boolean }> => {
  const otp = await getOtpById(otp_id);
  const meta = otp?.meta;

  if (!otp || otp.type !== 'TRANSFER' || !meta) {
    await logTransferEvent(otp?.user?.toString() ?? 'unknown', 'TRANSFER_FAILED', {
      reason: 'Invalid OTP or missing metadata',
      otpId: otp_id,
    });
    return { success: false };
  }

  if (otp.locked) {
    await logTransferEvent(otp.user.toString(), 'TRANSFER_FAILED', {
      reason: 'OTP is locked',
      otpId: otp_id,
      attempts: otp.attempts,
    });
    return { success: false };
  }

  if (new Date() > otp.expiresAt) {
    await logTransferEvent(otp.user.toString(), 'TRANSFER_FAILED', {
      reason: 'OTP expired',
      otpId: otp_id,
    });
    return { success: false };
  }

  const isCodeMatch = otp.code === code;

  await logTransferEvent(otp.user.toString(), 'OTP_VERIFIED', {
    otpId: otp_id,
    success: isCodeMatch,
    attempts: otp.attempts,
    locked: otp.locked,
  });

  if (!isCodeMatch) {
    otp.attempts += 1;
    if (otp.attempts >= 3) {
      otp.locked = true;
    }
    await otp.save();
    return { success: false };
  }

  const { to, amount } = meta;
  if (typeof to !== 'string' || typeof amount !== 'number') {
    await logTransferEvent(otp.user.toString(), 'TRANSFER_FAILED', {
      reason: 'Invalid transfer metadata',
      otpId: otp_id,
    });
    return { success: false };
  }

  const sender = await getUserById(otp.user.toString());
  const receiver = await getUserById(to);

  if (!sender || !receiver) {
    await logTransferEvent(otp.user.toString(), 'TRANSFER_FAILED', {
      reason: 'Sender or receiver missing',
      otpId: otp_id,
      to,
    });
    return { success: false };
  }

  if (sender.balance < amount) {
    await logTransferEvent(sender.id, 'TRANSFER_FAILED', {
      reason: 'Insufficient balance',
      otpId: otp_id,
      amount,
      to: receiver.id,
    });
    throw new Error('Insufficient balance');
  }

  sender.balance -= amount;
  receiver.balance += amount;

  await sender.save();
  await receiver.save();

  await createTransaction({
    userId: sender.id,
    type: 'TRANSFER',
    amount,
    meta: {
      to: receiver.id,
    },
  });

  await logTransferEvent(sender.id, 'TRANSFER_COMPLETED', {
    otpId: otp_id,
    to: receiver.id,
    amount,
  });

  return { success: true };
};