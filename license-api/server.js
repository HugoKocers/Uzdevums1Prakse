const http = require('node:http');
const { createHash, timingSafeEqual } = require('node:crypto');
const { openLicenseDatabase } = require('./db');

const host = '127.0.0.1';
const port = Number(process.env.LICENSE_API_PORT || 4318);
const db = openLicenseDatabase();
const insertLicense = db.prepare('INSERT OR IGNORE INTO licenses (email, key_hash, created_at) VALUES (?, ?, ?)');
const findLicenses = db.prepare('SELECT key_hash FROM licenses WHERE email = ?');

function send(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 8192) {
        reject(new Error('Request body too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); }
    });
    request.on('error', reject);
  });
}

function sameHash(a, b) {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);
  if (request.method === 'GET' && url.pathname === '/health') return send(response, 200, { ok: true, prototype: true });
  if (request.method !== 'POST' || url.pathname !== '/api/licenses/verify') return send(response, 404, { error: 'Not found' });
  try {
    const body = await readJson(request);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const key = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';
    if (!email || !key || email.length > 254 || key.length > 256) return send(response, 400, { valid: false, error: 'Email and licenseKey are required' });
    const keyHash = createHash('sha256').update(key).digest('hex');
    const stored = findLicenses.all(email);
    const valid = stored.some((license) => sameHash(license.key_hash, keyHash));
    return send(response, 200, { valid });
  } catch {
    return send(response, 400, { valid: false, error: 'Invalid request' });
  }
});

server.listen(port, host, () => {
  console.log(`Local development license API listening at http://${host}:${port}`);
  console.log('Prototype only — do not expose this service as production licensing infrastructure.');
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
