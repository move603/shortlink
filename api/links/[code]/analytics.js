const prisma = require('../../_lib/prisma');
const { getUserFromAuthHeader } = require('../../_lib/auth');

module.exports = async (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) return res.status(401).json({ error: 'Missing or invalid token' });
  const { code } = req.query;
  const { from, to, country, device } = req.query;
  const link = await prisma.link.findUnique({ where: { code }, include: { clicks: true } });
  if (!link) return res.status(404).json({ error: 'Not found' });
  let clicks = link.clicks;
  if (from) { const f = new Date(from); clicks = clicks.filter(c => c.timestamp >= f); }
  if (to) { const t = new Date(to); clicks = clicks.filter(c => c.timestamp <= t); }
  if (country) clicks = clicks.filter(c => c.country === country);
  if (device) clicks = clicks.filter(c => c.device === device);
  const ctr = clicks.length;
  const byCountry = {}; const byDevice = {}; const byReferer = {}; const byDay = {};
  for (const c of clicks) {
    if (c.country) byCountry[c.country] = (byCountry[c.country] || 0) + 1;
    if (c.device) byDevice[c.device] = (byDevice[c.device] || 0) + 1;
    if (c.referer) byReferer[c.referer] = (byReferer[c.referer] || 0) + 1;
    const day = new Date(c.timestamp).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }
  res.json({ ctr, totals: { clicks: clicks.length }, byCountry, byDevice, byReferer, byDay });
};