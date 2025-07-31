import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import walletRoutes from './routes/wallet';
import otpRoutes from './routes/otp';
import { errorHandler } from './middlewares/errorHandlers';


const app = express();

// Middleware
app.use(cors());
app.use(errorHandler);

const logger = morgan('dev'); // ✅ Helps TypeScript resolve overload
app.use(logger);

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/otp', otpRoutes);

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.send('Fintech API is running ✅');
});

export default app;