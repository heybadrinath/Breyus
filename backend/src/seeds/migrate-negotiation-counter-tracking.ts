/**
 * Migration Script: Negotiation Counter Tracking
 *
 * Purpose:
 * - Add counter tracking fields to all existing trades
 * - Calculate buyerCounterCount from negotiation history for trades already in progress
 * - Set isNegotiationLocked for trades where buyer has already used max counters
 *
 * Run with: npx ts-node src/seeds/migrate-negotiation-counter-tracking.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Trade schema interface for migration
interface NegotiationEntry {
  round: number;
  party: 'buyer' | 'seller';
  offeredPrice?: number | string;
  offeredIncoterms?: any;
  message?: string;
  timestamp: Date;
}

interface TradeDocument {
  _id: mongoose.Types.ObjectId;
  negotiationStatus: string;
  negotiationHistory: NegotiationEntry[];
  buyerCounterCount?: number;
  maxBuyerCounters?: number;
  isNegotiationLocked?: boolean;
  tradePhase: string;
}

const MAX_BUYER_COUNTERS = 2;

async function migrateNegotiationCounterTracking() {
  console.log('\n========================================');
  console.log('Negotiation Counter Tracking Migration');
  console.log('========================================\n');

  // Connect to MongoDB - Use environment variables for credentials (NEVER hardcode in source)
  const mongoUri =
    process.env.MONGODB_URI_DEV ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/breyus';

  if (!process.env.MONGODB_URI_DEV && !process.env.MONGODB_URI) {
    console.warn(
      '⚠ No MONGODB_URI_DEV or MONGODB_URI environment variable set. Using localhost without auth.',
    );
    console.warn(
      '  For Docker with auth, set: export MONGODB_URI_DEV="mongodb://user:pass@localhost:27017/breyus?authSource=admin"',
    );
  }

  console.log('Connecting to MongoDB...');

  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');
  } catch (err) {
    console.error('✗ Failed to connect to MongoDB:', err);
    process.exit(1);
  }

  const db = mongoose.connection.db;
  if (!db) {
    console.error('✗ Database connection not established');
    process.exit(1);
  }

  const tradesCollection = db.collection('trades');

  // Step 1: Add default counter tracking fields to all trades
  console.log('Step 1: Adding default counter tracking fields...');

  const addDefaultsResult = await tradesCollection.updateMany(
    {
      $or: [
        { buyerCounterCount: { $exists: false } },
        { maxBuyerCounters: { $exists: false } },
        { isNegotiationLocked: { $exists: false } },
      ],
    },
    {
      $set: {
        buyerCounterCount: 0,
        maxBuyerCounters: MAX_BUYER_COUNTERS,
        isNegotiationLocked: false,
      },
    },
  );

  console.log(
    `✓ Added default fields to ${addDefaultsResult.modifiedCount} trades\n`,
  );

  // Step 2: Calculate buyerCounterCount from negotiation history
  console.log('Step 2: Calculating buyer counter counts from history...');

  const tradesWithHistory = await tradesCollection
    .find({
      negotiationHistory: { $exists: true, $ne: [] },
    })
    .toArray();

  let updatedCount = 0;
  let lockedCount = 0;

  for (const trade of tradesWithHistory as any[]) {
    // Count buyer responses in negotiation history
    // We only count buyer responses AFTER the initial offer (which is the PR creation)
    const buyerResponses = (trade.negotiationHistory || []).filter(
      (entry: NegotiationEntry) => entry.party === 'buyer' && entry.round > 1,
    );

    const buyerCounterCount = buyerResponses.length;
    const isLocked = buyerCounterCount >= MAX_BUYER_COUNTERS;

    // Only update if values differ
    if (
      trade.buyerCounterCount !== buyerCounterCount ||
      trade.isNegotiationLocked !== isLocked
    ) {
      await tradesCollection.updateOne(
        { _id: trade._id },
        {
          $set: {
            buyerCounterCount: buyerCounterCount,
            isNegotiationLocked: isLocked,
          },
        },
      );

      updatedCount++;
      if (isLocked) {
        lockedCount++;
        console.log(
          `  - Trade ${trade._id}: ${buyerCounterCount} counters, LOCKED`,
        );
      }
    }
  }

  console.log(`✓ Updated ${updatedCount} trades based on negotiation history`);
  console.log(
    `✓ ${lockedCount} trades marked as locked (buyer exhausted counters)\n`,
  );

  // Step 3: Summary statistics
  console.log('Step 3: Migration Summary...\n');

  const stats = await tradesCollection
    .aggregate([
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          tradesWithCounters: {
            $sum: { $cond: [{ $gt: ['$buyerCounterCount', 0] }, 1, 0] },
          },
          lockedTrades: {
            $sum: { $cond: ['$isNegotiationLocked', 1, 0] },
          },
          avgCounters: { $avg: '$buyerCounterCount' },
        },
      },
    ])
    .toArray();

  if (stats.length > 0) {
    const s = stats[0];
    console.log('========================================');
    console.log('           MIGRATION RESULTS            ');
    console.log('========================================');
    console.log(`Total trades:              ${s.totalTrades}`);
    console.log(`Trades with counter data:  ${s.tradesWithCounters}`);
    console.log(`Locked negotiations:       ${s.lockedTrades}`);
    console.log(
      `Average counters used:     ${(s.avgCounters || 0).toFixed(2)}`,
    );
    console.log('========================================\n');
  }

  // Verify a sample trade
  const sampleTrade = await tradesCollection.findOne({
    negotiationHistory: { $exists: true, $ne: [] },
  });

  if (sampleTrade) {
    console.log('Sample Trade Verification:');
    console.log(`  Trade ID: ${sampleTrade._id}`);
    console.log(`  Status: ${sampleTrade.negotiationStatus}`);
    console.log(`  Phase: ${sampleTrade.tradePhase}`);
    console.log(`  Buyer Counter Count: ${sampleTrade.buyerCounterCount}`);
    console.log(`  Max Counters: ${sampleTrade.maxBuyerCounters}`);
    console.log(`  Is Locked: ${sampleTrade.isNegotiationLocked}`);
    console.log(
      `  History Entries: ${(sampleTrade.negotiationHistory || []).length}`,
    );
  }

  console.log('\n✓ Migration completed successfully!\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB\n');
}

// Run the migration
migrateNegotiationCounterTracking().catch(console.error);
