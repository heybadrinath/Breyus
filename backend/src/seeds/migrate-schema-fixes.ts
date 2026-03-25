/**
 * Migration script to fix data types and add new fields
 *
 * This script:
 * 1. Converts string numbers to actual numbers in products (stock, price, etc.)
 * 2. Converts string numbers to actual numbers in trades (quantity, buyerOfferedPrice, sellerOfferedPrice)
 * 3. Converts string numbers in negotiationHistory entries
 * 4. Adds stockRestored flag to existing trades
 *
 * Run with: npx ts-node src/seeds/migrate-schema-fixes.ts
 *
 * IMPORTANT: Backup your database before running this migration!
 */

import { connect, disconnect, Types } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI_DEV ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/breyus';

interface OldProduct {
  _id: Types.ObjectId;
  name: string;
  stock?: string | number;
  price?: string | number;
  discount?: string | number;
  salePrice?: string | number;
  costOfGoods?: string | number;
  profit?: string | number;
}

interface NegotiationHistoryEntry {
  round: number;
  party: 'buyer' | 'seller';
  offeredPrice?: string | number;
  offeredIncoterms?: any;
  message?: string;
  timestamp: Date;
}

interface OldTrade {
  _id: Types.ObjectId;
  quantity?: string | number;
  buyerOfferedPrice?: string | number;
  sellerOfferedPrice?: string | number;
  negotiationHistory?: NegotiationHistoryEntry[];
  stockRestored?: boolean;
  negotiationStatus?: string;
}

/**
 * Safely parse a string to number, returning null if invalid
 */
function safeParseNumber(
  value: string | number | undefined | null,
): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

