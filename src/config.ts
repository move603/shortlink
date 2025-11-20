import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
  jwtSecret: process.env.JWT_SECRET || 'change_me_in_env',
  sslCertFile: process.env.SSL_CERT_FILE || '',
  sslKeyFile: process.env.SSL_KEY_FILE || '',
  recaptchaSecret: process.env.RECAPTCHA_SECRET || '',
  gaMeasurementId: process.env.GA_MEASUREMENT_ID || '',
  gaApiSecret: process.env.GA_API_SECRET || '',
  spamDomains: (process.env.SPAM_DOMAINS || '').split(',').map(s => s.trim()).filter(Boolean),
};

export function readSslCredentials() {
  if (!config.sslCertFile || !config.sslKeyFile) return null;
  try {
    const cert = fs.readFileSync(path.resolve(config.sslCertFile));
    const key = fs.readFileSync(path.resolve(config.sslKeyFile));
    return { cert, key };
  } catch {
    return null;
  }
}