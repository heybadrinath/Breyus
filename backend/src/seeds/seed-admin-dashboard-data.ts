/**
 * Seed Script: Admin Dashboard Data
 *
 * Populates the admin dashboard with realistic data for:
 * - Admin activity logs (Recent Activity section)
 * - KYC documents (Pending KYC tab)
 * - Stalled trades (Stalled Trades tab)
 * - Failed login attempts (Security page)
 * - Blocked IPs (Security page)
 *
 * Run: npx ts-node src/seeds/seed-admin-dashboard-data.ts
 */

import * as mongoose from 'mongoose';
import { Types } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

// ============================================================================
// CONFIGURATION
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI_DEV ||
                    process.env.MONGODB_URI ||
                    'mongodb://localhost:27017/breyus';

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

// Admin activity categories and actions
const ADMIN_ACTIVITIES = [
  { action: 'LOGIN', actionCategory: 'auth', description: 'Admin logged in successfully' },
  { action: 'VIEW_USER', actionCategory: 'users', description: 'Viewed user profile details', targetType: 'user' },
  { action: 'SUSPEND_USER', actionCategory: 'users', description: 'Suspended user account for policy violation', targetType: 'user' },
  { action: 'UNSUSPEND_USER', actionCategory: 'users', description: 'Reactivated user account', targetType: 'user' },
  { action: 'VIEW_COMPANY', actionCategory: 'companies', description: 'Viewed company profile', targetType: 'company' },
  { action: 'VERIFY_COMPANY', actionCategory: 'companies', description: 'Verified company KYC documents', targetType: 'company' },
  { action: 'APPROVE_KYC', actionCategory: 'kyc', description: 'Approved KYC document submission', targetType: 'company' },
  { action: 'REJECT_KYC', actionCategory: 'kyc', description: 'Rejected KYC document - unclear image', targetType: 'company' },
  { action: 'VIEW_TRADE', actionCategory: 'trades', description: 'Viewed trade details', targetType: 'trade' },
  { action: 'ADD_TRADE_NOTE', actionCategory: 'trades', description: 'Added internal note to trade', targetType: 'trade' },
  { action: 'FORCE_PHASE_CHANGE', actionCategory: 'trades', description: 'Force advanced trade phase', targetType: 'trade' },
  { action: 'VERIFY_DOCUMENT', actionCategory: 'trades', description: 'Verified trade document', targetType: 'trade' },
  { action: 'SYSTEM_HEALTH_CHECK', actionCategory: 'system', description: 'Performed system health check' },
  { action: 'VIEW_ANALYTICS', actionCategory: 'system', description: 'Viewed platform analytics' },
  { action: 'BLOCK_IP', actionCategory: 'security', description: 'Blocked suspicious IP address', targetType: 'ip' },
  { action: 'UNBLOCK_IP', actionCategory: 'security', description: 'Unblocked IP address', targetType: 'ip' },
  { action: 'VIEW_FAILED_LOGINS', actionCategory: 'security', description: 'Reviewed failed login attempts' },
  { action: 'EXPORT_DATA', actionCategory: 'users', description: 'Exported user data for compliance', targetType: 'user' },
  { action: 'VIEW_DISPUTE', actionCategory: 'disputes', description: 'Reviewed trade dispute', targetType: 'dispute' },
  { action: 'RESOLVE_DISPUTE', actionCategory: 'disputes', description: 'Resolved trade dispute in favor of buyer', targetType: 'dispute' },
];

// KYC document types and sample data
const KYC_DOCUMENTS = [
  { type: 'cis', customName: 'Company Information Sheet' },
  { type: 'passport', customName: 'Director Passport' },
  { type: 'tax_certificate', customName: 'Tax Registration Certificate' },
  { type: 'business_registration', customName: 'Business License' },
  { type: 'other', customName: 'Bank Statement' },
];

