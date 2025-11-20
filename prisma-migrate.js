const { execSync } = require('child_process');
try {
  console.log('Running prisma migrate deploy...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Prisma migrate deploy completed.');
} catch (e) {
  console.error('Prisma migrate deploy failed:', e.message);
  process.exit(1);
}