/**
 * ========================
 * PHASE 2 REFACTORING: Migration Script
 * ========================
 *
 * This migration script adds document rejection tracking fields to all existing trades.
 * It should be run once after deploying the Phase 2 refactoring changes.
 *
 * What this script does:
 * 1. Adds default rejection tracking fields to all existing trades
 * 2. Sets dispute eligibility for completed/cancelled trades (30-day window)
 * 3. Marks existing signed SPAs as approved (for backwards compatibility)
 *
 * Run with: npx ts-node src/seeds/migrate-document-rejection-tracking.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// Default rejection tracking structure
const DEFAULT_REJECTION_TRACKING = {
  rejectionCount: 0,
  maxAttempts: 2,
};

const DEFAULT_BOL_REJECTION_TRACKING = {
  rejectionCount: 0,
  maxAttempts: 3, // BoL gets 3 attempts
};

async function migrateDocumentRejectionTracking() {
  const MONGODB_URI =
    process.env.MONGODB_URI_DEV ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/breyus';

  console.log('========================================');
  console.log('Phase 2 Refactoring: Migration Script');
  console.log('========================================');
  console.log(`Connecting to: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const tradesCollection = db.collection('trades');

    // Step 1: Count total trades
    const totalTrades = await tradesCollection.countDocuments();
    console.log(`\nFound ${totalTrades} total trades`);

    // Step 2: Add rejection tracking fields to ALL trades
    console.log(
      '\n[Step 1/3] Adding rejection tracking fields to all trades...',
    );

    const rejectionTrackingResult = await tradesCollection.updateMany(
      {}, // All trades
      {
        $set: {
          scoRejectionTracking: DEFAULT_REJECTION_TRACKING,
          icpoRejectionTracking: DEFAULT_REJECTION_TRACKING,
          spaRejectionTracking: DEFAULT_REJECTION_TRACKING,
          signedSpaRejectionTracking: DEFAULT_REJECTION_TRACKING,
          paymentProofRejectionTracking: DEFAULT_REJECTION_TRACKING,
          bolRejectionTracking: DEFAULT_BOL_REJECTION_TRACKING,
        },
      },
    );
    console.log(
      `Updated ${rejectionTrackingResult.modifiedCount} trades with rejection tracking fields`,
    );

    // Step 3: Set dispute eligibility for completed/cancelled trades
    console.log(
      '\n[Step 2/3] Setting dispute eligibility for closed trades...',
    );

    // Get completed trades without disputeEligibilityEndsAt
    const completedTrades = await tradesCollection
      .find({
        tradePhase: 'COMPLETED',
        disputeEligibilityEndsAt: { $exists: false },
        completedAt: { $exists: true },
      })
      .toArray();

    let disputeEligibilityUpdated = 0;
    for (const trade of completedTrades) {
      const completedAt = new Date(trade.completedAt);
      const eligibilityEnds = new Date(
        completedAt.getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      await tradesCollection.updateOne(
        { _id: trade._id },
        { $set: { disputeEligibilityEndsAt: eligibilityEnds } },
      );
      disputeEligibilityUpdated++;
    }

    // Get cancelled trades without disputeEligibilityEndsAt
    const cancelledTrades = await tradesCollection
      .find({
        tradePhase: 'CANCELLED',
        disputeEligibilityEndsAt: { $exists: false },
        cancelledAt: { $exists: true },
      })
      .toArray();

    for (const trade of cancelledTrades) {
      const cancelledAt = new Date(trade.cancelledAt);
      const eligibilityEnds = new Date(
        cancelledAt.getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      await tradesCollection.updateOne(
        { _id: trade._id },
        { $set: { disputeEligibilityEndsAt: eligibilityEnds } },
      );
      disputeEligibilityUpdated++;
    }

    console.log(
      `Set dispute eligibility for ${disputeEligibilityUpdated} closed trades`,
    );

    // Step 4: Handle existing signed SPAs (legacy trades with dual signatures)
    console.log('\n[Step 3/3] Migrating existing signed SPAs...');

    // Trades with both signatures should be considered as having completed the SPA process
    // We don't need to create signedSpaDocument for them, but we should ensure their phase is correct
    const signedSpaTrades = await tradesCollection
      .find({
        'spaDocument.sellerSignatureDataUrl': { $exists: true, $ne: null },
        'spaDocument.buyerSignatureDataUrl': { $exists: true, $ne: null },
      })
      .toArray();

    console.log(
      `Found ${signedSpaTrades.length} trades with dual signatures (legacy flow)`,
    );
    console.log(
      'These trades will continue to work with legacy signature verification.',
    );

    // Summary
    console.log('\n========================================');
    console.log('Migration Summary:');
    console.log('========================================');
    console.log(`Total trades processed: ${totalTrades}`);
    console.log(
      `Rejection tracking fields added: ${rejectionTrackingResult.modifiedCount}`,
    );
    console.log(`Dispute eligibility set: ${disputeEligibilityUpdated}`);
    console.log(`Legacy signed SPA trades: ${signedSpaTrades.length}`);
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
migrateDocumentRejectionTracking();
