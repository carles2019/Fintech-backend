import { Request, Response, NextFunction } from 'express';

export const requireRole = (roles: Array<'admin' | 'merchant' | 'user'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }

    next();
  };
};