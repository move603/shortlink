const jwt = require('jsonwebtoken');
const { config } = require('./config');

function getUserFromAuthHeader(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return { id: payload.id, email: payload.email };
  } catch { return null; }
}

function signToken(user) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: '7d' });
}

module.exports = { getUserFromAuthHeader, signToken };