import { Router, Request, Response } from 'express';
import { verifyToken } from '../middlewares/auth';
import { verifyOtpCode, completeTransfer } from '../controllers/otpController';

const router = Router();

router.post('/verify-otp', verifyToken, async (req: Request, res: Response) => {
  try {
    const { otp_id, code } = req.body;
    const userId = req.user?.id;

    if (!otp_id || !code || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const success = await verifyOtpCode(userId, otp_id, code);

    if (!success) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    const finalTransfer = await completeTransfer(userId, otp_id);
    res.json({ success: true, transfer: finalTransfer });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;