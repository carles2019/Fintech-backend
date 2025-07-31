import { Router } from 'express';
import { verifyToken } from '../middlewares/auth';
import { requireRole } from '../middlewares/requireRole';
import { User } from '../models/user';
import { Transaction } from '../models/transaction';

const router = Router();

router.get('/users', verifyToken, requireRole(['admin']), async (req, res) => {
  const users = await User.find().select('-password -transfer_pin').exec();
  res.json({ users });
});

router.get('/transactions', verifyToken, requireRole(['admin']), async (req, res) => {
  const logs = await Transaction.find().sort({ timestamp: -1 }).limit(100).exec();
  res.json({ logs });
});

export default router;