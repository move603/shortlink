const prisma = require('../_lib/prisma');
const { getUserFromAuthHeader } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = getUserFromAuthHeader(req);
  const where = user ? { ownerId: user.id } : {};
  const links = await prisma.link.findMany({ where, select: { code: true, url: true, createdAt: true, expiresAt: true } });
  res.json({ links });
};