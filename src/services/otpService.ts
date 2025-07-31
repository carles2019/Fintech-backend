import { Otp } from '../models/otp';

/**
 * Creates a new OTP document for a transfer.
 */
export const createOtp = async ({
  userId,
  type,
  meta,
}: {
  userId: string;
  type: string;
  meta: Record<string, any>;
}) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  const otp = new Otp({
    userId,
    type,
    code,
    meta,
    createdAt: new Date(),
  });

  await otp.save();
  return otp;
};

/**
 * Retrieves an OTP document by its ID.
 */
export const getOtpById = async (otpId: string) => {
  return await Otp.findById(otpId);
};