/**
 * Seed Script: Alerts Data
 *
 * Populates the alerts system with comprehensive data for:
 * - Alert rules (various event types, enabled/disabled states)
 * - Alert history (sent/failed statuses, various event types)
 *
 * Run: npx ts-node src/seeds/seed-alerts-data.ts
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

const MONGODB_URI =
  process.env.MONGODB_URI_DEV ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/breyus';

// ============================================================================
// ENUM DEFINITIONS (mirror schema enums)
// ============================================================================

enum AlertEventType {
  USER_SUSPENDED = 'USER_SUSPENDED',
  KYC_PENDING_THRESHOLD = 'KYC_PENDING_THRESHOLD',
  TRADE_STALLED = 'TRADE_STALLED',
  FAILED_LOGIN_SPIKE = 'FAILED_LOGIN_SPIKE',
  NEW_DISPUTE = 'NEW_DISPUTE',
}

enum AlertEmailStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

const ALERT_RULES = [
  {
    name: 'KYC Backlog Alert',
    eventType: AlertEventType.KYC_PENDING_THRESHOLD,
    isEnabled: true,
    threshold: 50,
    timeWindowMinutes: 60,
    recipients: ['admin@breyus.com', 'compliance@breyus.com'],
    cooldownMinutes: 120,
  },
  {
    name: 'User Suspension Notification',
    eventType: AlertEventType.USER_SUSPENDED,
    isEnabled: true,
    recipients: ['admin@breyus.com', 'hr@breyus.com'],
    cooldownMinutes: 5,
  },
  {
    name: 'Stalled Trade Monitor',
    eventType: AlertEventType.TRADE_STALLED,
    isEnabled: true,
    threshold: 10,
    timeWindowMinutes: 1440, // 24 hours
    recipients: ['trades@breyus.com', 'support@breyus.com'],
    cooldownMinutes: 240,
  },
  {
    name: 'Security Alert - Failed Logins',
    eventType: AlertEventType.FAILED_LOGIN_SPIKE,
    isEnabled: true,
    threshold: 100,
    timeWindowMinutes: 30,
    recipients: ['security@breyus.com', 'admin@breyus.com'],
    cooldownMinutes: 30,
  },
  {
    name: 'Dispute Notification',
    eventType: AlertEventType.NEW_DISPUTE,
    isEnabled: true,
    recipients: ['disputes@breyus.com', 'legal@breyus.com'],
    cooldownMinutes: 15,
  },
  {
    name: 'Critical KYC Alert (Disabled)',
    eventType: AlertEventType.KYC_PENDING_THRESHOLD,
    isEnabled: false,
    threshold: 100,
    timeWindowMinutes: 30,
    recipients: ['ceo@breyus.com'],
    cooldownMinutes: 60,
  },
  {
    name: 'High Priority Disputes (Disabled)',
    eventType: AlertEventType.NEW_DISPUTE,
    isEnabled: false,
    recipients: ['ceo@breyus.com', 'legal@breyus.com'],
    cooldownMinutes: 5,
  },
];

// Sample payloads for different event types
const SAMPLE_PAYLOADS = {
  [AlertEventType.USER_SUSPENDED]: [
    {
      userEmail: 'john.smith@example.com',
      userId: 'user123',
      reason: 'Policy violation',
      suspendedBy: 'admin@breyus.com',
    },
    {
      userEmail: 'suspicious.user@test.com',
      userId: 'user456',
      reason: 'Fraudulent activity',
      suspendedBy: 'admin@breyus.com',
    },
    {
      userEmail: 'inactive.account@domain.com',
      userId: 'user789',
      reason: 'Inactive for 6 months',
      suspendedBy: 'system',
    },
  ],
  [AlertEventType.KYC_PENDING_THRESHOLD]: [
    {
      count: 52,
      threshold: 50,
      oldestPending: '2024-01-10',
      topCompanies: ['Acme Corp', 'Global Trade Ltd'],
    },
    {
      count: 75,
      threshold: 50,
      oldestPending: '2024-01-05',
      topCompanies: ['Import Inc', 'Export Co'],
    },
    { count: 60, threshold: 50, oldestPending: '2024-01-08' },
  ],
  [AlertEventType.TRADE_STALLED]: [
    { count: 12, stalledDays: 8, trades: ['TRD-001', 'TRD-002', 'TRD-003'] },
    { count: 15, stalledDays: 10, trades: ['TRD-101', 'TRD-102'] },
    { count: 8, stalledDays: 14, trades: ['TRD-201'] },
  ],
  [AlertEventType.FAILED_LOGIN_SPIKE]: [
    {
      count: 150,
      timeWindow: '30 minutes',
      topIPs: ['192.168.1.100', '10.0.0.55'],
      topEmails: ['test@example.com'],
    },
    {
      count: 120,
      timeWindow: '30 minutes',
      topIPs: ['185.220.100.10'],
      uniqueEmails: 45,
    },
    {
      count: 200,
      timeWindow: '30 minutes',
      topIPs: ['91.121.87.12', '77.247.181.165'],
      suspiciousPattern: 'brute_force',
    },
  ],
  [AlertEventType.NEW_DISPUTE]: [
    {
      disputeId: 'DSP-001',
      tradeId: 'TRD-500',
      buyer: 'Buyer Corp',
      seller: 'Seller Inc',
      amount: 50000,
      reason: 'Quality issue',
    },
    {
      disputeId: 'DSP-002',
      tradeId: 'TRD-501',
      buyer: 'Import Co',
      seller: 'Export Ltd',
      amount: 25000,
      reason: 'Delayed delivery',
    },
    {
      disputeId: 'DSP-003',
      tradeId: 'TRD-502',
      buyer: 'Trade Corp',
      seller: 'Supply Co',
      amount: 100000,
      reason: 'Quantity mismatch',
    },
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRandomDate(maxDaysAgo: number = 30): Date {
  const daysBack = Math.floor(Math.random() * maxDaysAgo);
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  date.setHours(
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    0,
    0,
  );
  return date;
}

function getRecentDate(maxHoursAgo: number = 72): Date {
  const hoursBack = Math.floor(Math.random() * maxHoursAgo);
  const date = new Date();
  date.setHours(date.getHours() - hoursBack);
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedAlertsData() {
  console.log('='.repeat(60));
  console.log('  ALERTS DATA SEEDER');
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
    const alertRulesCollection = db.collection('alertrules');
    const alertHistoryCollection = db.collection('alerthistory');

    // ========================================================================
    // STEP 1: Find admin user
    // ========================================================================

    console.log('Step 1: Finding admin user...');
    const admin = await adminUsersCollection.findOne({});

    if (!admin) {
      console.error('');
      console.error('ERROR: No admin user found. Please create one first.');
      process.exit(1);
    }

    console.log(`  Found admin: ${admin.email}`);
    console.log('');

    // ========================================================================
    // STEP 2: Clear existing seed data
    // ========================================================================

    console.log('Step 2: Clearing existing seed data...');

    const deletedRules = await alertRulesCollection.deleteMany({
      _seedData: true,
    });
    const deletedHistory = await alertHistoryCollection.deleteMany({
      _seedData: true,
    });

    console.log(`  Deleted ${deletedRules.deletedCount} seeded alert rules`);
    console.log(
      `  Deleted ${deletedHistory.deletedCount} seeded alert history entries`,
    );
    console.log('');

    // ========================================================================
    // STEP 3: Create alert rules
    // ========================================================================

    console.log('Step 3: Creating alert rules...');

    const rulesToInsert: any[] = [];
    const ruleIds: Types.ObjectId[] = [];

    for (const ruleTemplate of ALERT_RULES) {
      const createdAt = getRandomDate(60);
      const ruleId = new Types.ObjectId();
      ruleIds.push(ruleId);

      const rule: any = {
        _id: ruleId,
        name: ruleTemplate.name,
        eventType: ruleTemplate.eventType,
        isEnabled: ruleTemplate.isEnabled,
        recipients: ruleTemplate.recipients,
        cooldownMinutes: ruleTemplate.cooldownMinutes,
        createdBy: admin._id,
        createdAt,
        updatedAt: createdAt,
        _seedData: true,
      };

      // Add optional fields if present
      if (ruleTemplate.threshold) rule.threshold = ruleTemplate.threshold;
      if (ruleTemplate.timeWindowMinutes)
        rule.timeWindowMinutes = ruleTemplate.timeWindowMinutes;

      // Set lastTriggeredAt for some rules
      if (ruleTemplate.isEnabled && Math.random() > 0.3) {
        rule.lastTriggeredAt = getRecentDate(168);
      }

      rulesToInsert.push(rule);
    }

    const rulesResult = await alertRulesCollection.insertMany(rulesToInsert);
    console.log(`  Created ${rulesResult.insertedCount} alert rules`);
    console.log('');

    // ========================================================================
    // STEP 4: Create alert history entries
    // ========================================================================

    console.log('Step 4: Creating alert history entries...');

    const historyToInsert: any[] = [];

    // Create history entries for enabled rules
    for (let i = 0; i < rulesToInsert.length; i++) {
      const rule = rulesToInsert[i];

      // Skip disabled rules sometimes
      if (!rule.isEnabled && Math.random() > 0.3) continue;

      // Create 3-8 history entries per enabled rule
      const numEntries = rule.isEnabled
        ? Math.floor(Math.random() * 6) + 3
        : Math.floor(Math.random() * 2) + 1;

      const payloads = SAMPLE_PAYLOADS[rule.eventType as AlertEventType] || [
        { message: 'Test payload' },
      ];

      for (let j = 0; j < numEntries; j++) {
        const triggeredAt = getRecentDate(336); // Last 14 days
        const payload = payloads[j % payloads.length];

        // Most should be successful, some failed
        const isFailed = Math.random() < 0.15;

        historyToInsert.push({
          ruleId: rule._id,
          ruleName: rule.name,
          eventType: rule.eventType,
          triggeredAt,
          payload,
          recipientsSent: rule.recipients,
          emailStatus: isFailed
            ? AlertEmailStatus.FAILED
            : AlertEmailStatus.SENT,
          errorMessage: isFailed ? 'SMTP connection timeout' : undefined,
          createdAt: triggeredAt,
          updatedAt: triggeredAt,
          _seedData: true,
        });
      }
    }

    // Add some test alert history entries
    const testAlerts = [
      {
        ruleName: '[TEST] KYC Backlog Alert',
        eventType: AlertEventType.KYC_PENDING_THRESHOLD,
        payload: { test: true, message: 'This is a test alert' },
      },
      {
        ruleName: '[TEST] Security Alert - Failed Logins',
        eventType: AlertEventType.FAILED_LOGIN_SPIKE,
        payload: { test: true, message: 'Manual test triggered' },
      },
    ];

    for (const testAlert of testAlerts) {
      const triggeredAt = getRecentDate(48);
      historyToInsert.push({
        ruleId: ruleIds[0], // Use first rule ID
        ruleName: testAlert.ruleName,
        eventType: testAlert.eventType,
        triggeredAt,
        payload: testAlert.payload,
        recipientsSent: ['admin@breyus.com'],
        emailStatus: AlertEmailStatus.SENT,
        createdAt: triggeredAt,
        updatedAt: triggeredAt,
        _seedData: true,
      });
    }

    // Sort by triggeredAt (newest first)
    historyToInsert.sort(
      (a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime(),
    );

    const historyResult =
      await alertHistoryCollection.insertMany(historyToInsert);
    console.log(
      `  Created ${historyResult.insertedCount} alert history entries`,
    );
    console.log('');

    // ========================================================================
    // STEP 5: Summary
    // ========================================================================

    console.log('='.repeat(60));
    console.log('  SEED COMPLETE - SUMMARY');
    console.log('='.repeat(60));
    console.log('');

    // Get counts
    const totalRules = await alertRulesCollection.countDocuments({});
    const enabledRules = await alertRulesCollection.countDocuments({
      isEnabled: true,
    });
    const totalHistory = await alertHistoryCollection.countDocuments({});
    const sentAlerts = await alertHistoryCollection.countDocuments({
      emailStatus: AlertEmailStatus.SENT,
    });
    const failedAlerts = await alertHistoryCollection.countDocuments({
      emailStatus: AlertEmailStatus.FAILED,
    });

    console.log('  Alert Rules:');
    console.log(`    Total: ${totalRules}`);
    console.log(`    Enabled: ${enabledRules}`);
    console.log(`    Disabled: ${totalRules - enabledRules}`);
    console.log('');
    console.log('  Alert History:');
    console.log(`    Total: ${totalHistory}`);
    console.log(`    Sent: ${sentAlerts}`);
    console.log(`    Failed: ${failedAlerts}`);
    console.log('');
    console.log('  Event Types Covered:');
    console.log('    - USER_SUSPENDED');
    console.log('    - KYC_PENDING_THRESHOLD');
    console.log('    - TRADE_STALLED');
    console.log('    - FAILED_LOGIN_SPIKE');
    console.log('    - NEW_DISPUTE');
    console.log('');
    console.log('  To delete seed data later:');
    console.log('    db.alertrules.deleteMany({ _seedData: true })');
    console.log('    db.alerthistory.deleteMany({ _seedData: true })');
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
seedAlertsData();
