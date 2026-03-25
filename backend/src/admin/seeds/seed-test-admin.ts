/**
 * Non-interactive seed script for testing
 * Creates a default admin user: admin@breyus.com / Admin123!
 */

import { connect, disconnect } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI_DEV ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/breyus';

async function seedTestAdmin() {
  console.log('\n🌱 Seeding Test Admin User...\n');

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the adminusers collection
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection('adminusers');

    // Check if admin already exists
    const existingAdmin = await collection.findOne({
      email: 'admin@breyus.com',
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists: admin@breyus.com');
      console.log('   Updating password to: Admin123!');

      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      await collection.updateOne(
        { email: 'admin@breyus.com' },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        },
      );

      console.log('✅ Password updated successfully!\n');
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash('Admin123!', 10);

      await collection.insertOne({
        email: 'admin@breyus.com',
        password: hashedPassword,
        name: 'Breyus Admin',
        role: 'super_admin',
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Admin user created successfully!\n');
    }

    console.log('╔════════════════════════════════════════╗');
    console.log('║     TEST ADMIN CREDENTIALS             ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║  Email:    admin@breyus.com            ║');
    console.log('║  Password: Admin123!                   ║');
    console.log('╚════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  } finally {
    await disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

seedTestAdmin();
