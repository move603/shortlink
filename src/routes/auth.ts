import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { signToken } from '../middleware/auth';

const prisma = new PrismaClient();
export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const pwHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, password: pwHash } });
    const token = signToken({ id: user.id, email: user.email });
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await import('../utils/hash').then(m => m.comparePassword(password!, user.password));
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user.id, email: user.email });
    return res.json({ token });
  } catch {
    return res.status(500).json({ error: 'Login failed' });
  }
});