/**
 * Create Initial Admin User Seed Script
 *
 * Run this script to create the first admin user for the admin portal.
 *
 * Usage:
 *   npx ts-node src/admin/seeds/create-initial-admin.ts
 *
 * Or add to package.json scripts:
 *   "seed:admin": "ts-node src/admin/seeds/create-initial-admin.ts"
 */

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI_DEV || process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/breyus';

const AdminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'viewer'], default: 'super_admin' },
  lastLogin: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
}, { timestamps: true, collection: 'adminusers' });

const AdminUser = mongoose.model('AdminUser', AdminUserSchema);

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createInitialAdmin() {
  console.log('\n========================================');
  console.log('  BREYUS ADMIN PORTAL - INITIAL SETUP');
  console.log('========================================\n');

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.\n');

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({});
    if (existingAdmin) {
      console.log('An admin user already exists:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.name}`);
      console.log(`  Role: ${existingAdmin.role}`);
      console.log('\nTo create another admin, please use the admin portal interface.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Get admin details
    const email = await askQuestion('Enter admin email [admin@breyus.com]: ') || 'admin@breyus.com';
    const name = await askQuestion('Enter admin name [System Admin]: ') || 'System Admin';
    const password = await askQuestion('Enter admin password (min 8 chars): ');

    if (!password || password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters long.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = new AdminUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: 'super_admin',
    });

    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('========================================');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}`);
    console.log('========================================');
    console.log('\n⚠️  IMPORTANT: Keep these credentials secure!');
    console.log('You can now login to the admin portal.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to create admin user:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
createInitialAdmin();
