import { User } from '../models/user';

export const updateUserBalance = async (userId: string, amount: number) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.balance += amount;
  await user.save();
  return user.balance;
};