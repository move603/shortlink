import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
export const analyticsRouter = Router();

analyticsRouter.get('/overview', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as number;
  const links = await prisma.link.findMany({ where: { ownerId: userId }, include: { clicks: true } });
  const overview = links.map(l => ({
    code: l.code,
    url: l.url,
    clicks: l.clicks.length,
    lastClickAt: l.clicks.length ? l.clicks[l.clicks.length - 1].timestamp : null,
    expiresAt: l.expiresAt,
  }));
  res.json({ overview });
});