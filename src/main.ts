import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import Database from 'better-sqlite3';
import { calculateCapacity, type BeamInputs, type Calculation } from './shared/calculation';
import type { LicenseCredentials, LicenseResult } from './shared/license';

let database: Database.Database;

function openDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'beam-calculations.sqlite');
  database = new Database(dbPath);
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      length REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      strength REAL NOT NULL,
      section_modulus REAL NOT NULL,
      capacity REAL NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
}

function registerIpcHandlers(): void {
  ipcMain.handle('calculation:save', (_event, inputs: BeamInputs): Calculation => {
    const result = calculateCapacity(inputs);
    const createdAt = new Date().toISOString();
    const inserted = database.prepare(`
      INSERT INTO calculations (length, width, height, strength, section_modulus, capacity, created_at)
      VALUES (@length, @width, @height, @strength, @sectionModulus, @capacity, @createdAt)
    `).run({ ...result, createdAt });
    return { ...result, createdAt, id: Number(inserted.lastInsertRowid) };
  });

  ipcMain.handle('calculation:history', (): Calculation[] => database.prepare(`
    SELECT id, length, width, height, strength, section_modulus AS sectionModulus,
           capacity, created_at AS createdAt
    FROM calculations ORDER BY id DESC LIMIT 100
  `).all() as Calculation[]);

  ipcMain.handle('license:verify', async (_event, credentials: LicenseCredentials): Promise<LicenseResult> => {
    const email = credentials?.email?.trim();
    const licenseKey = credentials?.licenseKey?.trim();
    if (!email || !licenseKey) return { valid: false, message: 'Ievadiet e-pastu un licences atslēgu.' };
    try {
      const response = await fetch(process.env.LICENSE_API_URL || 'http://127.0.0.1:4318/api/licenses/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, licenseKey }),
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) return { valid: false, message: 'Licence nav derīga. Pārbaudiet datus un lokālā API statusu.' };
      const payload = await response.json() as { valid?: boolean };
      return payload.valid
        ? { valid: true, message: 'Licence pārbaudīta.' }
        : { valid: false, message: 'Licence nav derīga šim e-pastam.' };
    } catch {
      return { valid: false, message: 'Nevar sasniegt lokālo izstrādes licenču API (127.0.0.1:4318).' };
    }
  });
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1240,
    height: 900,
    minWidth: 920,
    minHeight: 680,
    backgroundColor: '#f5f4ef',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
}

app.whenReady().then(() => {
  openDatabase();
  registerIpcHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => database?.close());
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
