const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user');
const WalletModel = require('../models/wallet');
const { sequelize, DataTypes } = require('../config/sequelize');

const User = UserModel(sequelize, DataTypes);
const Wallet = WalletModel(sequelize, DataTypes);

exports.register = async (req, res) => {
  const { phone_number, full_name, national_id, pin } = req.body;

  try {
    const existingUser = await User.findOne({ where: { phone_number } });
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const password_hash = await bcrypt.hash(pin, 10);
    const newUser = await User.create({
      phone_number,
      full_name,
      national_id,
      password_hash,
      is_verified: false
    });

    // 💰 Create Wallet for New User
    await Wallet.create({
      user_id: newUser.id,
      currency: 'USD',
      balance: 0.00
    });

    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};