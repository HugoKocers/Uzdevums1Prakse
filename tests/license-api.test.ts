import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createHash, randomBytes } from 'node:crypto';
import Database from 'better-sqlite3';

describe('local development license API', () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'beam-license-test-'));
  const port = 45000 + Math.floor(Math.random() * 10000);
  let server: ChildProcess;
  const baseUrl = `http://127.0.0.1:${port}`;

  beforeAll(async () => {
    server = spawn(process.execPath, [path.join(__dirname, '../license-api/server.js')], {
      env: { ...process.env, LICENSE_DB_PATH: path.join(tempDir, 'licenses.sqlite'), LICENSE_API_PORT: String(port) },
      stdio: 'ignore'
    });
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        const response = await fetch(`${baseUrl}/health`);
        if (response.ok) return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    throw new Error('License API did not start');
  }, 10000);

  afterAll(async () => {
    if (server && server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('rejects unknown licenses without leaking implementation details', async () => {
    const response = await fetch(`${baseUrl}/api/licenses/verify`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.test', licenseKey: 'not-a-key' })
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ valid: false });
  });

  it('accepts a matching email and license key stored in SQLite', async () => {
    const email = 'tester@example.test';
    const key = `DEV-${randomBytes(12).toString('hex')}`;
    const db = new Database(path.join(tempDir, 'licenses.sqlite'));
    db.prepare('INSERT INTO licenses (email, key_hash, created_at) VALUES (?, ?, ?)').run(
      email, createHash('sha256').update(key).digest('hex'), new Date().toISOString()
    );
    db.close();
    const response = await fetch(`${baseUrl}/api/licenses/verify`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.toUpperCase(), licenseKey: key })
    });
    expect(await response.json()).toEqual({ valid: true });
  });
});
