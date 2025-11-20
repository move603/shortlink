const prisma = require('../_lib/prisma');
const { getUserFromAuthHeader } = require('../_lib/auth');

module.exports = async (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) return res.status(401).json({ error: 'Missing or invalid token' });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, createdAt: true } });
  return res.json({ user: dbUser });
};