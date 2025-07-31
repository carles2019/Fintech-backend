const WalletModel = require('../models/wallet');
const TransactionModel = require('../models/transaction');
const UserModel = require('../models/user');
const { sequelize, DataTypes } = require('../config/sequelize');
const { Op } = require('sequelize');
const fs = require('fs');
const fastcsv = require('fast-csv');
const bcrypt = require('bcrypt'); // 🔐 Added for PIN hashing and comparison

const Wallet = WalletModel(sequelize, DataTypes);
const Transaction = TransactionModel(sequelize, DataTypes);
const User = UserModel(sequelize, DataTypes);

// 👛 Set Transfer PIN
exports.setTransferPin = async (req, res) => {
  const { pin } = req.body;

  if (!pin || pin.length < 4 || pin.length > 6) {
    return res.status(400).json({ error: 'PIN must be 4–6 digits' });
  }

  try {
    const user = await User.findByPk(req.user.userId);
    const salt = await bcrypt.genSalt(10);
    user.transfer_pin = await bcrypt.hash(pin, salt);
    await user.save();

    res.json({ message: 'Transfer PIN set successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to set PIN' });
  }
};

// 🔄 Transfer Funds (Updated with PIN verification)
exports.transferFunds = async (req, res) => {
  const { recipient_phone, amount, pin } = req.body;

  if (!recipient_phone || !amount || amount <= 0 || !pin) {
    return res.status(400).json({ error: 'Missing or invalid transfer details' });
  }

  try {
    const senderWallet = await Wallet.findOne({ where: { user_id: req.user.userId } });
    const user = await User.findByPk(req.user.userId);

    const pinMatch = await bcrypt.compare(pin, user.transfer_pin || '');
    if (!pinMatch) {
      return res.status(403).json({ error: 'Invalid transfer PIN' });
    }

    if (!senderWallet || senderWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds or wallet not found' });
    }

    const recipientUser = await User.findOne({ where: { phone_number: recipient_phone } });
    if (!recipientUser) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipientWallet = await Wallet.findOne({ where: { user_id: recipientUser.id } });
    if (!recipientWallet) {
      return res.status(404).json({ error: 'Recipient wallet not found' });
    }

    senderWallet.balance -= parseFloat(amount);
    recipientWallet.balance += parseFloat(amount);

    await senderWallet.save();
    await recipientWallet.save();

    await Transaction.create({
      wallet_id: senderWallet.id,
      type: 'TRANSFER_OUT',
      amount: parseFloat(amount),
      meta: { to: recipientUser.id, phone: recipient_phone }
    });

    await Transaction.create({
      wallet_id: recipientWallet.id,
      type: 'TRANSFER_IN',
      amount: parseFloat(amount),
      meta: { from: req.user.userId }
    });

    res.json({ message: 'Transfer complete', from: req.user.userId, to: recipientUser.id, amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transfer failed' });
  }
};

const crypto = require('crypto');
const nodemailer = require('nodemailer');

const otpStore = new Map(); // Use Redis in production

exports.initiateSecureTransfer = async (req, res) => {
  const { recipient_phone, amount, pin } = req.body;

  if (!recipient_phone || !amount || amount <= 0 || !pin) {
    return res.status(400).json({ error: 'Missing or invalid transfer details' });
  }

  try {
    const user = await User.findByPk(req.user.userId);
    const pinValid = await bcrypt.compare(pin, user.transfer_pin || '');
    if (!pinValid) return res.status(403).json({ error: 'Incorrect transfer PIN' });

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(req.user.userId, { otp, expires: Date.now() + 5 * 60 * 1000 });

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transport.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Wallet'}" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Your OTP for Secure Transfer',
      text: `Your one-time code is: ${otp}. This expires in 5 minutes.`
    });

    res.json({ message: 'OTP sent to your email. Proceed to verify.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to initiate secure transfer' });
  }
};

