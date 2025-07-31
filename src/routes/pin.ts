import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middlewares/auth';
import { User } from '../models/user';

const router = Router();

router.post('/setup', verifyToken, async (req, res) => {
  const userId = req.user?.id;
  const { pin } = req.body;
  if (!userId || !pin) return res.status(400).json({ error: 'PIN required' });

  const hashed = await bcrypt.hash(pin, 10);
  await User.findByIdAndUpdate(userId, { transfer_pin: hashed });
  res.json({ message: 'Transfer PIN saved' });
});

export default router;