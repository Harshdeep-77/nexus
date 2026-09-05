import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'nexus.db');
const db = new Database(dbPath);
console.log(`Connected to SQLite database at ${dbPath}`);

// Enforce foreign key constraints (SQLite has this OFF by default)
db.pragma('foreign_keys = ON');

// Create tables if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    role TEXT DEFAULT 'user',
    isActive INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
 isActive INTEGER DEFAULT 1,  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

   CREATE TABLE IF NOT EXISTS project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status  TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    isActive INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

`);

// Add role column if it doesn't already exist
const columns = db
  .prepare(`PRAGMA table_info(users)`)
  .all() as { name: string }[];

const roleExists = columns.some(column => column.name === 'role');

if (!roleExists) {
  db.exec(`
    ALTER TABLE users
    ADD COLUMN role TEXT DEFAULT 'user'
  `);

  console.log('Added role column to users table');
}

export default db;