/**
 * Migration script to move existing CIS documents to the new kycDocuments array
 *
 * This script:
 * 1. Finds all companies with tradeDetails.cisDocument
 * 2. Creates a new KycDocument entry in kycDocuments array
 * 3. Clears the old cisDocument field
 *
 * Run with: npx ts-node src/seeds/migrate-cis-documents.ts
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

interface OldCompany {
  _id: Types.ObjectId;
  companyName: string;
  tradeDetails?: {
    cisDocument?: string;
    emergingInterest?: string;
    agreedToTerms?: boolean;
  };
  kycDocuments?: any[];
}

async function migrateCisDocuments() {
  console.log('\n🔄 CIS Document Migration Script\n');
  console.log('='.repeat(50));

  try {
    // Connect to MongoDB
    console.log('\n📦 Connecting to MongoDB...');
    await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the companies collection
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection('companies');

    // Find all companies with CIS documents
    const companiesWithCis = (await collection
      .find({
        'tradeDetails.cisDocument': { $exists: true, $nin: [null, ''] },
      })
      .toArray()) as unknown as OldCompany[];

    console.log(
      `📋 Found ${companiesWithCis.length} companies with CIS documents to migrate\n`,
    );

    if (companiesWithCis.length === 0) {
      console.log('ℹ️  No CIS documents to migrate. Exiting.\n');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const company of companiesWithCis) {
      try {
        const cisPath = company.tradeDetails?.cisDocument;
        if (!cisPath) {
          skippedCount++;
          continue;
        }

        // Check if already migrated (prevent duplicate migrations)
        const existingKycDocs = company.kycDocuments || [];
        const alreadyMigrated = existingKycDocs.some(
          (doc: any) => doc.path === cisPath && doc.type === 'cis',
        );

        if (alreadyMigrated) {
          console.log(`⏭️  Skipping ${company.companyName} - already migrated`);
          skippedCount++;
          continue;
        }

        // Extract filename from path
        const filename = cisPath.split('/').pop() || 'cis-document';

        // Create new KYC document entry
        const newKycDocument = {
          _id: new Types.ObjectId(),
          type: 'cis',
          customName: 'CIS Document (Migrated)',
          filename: filename,
          originalName: filename,
          path: cisPath,
          mimeType: 'application/pdf', // Assume PDF, adjust if needed
          size: 0, // Unknown for migrated docs
          status: 'pending',
          uploadedAt: new Date(),
          reviewNotes: 'Migrated from legacy cisDocument field',
        };

        // Update the company document
        await collection.updateOne({ _id: company._id }, {
          $push: { kycDocuments: newKycDocument },
          $unset: { 'tradeDetails.cisDocument': '' },
        } as any);

        console.log(`✅ Migrated: ${company.companyName}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating ${company.companyName}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Migration Summary:\n');
    console.log(`   ✅ Migrated:  ${migratedCount}`);
    console.log(`   ⏭️  Skipped:   ${skippedCount}`);
    console.log(`   ❌ Errors:    ${errorCount}`);
    console.log(`   📋 Total:     ${companiesWithCis.length}\n`);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await disconnect();
    console.log('📦 Disconnected from MongoDB\n');
  }
}

// Run the migration
migrateCisDocuments();
