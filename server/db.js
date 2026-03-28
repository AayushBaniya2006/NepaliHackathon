import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = join(__dirname, '..', 'data');
mkdirSync(dbDir, { recursive: true });

const db = new Database(join(dbDir, 'mindcanvas.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('patient', 'caregiver')),
    is_nonverbal INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    prompt_id TEXT NOT NULL,
    image_data TEXT,
    stress_score REAL,
    feedback_short TEXT,
    feedback_emoji TEXT,
    personal_statement TEXT,
    pattern TEXT,
    threshold_met INTEGER DEFAULT 0,
    clinical_note_json TEXT,
    insurance_data_json TEXT,
    caregiver_note_json TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS session_strokes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    timestamp_ms INTEGER NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    color TEXT,
    speed REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    session_id TEXT REFERENCES sessions(id),
    prompt_id TEXT,
    stress_score REAL,
    indicators_json TEXT,
    pattern TEXT,
    threshold_met INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at)');
db.exec('CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id)');

export default db;
