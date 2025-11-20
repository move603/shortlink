import validator from 'validator';

export function isValidUrl(url: string) {
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) return false;
  // Block data:, javascript:, file: etc implicitly by protocol filter
  return true;
}

export function isValidAlias(alias: string) {
  return /^[a-zA-Z0-9_-]{3,64}$/.test(alias);
}