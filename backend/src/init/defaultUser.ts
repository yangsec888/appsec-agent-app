/**
 * Default Admin User Initialization for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

import { UserModel } from '../models/user';

export async function initializeDefaultAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = UserModel.findByUsername('admin');
    
    if (existingAdmin) {
      console.log('✅ Default admin user already exists');
      return;
    }

    // Create default admin user with password_changed = false
    const admin = await UserModel.create('admin', 'admin@localhost', 'admin', false);
    console.log('✅ Default admin user created successfully');
    console.log('   Username: admin');
    console.log('   Password: admin');
    console.log('   ⚠️  Please change the default password after first login!');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Failed to create default admin user:', message);
  }
}

