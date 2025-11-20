const prisma = require('../_lib/prisma');
const { isValidUrl, isValidAlias } = require('../_lib/validator');
const { checkSpam } = require('../_lib/spamFilter');
const { hashPassword } = require('../_lib/hash');
const { getUserFromAuthHeader } = require('../_lib/auth');

function generateCode(length = 7) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { url, alias, expiresInMinutes, expiresAt, expireAction, expireMessage, password } = req.body || {};
  if (!isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL' });
  const spamError = checkSpam(url, (process.env.SPAM_DOMAINS || '').split(',').map(s=>s.trim()).filter(Boolean));
  if (spamError) return res.status(422).json({ error: spamError });
  let code = (alias || '').trim();
  if (code) {
    if (!isValidAlias(code)) return res.status(400).json({ error: 'Invalid custom alias' });
    const exists = await prisma.link.findUnique({ where: { code } });
    if (exists) return res.status(409).json({ error: 'Alias already taken' });
  } else {
    while (true) { const c = generateCode(); const exists = await prisma.link.findUnique({ where: { code: c } }); if (!exists) { code = c; break; } }
  }
  let expAt = null;
  if (expiresInMinutes) expAt = new Date(Date.now() + Number(expiresInMinutes) * 60000);
  else if (expiresAt) { const d = new Date(expiresAt); if (!isFinite(d.getTime())) return res.status(400).json({ error: 'Invalid expiresAt' }); expAt = d; }
  const action = expireAction === 'DELETE' ? 'DELETE' : 'MESSAGE';
  const pwHash = password ? await hashPassword(password) : undefined;
  const authUser = getUserFromAuthHeader(req);
  const link = await prisma.link.create({
    data: { code, url, expiresAt: expAt || undefined, expireAction: action, expireMessage, passwordHash: pwHash, ownerId: authUser?.id }
  });
  const base = process.env.BASE_URL || req.headers['x-forwarded-host'] ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}` : '';
  const shortUrl = `${base || ''}/${link.code}`;
  return res.json({ code: link.code, shortUrl });
};