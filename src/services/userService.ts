import { User, UserDocument } from '../models/user';

export const getUserById = async (id: string): Promise<UserDocument | null> => {
  return await User.findById(id).exec();
};

export const getUserByPhone = async (phone: string): Promise<UserDocument | null> => {
  return await User.findOne({ phone }).exec();
};