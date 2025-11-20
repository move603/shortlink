const prisma = require('./_lib/prisma');
const { comparePassword } = require('./_lib/hash');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

module.exports = async (req, res) => {
  const { code } = req.query;
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
    const provided = (req.query.pw) || '';
    if (!provided) return res.status(401).send('Password required');
    const ok = await comparePassword(provided, link.passwordHash);
    if (!ok) return res.status(401).send('Invalid password');
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || undefined;
  const geo = ip ? geoip.lookup(ip) : null;
  const ua = new UAParser(req.headers['user-agent'] || '');
  await prisma.clickEvent.create({
    data: { linkId: link.id, ip, country: geo?.country, city: geo?.city, device: ua.getDevice().type || 'desktop', os: ua.getOS().name, browser: ua.getBrowser().name, referer: req.headers['referer'] }
  });
  res.redirect(302, link.url);
};