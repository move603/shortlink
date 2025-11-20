import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import urlLib from 'url';

export function spamFilter(req: Request, res: Response, next: NextFunction) {
  const { url } = req.body as { url?: string };
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    const parsed = new urlLib.URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (config.spamDomains.includes(hostname)) {
      return res.status(422).json({ error: 'URL domain is blocked' });
    }
    if (/(@@|\x00|%00|<script|onerror=|onload=)/i.test(url)) {
      return res.status(422).json({ error: 'URL appears malicious' });
    }
    // Block plain IPs if desired
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      // allow localhost
      if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
        return res.status(422).json({ error: 'IP-only URLs are not allowed' });
      }
    }
    next();
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
}