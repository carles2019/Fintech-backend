import mongoose, { Schema, Document } from 'mongoose';

export interface TransactionDocument extends Document {
  user: mongoose.Types.ObjectId;
  type: 'TRANSFER_OUT' | 'TRANSFER_IN' | string;
  amount: number;
  timestamp: Date;
  meta?: Record<string, any>;
}

const TransactionSchema = new Schema<TransactionDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  meta: { type: Schema.Types.Mixed },
});

export const Transaction = mongoose.model<TransactionDocument>('Transaction', TransactionSchema);