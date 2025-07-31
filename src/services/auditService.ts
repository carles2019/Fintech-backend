import { TransferLog } from '../models/transferLog';

export const logTransferEvent = async (
  userId: string,
  action: 'OTP_CREATED' | 'OTP_VERIFIED' | 'TRANSFER_COMPLETED' | 'TRANSFER_FAILED',
  metadata: Record<string, any>
) => {
  await TransferLog.create({
    user: userId,
    action,
    metadata,
  });
};