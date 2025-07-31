declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone?: string;
        role?: 'user' | 'admin' | 'merchant';
        email?: string; // ✅ added email for OTP delivery
        [key: string]: any; // ✅ allows extra dynamic fields if needed
      };
    }
  }
}

export {};