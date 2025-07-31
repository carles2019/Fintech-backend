import mongoose, { Schema, Document } from 'mongoose';

export interface UserDocument extends Document {
  name: string;
  phone: string;
  password: string;
  balance: number;
  transfer_pin?: string;
}

const UserSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  transfer_pin: { type: String },
});

export const User = mongoose.model<UserDocument>('User', UserSchema);