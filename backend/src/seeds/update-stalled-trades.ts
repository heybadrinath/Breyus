/**
 * Quick script to create diverse trades for testing the admin dashboard
 */

import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI_DEV ||
                    process.env.MONGODB_URI ||
                    'mongodb://localhost:27017/breyus';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

  // Check trade counts
  const trades = await db.collection('trades').find({}).toArray();
  console.log('Total trades:', trades.length);

  if (trades.length > 0) {
    const byPhase: Record<string, number> = {};
    trades.forEach((t: any) => {
      byPhase[t.tradePhase] = (byPhase[t.tradePhase] || 0) + 1;
    });
    console.log('Before - By phase:', byPhase);

    // Take some completed trades and change them to different phases for testing
    const completedTrades = trades.filter((t: any) => t.tradePhase === 'COMPLETED');
    const phases = ['PR', 'SCO', 'ICPO', 'SPA', 'PAYMENT'];

    for (let i = 0; i < Math.min(phases.length, completedTrades.length); i++) {
      const trade = completedTrades[i];
      const newPhase = phases[i];
      const isStalled = i < 3; // Make first 3 stalled

      const stalledDate = new Date();
      if (isStalled) {
        stalledDate.setDate(stalledDate.getDate() - (10 + i * 2)); // 10, 12, 14 days ago
      }

      await db.collection('trades').updateOne(
        { _id: trade._id },
        {
          $set: {
            tradePhase: newPhase,
            updatedAt: stalledDate,
            lastPhaseChangeAt: stalledDate,
            completedAt: null, // Remove completion
          }
        }
      );
      console.log(`Changed trade ${trade._id.toString().slice(-6)} to ${newPhase}${isStalled ? ' (STALLED)' : ''}`);
    }

    // Verify changes
    const updatedTrades = await db.collection('trades').find({}).toArray();
    const newByPhase: Record<string, number> = {};
    updatedTrades.forEach((t: any) => {
      newByPhase[t.tradePhase] = (newByPhase[t.tradePhase] || 0) + 1;
    });
    console.log('After - By phase:', newByPhase);
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(console.error);
