import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { spamFilter } from '../middleware/spamFilter';
import { createStrictLimiter } from '../middleware/rateLimit';
import { isValidUrl, isValidAlias } from '../utils/validator';
import { hashPassword, comparePassword } from '../utils/hash';
import { config } from '../config';
import { sendGaEvent } from '../services/ga';
import { generateQrPng } from '../services/qr';
import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';

const prisma = new PrismaClient();
export const linksRouter = Router();

function generateCode(length = 7) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

linksRouter.post('/', requireAuth, createStrictLimiter, spamFilter, async (req, res) => {
  const { url, alias, expiresInMinutes, expiresAt, expireAction, expireMessage, password } = req.body as any;
  if (!isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL' });
  let code = alias?.trim();
  if (code) {
    if (!isValidAlias(code)) return res.status(400).json({ error: 'Invalid custom alias' });
    const exists = await prisma.link.findUnique({ where: { code } });
    if (exists) return res.status(409).json({ error: 'Alias already taken' });
  } else {
    // generate unique
    while (true) {
      const c = generateCode();
      const exists = await prisma.link.findUnique({ where: { code: c } });
      if (!exists) { code = c; break; }
    }
  }

  let expAt: Date | null = null;
  if (expiresInMinutes) {
    expAt = new Date(Date.now() + Number(expiresInMinutes) * 60_000);
  } else if (expiresAt) {
    const d = new Date(expiresAt);
    if (!isFinite(d.getTime())) return res.status(400).json({ error: 'Invalid expiresAt' });
    expAt = d;
  }
  const action = expireAction === 'DELETE' ? 'DELETE' : 'MESSAGE';
  const pwHash = password ? await hashPassword(password) : undefined;

  const link = await prisma.link.create({
    data: {
      code,
      url,
      expiresAt: expAt || undefined,
      expireAction: action as any,
      expireMessage: expireMessage,
      passwordHash: pwHash,
      ownerId: (req as any).user?.id || undefined,
    }
  });
  return res.json({ code: link.code, shortUrl: `${config.baseUrl}/${link.code}` });
});

linksRouter.get('/:code/qr', async (req, res) => {
  const { code } = req.params;
  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) return res.status(404).send('Not found');
  const buf = await generateQrPng(`${config.baseUrl}/${code}`);
  res.setHeader('Content-Type', 'image/png');
  res.send(buf);
});

linksRouter.post('/bulk', requireAuth, createStrictLimiter, async (req, res) => {
  const items: { url: string; alias?: string }[] = req.body?.items || [];
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });
  const results: any[] = [];
  for (const item of items) {
    if (!isValidUrl(item.url)) { results.push({ error: 'invalid url', input: item }); continue; }
    let code = item.alias?.trim();
    if (code) {
      if (!isValidAlias(code)) { results.push({ error: 'invalid alias', input: item }); continue; }
      const exists = await prisma.link.findUnique({ where: { code } });
      if (exists) { results.push({ error: 'alias taken', input: item }); continue; }
    } else {
      while (true) { const c = generateCode(); const exists = await prisma.link.findUnique({ where: { code: c } }); if (!exists) { code = c; break; } }
    }
    const l = await prisma.link.create({ data: { code: code!, url: item.url, ownerId: (req as any).user?.id } });
    results.push({ code: l.code, shortUrl: `${config.baseUrl}/${l.code}` });
  }
  res.json({ results });
});

linksRouter.get('/:code', async (req, res) => {
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
  // log analytics
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

linksRouter.get('/:code/analytics', requireAuth, async (req, res) => {
  const { code } = req.params;
  const { from, to, country, device } = req.query as any;
  const link = await prisma.link.findUnique({ where: { code }, include: { clicks: true } });
  if (!link) return res.status(404).json({ error: 'Not found' });
  let clicks = link.clicks;
  if (from) { const f = new Date(from); clicks = clicks.filter(c => c.timestamp >= f); }
  if (to) { const t = new Date(to); clicks = clicks.filter(c => c.timestamp <= t); }
  if (country) clicks = clicks.filter(c => c.country === country);
  if (device) clicks = clicks.filter(c => c.device === device);

  const ctr = clicks.length; // simple CTR: total clicks
  const byCountry: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const byReferer: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  for (const c of clicks) {
    if (c.country) byCountry[c.country] = (byCountry[c.country] || 0) + 1;
    if (c.device) byDevice[c.device] = (byDevice[c.device] || 0) + 1;
    if (c.referer) byReferer[c.referer] = (byReferer[c.referer] || 0) + 1;
    const day = c.timestamp.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }
  res.json({ ctr, totals: { clicks: clicks.length }, byCountry, byDevice, byReferer, byDay });
});