async function migrateSchemaFixes() {
  console.log('\n🔄 Schema Fixes Migration Script\n');
  console.log('='.repeat(60));
  console.log('This script migrates string numbers to actual numbers');
  console.log('and adds the stockRestored flag to trades.');
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB
    console.log('\n📦 Connecting to MongoDB...');
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the database
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // ========================
    // PHASE 1: Migrate Products
    // ========================
    console.log('\n📦 PHASE 1: Migrating Products...\n');

    const productsCollection = db.collection('products');
    const products = (await productsCollection
      .find({})
      .toArray()) as unknown as OldProduct[];

    console.log(`Found ${products.length} products to check\n`);

    let productsMigrated = 0;
    let productsSkipped = 0;
    let productErrors = 0;

    for (const product of products) {
      try {
        const updates: any = {};
        let needsUpdate = false;

        // Convert stock
        if (typeof product.stock === 'string') {
          const numStock = safeParseNumber(product.stock);
          if (numStock !== null) {
            updates.stock = numStock;
            needsUpdate = true;
          }
        }

        // Convert price
        if (typeof product.price === 'string') {
          const numPrice = safeParseNumber(product.price);
          if (numPrice !== null) {
            updates.price = numPrice;
            needsUpdate = true;
          }
        }

        // Convert discount
        if (typeof product.discount === 'string') {
          const numDiscount = safeParseNumber(product.discount);
          if (numDiscount !== null) {
            updates.discount = numDiscount;
            needsUpdate = true;
          }
        }

        // Convert salePrice
        if (typeof product.salePrice === 'string') {
          const numSalePrice = safeParseNumber(product.salePrice);
          if (numSalePrice !== null) {
            updates.salePrice = numSalePrice;
            needsUpdate = true;
          }
        }

        // Convert costOfGoods
        if (typeof product.costOfGoods === 'string') {
          const numCostOfGoods = safeParseNumber(product.costOfGoods);
          if (numCostOfGoods !== null) {
            updates.costOfGoods = numCostOfGoods;
            needsUpdate = true;
          }
        }

        // Convert profit
        if (typeof product.profit === 'string') {
          const numProfit = safeParseNumber(product.profit);
          if (numProfit !== null) {
            updates.profit = numProfit;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await productsCollection.updateOne(
            { _id: product._id },
            { $set: updates },
          );
          console.log(`  ✅ Migrated product: ${product.name}`);
          productsMigrated++;
        } else {
          productsSkipped++;
        }
      } catch (error) {
        console.error(`  ❌ Error migrating product ${product.name}:`, error);
        productErrors++;
      }
    }

    console.log(`\n📊 Products Summary:`);
    console.log(`   ✅ Migrated:  ${productsMigrated}`);
    console.log(`   ⏭️  Skipped:   ${productsSkipped}`);
    console.log(`   ❌ Errors:    ${productErrors}`);

    // ========================
    // PHASE 2: Migrate Trades
    // ========================
    console.log('\n\n📦 PHASE 2: Migrating Trades...\n');

    const tradesCollection = db.collection('trades');
    const trades = (await tradesCollection
      .find({})
      .toArray()) as unknown as OldTrade[];

    console.log(`Found ${trades.length} trades to check\n`);

    let tradesMigrated = 0;
    let tradesSkipped = 0;
    let tradeErrors = 0;

    for (const trade of trades) {
      try {
        const updates: any = {};
        let needsUpdate = false;

        // Convert quantity
        if (typeof trade.quantity === 'string') {
          const numQuantity = safeParseNumber(trade.quantity);
          if (numQuantity !== null) {
            updates.quantity = numQuantity;
            needsUpdate = true;
          }
        }

        // Convert buyerOfferedPrice
        if (typeof trade.buyerOfferedPrice === 'string') {
          const numPrice = safeParseNumber(trade.buyerOfferedPrice);
          if (numPrice !== null) {
            updates.buyerOfferedPrice = numPrice;
            needsUpdate = true;
          }
        }

        // Convert sellerOfferedPrice (NEW - schema consistency fix)
        if (typeof trade.sellerOfferedPrice === 'string') {
          const numPrice = safeParseNumber(trade.sellerOfferedPrice);
          if (numPrice !== null) {
            updates.sellerOfferedPrice = numPrice;
            needsUpdate = true;
          }
        }

        // Convert negotiationHistory entries' offeredPrice (NEW - schema consistency fix)
        if (trade.negotiationHistory && trade.negotiationHistory.length > 0) {
          let historyNeedsUpdate = false;
          const updatedHistory = trade.negotiationHistory.map((entry) => {
            if (typeof entry.offeredPrice === 'string') {
              const numPrice = safeParseNumber(entry.offeredPrice);
              if (numPrice !== null) {
                historyNeedsUpdate = true;
                return { ...entry, offeredPrice: numPrice };
              }
            }
            return entry;
          });

          if (historyNeedsUpdate) {
            updates.negotiationHistory = updatedHistory;
            needsUpdate = true;
          }
        }

        // Add stockRestored flag if missing
        if (trade.stockRestored === undefined) {
          // Set to true if trade is already rejected/cancelled (stock would have been restored)
          const isTerminalState = ['rejected', 'cancelled'].includes(
            trade.negotiationStatus || '',
          );
          updates.stockRestored = isTerminalState;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await tradesCollection.updateOne(
            { _id: trade._id },
            { $set: updates },
          );
          console.log(`  ✅ Migrated trade: ${trade._id}`);
          tradesMigrated++;
        } else {
          tradesSkipped++;
        }
      } catch (error) {
        console.error(`  ❌ Error migrating trade ${trade._id}:`, error);
        tradeErrors++;
      }
    }

    console.log(`\n📊 Trades Summary:`);
    console.log(`   ✅ Migrated:  ${tradesMigrated}`);
    console.log(`   ⏭️  Skipped:   ${tradesSkipped}`);
    console.log(`   ❌ Errors:    ${tradeErrors}`);

    // ========================
    // FINAL SUMMARY
    // ========================
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Migration Complete!\n');
    console.log('📊 Overall Summary:');
    console.log(
      `   Products: ${productsMigrated} migrated, ${productsSkipped} skipped, ${productErrors} errors`,
    );
    console.log(
      `   Trades:   ${tradesMigrated} migrated, ${tradesSkipped} skipped, ${tradeErrors} errors`,
    );
    console.log('\n' + '='.repeat(60));

    if (productErrors > 0 || tradeErrors > 0) {
      console.log(
        '\n⚠️  Some errors occurred. Please review the logs above.\n',
      );
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await disconnect();
    console.log('\n📦 Disconnected from MongoDB\n');
  }
}

// Run the migration
migrateSchemaFixes();
