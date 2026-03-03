import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(process.env.USERPROFILE || process.env.HOME || '', '.cc-switch', 'cc-switch.db');
const db = new Database(DB_PATH, { readonly: true });

export default db;
