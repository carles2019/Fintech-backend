import mongoose, { Schema, Document, Types } from 'mongoose';

export interface OtpDocument extends Document {
  user: Types.ObjectId;
  type: string; // e.g. 'TRANSFER', 'LOGIN'
  code: string;
  meta?: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  locked: boolean;
}

const OtpSchema = new Schema<OtpDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  code: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    index: { expireAfterSeconds: 0 }, // ✅ TTL index for auto-prune
  },
  attempts: {
    type: Number,
    default: 0, // ✅ Tracks failed verification attempts
  },
  locked: {
    type: Boolean,
    default: false, // ✅ Blocks OTP after 3 failed tries
  },
});

export const Otp = mongoose.model<OtpDocument>('Otp', OtpSchema);