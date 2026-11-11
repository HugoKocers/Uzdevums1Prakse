const { randomBytes, createHash } = require('node:crypto');
const { openLicenseDatabase } = require('./db');

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run license:issue -- name@example.com');
  process.exit(1);
}

const licenseKey = `DEV-${randomBytes(18).toString('base64url').toUpperCase()}`;
const db = openLicenseDatabase();
db.prepare('INSERT INTO licenses (email, key_hash, created_at) VALUES (?, ?, ?)').run(
  email,
  createHash('sha256').update(licenseKey).digest('hex'),
  new Date().toISOString()
);
db.close();
console.log(`Development license created for ${email}`);
console.log(`License key (save it now): ${licenseKey}`);
console.log('This local-development prototype is not suitable for production licensing.');
