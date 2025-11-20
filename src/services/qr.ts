import QRCode from 'qrcode';

export async function generateQrPng(text: string) {
  return QRCode.toBuffer(text, { type: 'png', errorCorrectionLevel: 'M', width: 256 });
}