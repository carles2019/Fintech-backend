import { Router, Request, Response } from 'express';
import { verifyToken } from '../middlewares/auth';
import {
  getUserBalance,
  getUserTransactions,
  generateOtpForTransfer,
  verifyOtpAndCompleteTransfer
} from '../controllers/walletController';

const router = Router();

// GET /wallet/balance
router.get('/balance', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const balance = await getUserBalance(userId);
    res.json({ balance });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /wallet/statement
router.get('/statement', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const transactions = await getUserTransactions(userId);
    res.json({ transactions });
  } catch (error) {
    console.error('Statement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /wallet/transfer
router.post('/transfer', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { to, amount, transfer_pin } = req.body;

    if (!userId || !to || !amount || !transfer_pin) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const otp = await generateOtpForTransfer(userId, to, amount, transfer_pin);

    // 🔧 Use correct key from returned object
    res.json({ message: 'OTP sent', otp_id: otp.otpId });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /wallet/verify-otp
router.post('/verify-otp', verifyToken, async (req: Request, res: Response) => {
  try {
    const { otp_id, code } = req.body;
    if (!otp_id || !code) {
      return res.status(400).json({ error: 'Missing OTP data' });
    }

    const result = await verifyOtpAndCompleteTransfer(otp_id, code);
    if (!result.success) {
      return res.status(400).json({ error: 'OTP verification failed' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;