// Sample IP addresses for failed logins
const SUSPICIOUS_IPS = [
  '192.168.1.100',
  '10.0.0.55',
  '172.16.0.33',
  '203.0.113.42',
  '198.51.100.77',
  '185.220.100.252',
  '45.33.32.156',
  '192.0.2.123',
  '91.121.87.12',
  '77.247.181.165',
];

// Sample user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
  'curl/7.68.0',
  'python-requests/2.28.0',
];

// Failed login reasons with weights
const FAILED_REASONS = [
  { reason: 'INVALID_PASSWORD', weight: 40 },
  { reason: 'USER_NOT_FOUND', weight: 25 },
  { reason: 'OTP_EXPIRED', weight: 15 },
  { reason: 'OTP_INVALID', weight: 10 },
  { reason: 'USER_SUSPENDED', weight: 5 },
  { reason: 'IP_BLOCKED', weight: 5 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRandomDate(maxDaysAgo: number = 30): Date {
  const daysBack = Math.floor(Math.random() * maxDaysAgo);
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return date;
}

function getRandomHour(): number {
  // Weight toward business hours and late night (suspicious)
  const r = Math.random();
  if (r < 0.3) return Math.floor(Math.random() * 6); // 0-5 AM (suspicious)
  if (r < 0.6) return 9 + Math.floor(Math.random() * 9); // 9 AM - 6 PM (business)
  return Math.floor(Math.random() * 24);
}

function getRecentDate(maxHoursAgo: number = 72): Date {
  const hoursBack = Math.floor(Math.random() * maxHoursAgo);
  const date = new Date();
  date.setHours(date.getHours() - hoursBack);
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

function getWeightedReason(): string {
  const totalWeight = FAILED_REASONS.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of FAILED_REASONS) {
    random -= item.weight;
    if (random <= 0) return item.reason;
  }
  return 'INVALID_PASSWORD';
}

function generateFakeEmail(): string {
  const names = ['john', 'jane', 'admin', 'test', 'user', 'alex', 'sarah', 'mike', 'emma', 'david'];
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'example.com', 'test.org'];
  const name = names[Math.floor(Math.random() * names.length)];
  const num = Math.floor(Math.random() * 1000);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${name}${num}@${domain}`;
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedAdminDashboardData() {
  console.log('='.repeat(60));
  console.log('  ADMIN DASHBOARD DATA SEEDER');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('');

    const db = mongoose.connection.db!;

    // Collections
    const adminUsersCollection = db.collection('adminusers');
    const activityLogsCollection = db.collection('adminactivitylogs');
    const companiesCollection = db.collection('companies');
    const tradesCollection = db.collection('trades');
    const failedLoginsCollection = db.collection('failedloginattempts');
    const blockedIpsCollection = db.collection('blockedips');

    // ========================================================================
    // STEP 1: Find admin user
    // ========================================================================

    console.log('Step 1: Finding admin user...');
    const admin = await adminUsersCollection.findOne({});

    if (!admin) {
      console.error('');
      console.error('ERROR: No admin user found. Please create one first.');
      console.error('Run: npx ts-node src/admin/seeds/create-initial-admin.ts');
      process.exit(1);
    }

    console.log(`  Found admin: ${admin.email}`);
    console.log('');

    // ========================================================================
    // STEP 2: Create admin activity logs
    // ========================================================================

    console.log('Step 2: Creating admin activity logs...');

    // Check for existing seed data
    const existingActivities = await activityLogsCollection.countDocuments({ _seedData: true });
    if (existingActivities > 0) {
      console.log(`  Found ${existingActivities} existing seeded activities. Skipping...`);
    } else {
      const activitiesToInsert: any[] = [];

      // Create 50 activity entries spread over the last 7 days
      for (let i = 0; i < 50; i++) {
        const activity = ADMIN_ACTIVITIES[Math.floor(Math.random() * ADMIN_ACTIVITIES.length)];
        const timestamp = getRecentDate(168); // Last 7 days

        activitiesToInsert.push({
          adminId: admin._id,
          adminEmail: admin.email,
          action: activity.action,
          actionCategory: activity.actionCategory,
          description: activity.description,
          targetType: activity.targetType,
          timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
          metadata: {
            ipAddress: SUSPICIOUS_IPS[Math.floor(Math.random() * SUSPICIOUS_IPS.length)],
            userAgent: USER_AGENTS[0],
          },
          _seedData: true,
        });
      }

      // Sort by timestamp (newest first)
      activitiesToInsert.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const activityResult = await activityLogsCollection.insertMany(activitiesToInsert);
      console.log(`  Created ${activityResult.insertedCount} activity logs`);
    }
    console.log('');

    // ========================================================================
    // STEP 3: Add KYC documents to companies
    // ========================================================================

    console.log('Step 3: Adding KYC documents to companies...');

    const companies = await companiesCollection.find({}).limit(10).toArray();

    if (companies.length === 0) {
      console.log('  No companies found. Skipping KYC documents...');
    } else {
      let kycUpdated = 0;

      for (let i = 0; i < Math.min(5, companies.length); i++) {
        const company = companies[i];

        // Check if company already has pending KYC
        const hasKyc = company.kycDocuments && company.kycDocuments.length > 0;

        if (!hasKyc) {
          // Add 2-3 KYC documents per company
          const numDocs = Math.floor(Math.random() * 2) + 2;
          const kycDocuments: any[] = [];

          for (let j = 0; j < numDocs; j++) {
            const docTemplate = KYC_DOCUMENTS[j % KYC_DOCUMENTS.length];
            const uploadedAt = getRandomDate(14);

            kycDocuments.push({
              _id: new Types.ObjectId(),
              type: docTemplate.type,
              customName: docTemplate.customName,
              filename: `kyc_${company._id}_${j}.pdf`,
              originalName: `${docTemplate.customName}.pdf`,
              path: `/uploads/kyc/${company._id}/${docTemplate.type}_${Date.now()}.pdf`,
              mimeType: 'application/pdf',
              size: Math.floor(Math.random() * 500000) + 100000,
              status: 'pending', // All pending for review
              uploadedAt,
            });
          }

          await companiesCollection.updateOne(
            { _id: company._id },
            {
              $set: {
                kycDocuments,
                isKycVerified: false,
              }
            }
          );
          kycUpdated++;
        }
      }

      console.log(`  Updated ${kycUpdated} companies with KYC documents`);
    }
    console.log('');

    // ========================================================================
    // STEP 4: Create stalled trades
    // ========================================================================

    console.log('Step 4: Creating stalled trades...');

    // Find active trades and make some stalled (older than 7 days)
    const activeTrades = await tradesCollection
      .find({
        tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
        _stalledSeed: { $ne: true }
      })
      .limit(5)
      .toArray();

    if (activeTrades.length === 0) {
      console.log('  No active trades found. Skipping stalled trades...');
    } else {
      let stalledCount = 0;

      for (let i = 0; i < Math.min(3, activeTrades.length); i++) {
        const trade = activeTrades[i];
        const stalledDate = new Date();
        stalledDate.setDate(stalledDate.getDate() - (8 + Math.floor(Math.random() * 14))); // 8-22 days ago

        await tradesCollection.updateOne(
          { _id: trade._id },
          {
            $set: {
              updatedAt: stalledDate,
              lastPhaseChangeAt: stalledDate,
              _stalledSeed: true,
            }
          }
        );
        stalledCount++;
      }

      console.log(`  Made ${stalledCount} trades stalled`);
    }
    console.log('');

    // ========================================================================
    // STEP 5: Create failed login attempts
    // ========================================================================

    console.log('Step 5: Creating failed login attempts...');

    const existingFailedLogins = await failedLoginsCollection.countDocuments({ _seedData: true });
    if (existingFailedLogins > 0) {
      console.log(`  Found ${existingFailedLogins} existing seeded failed logins. Skipping...`);
    } else {
      const failedLoginsToInsert: any[] = [];

      // Create 100 failed login attempts spread over the last 24 hours
      for (let i = 0; i < 100; i++) {
        const attemptedAt = getRecentDate(48); // Last 48 hours
        attemptedAt.setHours(getRandomHour());

        failedLoginsToInsert.push({
          email: generateFakeEmail(),
          ipAddress: SUSPICIOUS_IPS[Math.floor(Math.random() * SUSPICIOUS_IPS.length)],
          userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          attemptedAt,
          reason: getWeightedReason(),
          createdAt: attemptedAt,
          updatedAt: attemptedAt,
          _seedData: true,
        });
      }

      const failedResult = await failedLoginsCollection.insertMany(failedLoginsToInsert);
      console.log(`  Created ${failedResult.insertedCount} failed login attempts`);
    }
    console.log('');

    // ========================================================================
    // STEP 6: Create blocked IPs
    // ========================================================================

    console.log('Step 6: Creating blocked IPs...');

    const existingBlockedIps = await blockedIpsCollection.countDocuments({ _seedData: true });
    if (existingBlockedIps > 0) {
      console.log(`  Found ${existingBlockedIps} existing seeded blocked IPs. Skipping...`);
    } else {
      const blockedIpsToInsert: any[] = [];
      const blockedReasons = [
        'Multiple failed login attempts',
        'Suspicious activity detected',
        'Brute force attack attempt',
        'Bot traffic detected',
        'Geo-restricted region',
      ];

      // Create 5 blocked IPs
      for (let i = 0; i < 5; i++) {
        const blockedAt = getRandomDate(30);
        const expiresAt = i < 3 ? null : new Date(blockedAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // Some permanent, some temporary

        blockedIpsToInsert.push({
          ipAddress: `185.220.100.${10 + i}`,
          reason: blockedReasons[i % blockedReasons.length],
          blockedBy: admin._id,
          blockedAt,
          expiresAt,
          isActive: true,
          createdAt: blockedAt,
          updatedAt: blockedAt,
          _seedData: true,
        });
      }

      try {
        const blockedResult = await blockedIpsCollection.insertMany(blockedIpsToInsert, { ordered: false });
        console.log(`  Created ${blockedResult.insertedCount} blocked IPs`);
      } catch (err: any) {
        if (err.code === 11000) {
          console.log('  Some blocked IPs already exist (duplicate keys). Skipped duplicates.');
        } else {
          throw err;
        }
      }
    }
    console.log('');

    // ========================================================================
    // STEP 7: Summary
    // ========================================================================

    console.log('='.repeat(60));
    console.log('  SEED COMPLETE - SUMMARY');
    console.log('='.repeat(60));
    console.log('');

    // Get counts
    const activityCount = await activityLogsCollection.countDocuments({ _seedData: true });
    const pendingKycCount = await companiesCollection.countDocuments({ 'kycDocuments.status': 'pending' });
    const stalledTradeCount = await tradesCollection.countDocuments({
      tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
      updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    const failedLoginCount = await failedLoginsCollection.countDocuments({ _seedData: true });
    const blockedIpCount = await blockedIpsCollection.countDocuments({ _seedData: true });

    console.log('  Data created:');
    console.log(`    Admin Activity Logs: ${activityCount}`);
    console.log(`    Companies with Pending KYC: ${pendingKycCount}`);
    console.log(`    Stalled Trades: ${stalledTradeCount}`);
    console.log(`    Failed Login Attempts: ${failedLoginCount}`);
    console.log(`    Blocked IPs: ${blockedIpCount}`);
    console.log('');
    console.log('  To delete seed data later:');
    console.log('    db.adminactivitylogs.deleteMany({ _seedData: true })');
    console.log('    db.failedloginattempts.deleteMany({ _seedData: true })');
    console.log('    db.blockedips.deleteMany({ _seedData: true })');
    console.log('');
    console.log('='.repeat(60));
    console.log('  SUCCESS!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('ERROR during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
seedAdminDashboardData();
