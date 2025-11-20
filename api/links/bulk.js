const prisma = require('../_lib/prisma');
const { isValidUrl, isValidAlias } = require('../_lib/validator');
const { getUserFromAuthHeader } = require('../_lib/auth');

function generateCode(length = 7) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const items = (req.body && req.body.items) || [];
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });
  const user = getUserFromAuthHeader(req);
  const results = [];
  for (const item of items) {
    if (!isValidUrl(item.url)) { results.push({ error: 'invalid url', input: item }); continue; }
    let code = (item.alias || '').trim();
    if (code) {
      if (!isValidAlias(code)) { results.push({ error: 'invalid alias', input: item }); continue; }
      const exists = await prisma.link.findUnique({ where: { code } });
      if (exists) { results.push({ error: 'alias taken', input: item }); continue; }
    } else {
      while (true) { const c = generateCode(); const exists = await prisma.link.findUnique({ where: { code: c } }); if (!exists) { code = c; break; } }
    }
    const l = await prisma.link.create({ data: { code, url: item.url, ownerId: user?.id } });
    const base = process.env.BASE_URL || req.headers['x-forwarded-host'] ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}` : '';
    results.push({ code: l.code, shortUrl: `${base || ''}/${l.code}` });
  }
  res.json({ results });
};