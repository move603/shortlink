const bcrypt = require('bcryptjs');
async function hashPassword(pw) { const salt = await bcrypt.genSalt(10); return bcrypt.hash(pw, salt); }
async function comparePassword(pw, hash) { return bcrypt.compare(pw, hash); }
module.exports = { hashPassword, comparePassword };