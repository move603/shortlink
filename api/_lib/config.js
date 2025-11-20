require('dotenv').config();
const config = {
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  baseUrl: process.env.BASE_URL || '',
};
module.exports = { config };