const prisma = require('../_lib/prisma');
const { hashPassword } = require('../_lib/hash');
const { signToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const pwHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, password: pwHash } });
    const token = signToken({ id: user.id, email: user.email });
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: 'Registration failed' });
  }
};