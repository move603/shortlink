const { PrismaClient } = require('@prisma/client');
let prisma = global.__prisma || null;
if (!prisma) {
  prisma = new PrismaClient();
  global.__prisma = prisma;
}
module.exports = prisma;