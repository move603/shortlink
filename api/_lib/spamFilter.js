const { URL } = require('url');
function checkSpam(url, spamDomains = []) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (spamDomains.includes(hostname)) return 'URL domain is blocked';
    if (/(@@|\x00|%00|<script|onerror=|onload=)/i.test(url)) return 'URL appears malicious';
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      if (hostname !== '127.0.0.1' && hostname !== 'localhost') return 'IP-only URLs are not allowed';
    }
    return null;
  } catch {
    return 'Invalid URL';
  }
}
module.exports = { checkSpam };