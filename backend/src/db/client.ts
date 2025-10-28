import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

const dbDirectory = path.dirname(env.dbPath);
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

export const db = new Database(env.dbPath);

db.pragma('journal_mode = WAL');
