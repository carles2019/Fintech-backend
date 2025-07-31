const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authenticate = require('../middleware/authMiddleware');
const { transferRateLimiter } = require('../middleware/authMiddleware');

router.get('/balance', authenticate, walletController.getBalance);
router.post('/fund', authenticate, walletController.fundWallet);
router.post('/transfer', authenticate, walletController.transferFunds);
router.get('/history', authenticate, walletController.getTransactionHistory);
router.get('/statement', authenticate, walletController.getWalletStatement);
router.get('/statement/download', authenticate, walletController.downloadWalletStatement);
router.post('/set-pin', authenticate, walletController.setTransferPin);
router.post('/transfer', authenticate, transferRateLimiter, walletController.transferFunds);
router.post('/transfer/initiate', authenticate, walletController.initiateSecureTransfer);
router.post('/transfer/verify', authenticate, walletController.verifyOtpAndTransfer);
router.post('/transfer/initiate', authenticate, walletController.initiateSecureTransfer);
router.post('/transfer/verify', authenticate, walletController.verifyOtpAndTransfer);

module.exports = router;