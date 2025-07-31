import mongoose, { Schema, Document } from 'mongoose';

export interface TransferLogDocument extends Document {
  user: mongoose.Types.ObjectId;
  action: 'OTP_CREATED' | 'OTP_VERIFIED' | 'TRANSFER_COMPLETED' | 'TRANSFER_FAILED';
  metadata: Record<string, any>;
  timestamp: Date;
}

const TransferLogSchema = new Schema<TransferLogDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, enum: ['OTP_CREATED', 'OTP_VERIFIED', 'TRANSFER_COMPLETED', 'TRANSFER_FAILED'] },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

export const TransferLog = mongoose.model<TransferLogDocument>('TransferLog', TransferLogSchema);