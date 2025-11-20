import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { comparePassword } from '../utils/hash';
import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';
import { sendGaEvent } from '../services/ga';

const prisma = new PrismaClient();
export const redirectRouter = Router();

redirectRouter.get('/:code', async (req, res) => {
  const { code } = req.params;
  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) return res.status(404).send('Not found');
  const now = new Date();
  if (link.expiresAt && now >= link.expiresAt) {
    if (link.expireAction === 'DELETE') {
      await prisma.link.delete({ where: { id: link.id } });
      return res.status(410).send('This link has expired and was removed');
    } else {
      return res.status(410).send(link.expireMessage || 'This link has expired');
    }
  }
  if (link.passwordHash) {
    const provided = (req.query.pw as string) || '';
    if (!provided) {
      return res.sendFile('password.html', { root: 'public' });
    }
    const ok = await comparePassword(provided, link.passwordHash);
    if (!ok) return res.status(401).send('Invalid password');
  }
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined;
  const geo = ip ? geoip.lookup(ip) : null;
  const ua = new UAParser(req.headers['user-agent'] || '');
  await prisma.clickEvent.create({
    data: {
      linkId: link.id,
      ip,
      country: geo?.country,
      city: geo?.city,
      device: ua.device.type || 'desktop',
      os: ua.os.name || undefined,
      browser: ua.browser.name || undefined,
      referer: req.headers.referer as string | undefined,
    }
  });
  sendGaEvent('link_click', { link_code: code, url: link.url, client_id: ip || '555' });
  res.redirect(link.url);
});