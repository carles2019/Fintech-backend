const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const redisClient = require('./config/redis');

const { sequelize, DataTypes } = require('./config/sequelize');
const UserModel = require('./models/user')(sequelize, DataTypes);
const WalletModel = require('./models/wallet')(sequelize, DataTypes);
const TransactionModel = require('./models/transaction')(sequelize, DataTypes);

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// 🚦 Health Check Route
app.get('/health', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT NOW()');
    const redisPing = await redisClient.ping();

    res.json({
      status: 'ok',
      dbTime: rows[0].now,
      redis: redisPing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Health check failed 😬' });
  }
});

// 🔖 Default Route
app.get('/', (req, res) => {
  res.send('Fintech API is live 🚀');
});

// 🔐 Auth Routes
app.use('/api/auth', authRoutes);

// 💼 Wallet Routes
app.use('/api/wallet', walletRoutes);

// 🔄 DB Sync and Server Start
sequelize.sync({ alter: true })
  .then(() => {
    console.log('🧠 DB synced');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB sync error:', err);
  });

  import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import Toast from 'react-native-toast-message';
import MainStack from './src/navigation/MainStack'; // your screens
import { toastConfig } from './src/utils/toastConfig'; // optional custom config

export default function App() {
  return (
    <>
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
      <Toast />
    </>
  );
}
Toast.setRef(toastConfig);

import { restoreToken } from '@/utils/auth';
import { useEffect, useState } from 'react';

const [isReady, setIsReady] = useState(false);
const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  (async () => {
    const valid = await restoreToken();
    setIsLoggedIn(valid);
    setIsReady(true);
  })();
}, []);