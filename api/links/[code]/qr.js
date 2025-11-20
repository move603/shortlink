const prisma = require('../../_lib/prisma');
const { generateQrPng } = require('../../_lib/qr');

module.exports = async (req, res) => {
  const { code } = req.query;
  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) return res.status(404).send('Not found');
  const base = process.env.BASE_URL || req.headers['x-forwarded-host'] ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}` : '';
  const buf = await generateQrPng(`${base || ''}/${code}`);
  res.setHeader('Content-Type', 'image/png');
  res.send(buf);
};