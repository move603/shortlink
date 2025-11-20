import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export async function verifyCaptcha(req: Request, res: Response, next: NextFunction) {
  const token = (req.body?.captchaToken || req.headers['x-captcha-token']) as string | undefined;
  if (!config.recaptchaSecret) {
    if (process.env.NODE_ENV !== 'production') return next();
    return res.status(400).json({ error: 'CAPTCHA not configured' });
  }
  if (!token) return res.status(400).json({ error: 'captchaToken is required' });
  try {
    const r = await (globalThis as any).fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: config.recaptchaSecret, response: token })
    });
    const data = await r.json();
    if (!data.success) return res.status(403).json({ error: 'CAPTCHA failed' });
    next();
  } catch (e) {
    return res.status(500).json({ error: 'CAPTCHA verification error' });
  }
}