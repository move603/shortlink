const prisma = require('../_lib/prisma');
const { getUserFromAuthHeader } = require('../_lib/auth');

module.exports = async (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) return res.status(401).json({ error: 'Missing or invalid token' });
  const links = await prisma.link.findMany({ where: { ownerId: user.id }, include: { clicks: true } });
  const overview = links.map(l => ({ code: l.code, url: l.url, clicks: l.clicks.length, lastClickAt: l.clicks.length ? l.clicks[l.clicks.length - 1].timestamp : null, expiresAt: l.expiresAt }));
  res.json({ overview });
};