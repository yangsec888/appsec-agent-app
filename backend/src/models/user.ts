/**
 * User Model and Data Access Layer for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

import db, { User, UserWithoutPassword } from '../db/database';
import bcrypt from 'bcrypt';

export class UserModel {
  static async create(username: string, email: string, password: string, passwordChanged: boolean = true): Promise<UserWithoutPassword> {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, password_changed)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(username, email, passwordHash, passwordChanged ? 1 : 0);
    
    return this.findById(result.lastInsertRowid as number);
  }

  static findById(id: number): UserWithoutPassword {
    const stmt = db.prepare('SELECT id, username, email, password_changed, created_at, updated_at FROM users WHERE id = ?');
    const user = stmt.get(id) as User | null;
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password_changed: user.password_changed === 1,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  static async changePassword(userId: number, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare(`
      UPDATE users 
      SET password_hash = ?, password_changed = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(passwordHash, userId);
  }

  static findByUsername(username: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as User | undefined;
    return user || null;
  }

  static findByEmail(email: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as User | undefined;
    return user || null;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }
}

