/**
 * Database Configuration and Schema Management for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../data/users.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_changed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

// Migrate existing users: add password_changed column if it doesn't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const hasPasswordChanged = tableInfo.some(col => col.name === 'password_changed');
  
  if (!hasPasswordChanged) {
    db.exec(`ALTER TABLE users ADD COLUMN password_changed INTEGER DEFAULT 0`);
    console.log('✅ Added password_changed column to users table');
  }
} catch (error: any) {
  console.warn('Migration warning:', error.message);
}

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  password_changed: number; // 0 = false, 1 = true
  created_at: string;
  updated_at: string;
}

export interface UserWithoutPassword {
  id: number;
  username: string;
  email: string;
  password_changed: boolean;
  created_at: string;
  updated_at: string;
}

export default db;

