/**
 * Migration Script: Commodities → Categories
 *
 * This script migrates data from the Commodities collection to the ProductCategory collection.
 * The migration adds mainstream/niche classification to the unified Categories table.
 *
 * Run with: npx ts-node src/seeds/migrate-commodities-to-categories.ts
 *
 * Steps:
 * 1. For each commodity in Commodities collection:
 *    - Find matching category by name OR create new leaf category
 *    - Set isMainstream, aliases, hsCodePrefix from commodity
 * 2. After successful migration, optionally drop Commodities collection
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config();

// Import category schema (still exists)
import {
  ProductCategory,
  ProductCategorySchema,
} from '../admin/content/schemas/product-category.schema';

// ============================================
// LEGACY COMMODITY SCHEMA (for migration only)
// This schema was deleted, but we define it here
// to read from the existing Commodities collection
// ============================================

interface Commodity {
  _id: any;
  name: string;
  slug?: string;
  description?: string;
  parentCategory: string;
  subCategory?: string;
  isMainstream: boolean;
  isActive: boolean;
  aliases?: string[];
  hsCodePrefix?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CommoditySchema = new Schema<Commodity>(
  {
    name: { type: String, required: true },
    slug: { type: String },
    description: { type: String },
    parentCategory: { type: String, required: true },
    subCategory: { type: String },
    isMainstream: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    aliases: [{ type: String }],
    hsCodePrefix: { type: String },
  },
  {
    timestamps: true,
    collection: 'commodities', // Explicitly specify collection name
  },
);

// Create a minimal module for the migration
@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/breyus',
    ),
    MongooseModule.forFeature([
      { name: 'Commodity', schema: CommoditySchema },
      { name: 'ProductCategory', schema: ProductCategorySchema },
    ]),
  ],
})
class MigrationModule {}

interface MigrationStats {
  commoditiesProcessed: number;
  categoriesUpdated: number;
  categoriesCreated: number;
  skipped: number;
  errors: { commodity: string; error: string }[];
}

async function runMigration() {
  console.log('========================================');
  console.log('Commodities → Categories Migration');
  console.log('========================================');
  console.log('');

  const app = await NestFactory.createApplicationContext(MigrationModule);

  const commodityModel = app.get<Model<Commodity>>(getModelToken('Commodity'));
  const categoryModel = app.get<Model<ProductCategory>>(
    getModelToken('ProductCategory'),
  );

  const stats: MigrationStats = {
    commoditiesProcessed: 0,
    categoriesUpdated: 0,
    categoriesCreated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get all commodities
    const commodities = await commodityModel.find({}).lean();
    console.log(`Found ${commodities.length} commodities to migrate\n`);

    if (commodities.length === 0) {
      console.log('No commodities found. The collection may already be empty or migrated.');
      console.log('Proceeding to update unclassified leaf categories...');
    }

    for (const commodity of commodities) {
      stats.commoditiesProcessed++;

      try {
        console.log(`Processing: ${commodity.name} (${commodity.parentCategory})`);

        // Try to find a matching category by name (case-insensitive)
        let category = await categoryModel.findOne({
          name: { $regex: new RegExp(`^${commodity.name}$`, 'i') },
          isDeleted: { $ne: true },
        });

        if (category) {
          // Update existing category with commodity data
          category.isMainstream = commodity.isMainstream;
          category.aliases = commodity.aliases || [];
          category.hsCodePrefix = commodity.hsCodePrefix;

          await category.save();
          stats.categoriesUpdated++;
          console.log(`  ✓ Updated existing category: ${category.name}`);
        } else {
          // Find parent category to attach to
          let parentCategory = await categoryModel.findOne({
            name: { $regex: new RegExp(`^${commodity.parentCategory}$`, 'i') },
            isDeleted: { $ne: true },
          });

          // If no exact parent match, try to find by sub-category
          if (!parentCategory && commodity.subCategory) {
            parentCategory = await categoryModel.findOne({
              name: { $regex: new RegExp(`^${commodity.subCategory}$`, 'i') },
              isDeleted: { $ne: true },
            });
          }

          // Determine level based on parent
          const level = parentCategory ? parentCategory.level + 1 : 2;

          // Generate slug
          const slug = commodity.slug || commodity.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

          // Check if slug already exists
          const existingSlug = await categoryModel.findOne({
            slug,
            isDeleted: { $ne: true },
          });

          if (existingSlug) {
            console.log(`  ⊘ Skipped: Category with slug "${slug}" already exists`);
            stats.skipped++;
            continue;
          }

          // Get max order for siblings
          const maxOrderDoc = await categoryModel
            .findOne({
              parent: parentCategory?._id || null,
              isDeleted: { $ne: true },
            })
            .sort({ order: -1 })
            .lean();
          const order = (maxOrderDoc?.order || 0) + 1;

          // Create new category
          const newCategory = new categoryModel({
            name: commodity.name,
            slug,
            description: commodity.description,
            parent: parentCategory?._id || null,
            level,
            order,
            isActive: commodity.isActive,
            isDeleted: false,
            isMainstream: commodity.isMainstream,
            aliases: commodity.aliases || [],
            hsCodePrefix: commodity.hsCodePrefix,
          });

          await newCategory.save();
          stats.categoriesCreated++;
          console.log(`  ✓ Created new category: ${newCategory.name} (Level ${level})`);
        }
      } catch (error: any) {
        stats.errors.push({
          commodity: commodity.name,
          error: error.message,
        });
        console.log(`  ✗ Error: ${error.message}`);
      }
    }

    console.log('\n========================================');
    console.log('Migration Complete!');
    console.log('========================================');
    console.log(`Commodities processed: ${stats.commoditiesProcessed}`);
    console.log(`Categories updated: ${stats.categoriesUpdated}`);
    console.log(`Categories created: ${stats.categoriesCreated}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\nErrors:');
      stats.errors.forEach((e) => {
        console.log(`  - ${e.commodity}: ${e.error}`);
      });
    }

    // After successful migration, update categories without classification
    // to mark leaf nodes (no children) as mainstream by default
    console.log('\n----------------------------------------');
    console.log('Updating unclassified leaf categories...');

    const unclassifiedLeaves = await categoryModel.find({
      isMainstream: null,
      isDeleted: { $ne: true },
    });

    let leafUpdates = 0;
    for (const cat of unclassifiedLeaves) {
      // Check if this category has children
      const hasChildren = await categoryModel.exists({
        parent: cat._id,
        isDeleted: { $ne: true },
      });

      if (!hasChildren) {
        // This is a leaf node, set to mainstream by default
        cat.isMainstream = true;
        await cat.save();
        leafUpdates++;
      }
    }

    console.log(`Updated ${leafUpdates} leaf categories to mainstream`);

    // Drop the commodities collection after successful migration
    console.log('\n----------------------------------------');
    console.log('Dropping commodities collection...');
    try {
      await commodityModel.collection.drop();
      console.log('✓ Commodities collection dropped successfully');
    } catch (dropError: any) {
      if (dropError.code === 26 || dropError.message?.includes('ns not found')) {
        console.log('⊘ Commodities collection already dropped or does not exist');
      } else {
        console.log(`⚠ Warning: Could not drop collection: ${dropError.message}`);
      }
    }

    console.log('\n========================================');
    console.log('All migrations complete!');
    console.log('========================================');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\nMigration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