exports.verifyOtpAndTransfer = async (req, res) => {
  const { recipient_phone, amount, otp } = req.body;

  const cached = otpStore.get(req.user.userId);
  if (!cached || cached.otp !== otp || cached.expires < Date.now()) {
    return res.status(403).json({ error: 'Invalid or expired OTP' });
  }

  try {
    const senderWallet = await Wallet.findOne({ where: { user_id: req.user.userId } });
    if (!senderWallet || senderWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds or wallet not found' });
    }

    const recipientUser = await User.findOne({ where: { phone_number: recipient_phone } });
    if (!recipientUser) return res.status(404).json({ error: 'Recipient not found' });

    const recipientWallet = await Wallet.findOne({ where: { user_id: recipientUser.id } });
    if (!recipientWallet) return res.status(404).json({ error: 'Recipient wallet not found' });

    senderWallet.balance -= parseFloat(amount);
    recipientWallet.balance += parseFloat(amount);
    await senderWallet.save();
    await recipientWallet.save();

    await Transaction.create({
      wallet_id: senderWallet.id,
      type: 'TRANSFER_OUT',
      amount: parseFloat(amount),
      meta: { to: recipientUser.id, phone: recipient_phone }
    });

    await Transaction.create({
      wallet_id: recipientWallet.id,
      type: 'TRANSFER_IN',
      amount: parseFloat(amount),
      meta: { from: req.user.userId }
    });

    otpStore.delete(req.user.userId);

    res.json({ message: 'Transfer completed with OTP verification' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transfer failed during OTP verification' });
  }
};

// 📘 Wallet Statement Summary
exports.getWalletStatement = async (req, res) => {
  const { start_date, end_date, sender_id } = req.query;

  try {
    const wallet = await Wallet.findOne({ where: { user_id: req.user.userId } });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const whereClause = { wallet_id: wallet.id };

    if (start_date || end_date) {
      whereClause.timestamp = {};
      if (start_date) whereClause.timestamp[Op.gte] = new Date(start_date);
      if (end_date) whereClause.timestamp[Op.lte] = new Date(end_date);
    }

    if (sender_id) {
      whereClause.type = 'TRANSFER_IN';
      whereClause.meta = { from: sender_id };
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']]
    });

    const summary = {
      total_count: transactions.length,
      total_funded: 0,
      total_received: 0,
      total_sent: 0,
      last_transaction: transactions[0] || null
    };

    for (const txn of transactions) {
      if (txn.type === 'FUND') summary.total_funded += txn.amount;
      if (txn.type === 'TRANSFER_IN') summary.total_received += txn.amount;
      if (txn.type === 'TRANSFER_OUT') summary.total_sent += txn.amount;
    }

    res.json({ statement: summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate wallet statement' });
  }
};

exports.initiateSecureTransfer = async (req, res) => {
  // ...initiateSecureTransfer code...
};

exports.verifyOtpAndTransfer = async (req, res) => {
  // ...verifyOtpAndTransfer code...
};

// 🧾 Wallet Statement CSV Download
exports.downloadWalletStatement = async (req, res) => {
  const { start_date, end_date, sender_id } = req.query;

  try {
    const wallet = await Wallet.findOne({ where: { user_id: req.user.userId } });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const whereClause = { wallet_id: wallet.id };

    if (start_date || end_date) {
      whereClause.timestamp = {};
      if (start_date) whereClause.timestamp[Op.gte] = new Date(start_date);
      if (end_date) whereClause.timestamp[Op.lte] = new Date(end_date);
    }

    if (sender_id) {
      whereClause.type = 'TRANSFER_IN';
      whereClause.meta = { from: sender_id };
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']]
    });

    const csvStream = fastcsv.format({ headers: true });
    res.setHeader('Content-Disposition', 'attachment; filename=statement.csv');
    res.setHeader('Content-Type', 'text/csv');

    csvStream.pipe(res);
    for (const txn of transactions) {
      csvStream.write({
        ID: txn.id,
        Type: txn.type,
        Amount: txn.amount,
        Timestamp: txn.timestamp,
        Meta: JSON.stringify(txn.meta || {})
      });
    }
    csvStream.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
};