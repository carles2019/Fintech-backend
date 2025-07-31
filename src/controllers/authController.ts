import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here'; // ideally set via .env

/**
 * Registers a new user in the system.
 */
export const createUser = async (
  phone: string,
  name: string,
  password: string
) => {
  const existing = await User.findOne({ phone });
  if (existing) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    phone,
    name,
    password: hashedPassword,
    balance: 0,
  });

  return await user.save();
};

/**
 * Authenticates a user and returns a JWT token.
 */
export const loginUser = async (
  phone: string,
  password: string
): Promise<string | null> => {
  const user = await User.findOne({ phone });
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  const token = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return token;
};