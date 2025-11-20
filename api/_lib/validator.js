const validator = require('validator');
function isValidUrl(url) { return validator.isURL(url, { protocols: ['http','https'], require_protocol: true }); }
function isValidAlias(alias) { return /^[a-zA-Z0-9_-]{3,64}$/.test(alias || ''); }
module.exports = { isValidUrl, isValidAlias };