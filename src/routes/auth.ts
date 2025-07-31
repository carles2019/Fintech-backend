import { Router, Request, Response } from 'express';

const router = Router();

// Example controller imports (update paths as needed)
import { loginUser, createUser } from '../controllers/authController';

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const token = await loginUser(phone, password);
    if (!token) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, name, password } = req.body;

    if (!phone || !name || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await createUser(phone, name, password);
    res.status(201).json({ user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;