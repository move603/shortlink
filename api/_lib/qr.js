const QRCode = require('qrcode');
async function generateQrPng(text) { return QRCode.toBuffer(text, { type: 'png', errorCorrectionLevel: 'M', width: 256 }); }
module.exports = { generateQrPng };