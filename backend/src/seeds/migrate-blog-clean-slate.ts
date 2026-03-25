/**
 * Blog Clean Slate Migration
 *
 * This migration:
 * 1. Deletes all existing blog posts (block-based content is being replaced with Tiptap)
 * 2. Ensures the new blog portal collections are properly indexed
 *
 * Run with: npx ts-node src/seeds/migrate-blog-clean-slate.ts
 *
 * ⚠️ WARNING: This permanently deletes all existing blog posts!
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrateBlogs() {
  const uri = process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/breyus';

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  // Step 1: Count and delete existing blog posts
  const blogPostsCollection = db.collection('blogposts');
  const existingCount = await blogPostsCollection.countDocuments();

  console.log(`\n📊 Found ${existingCount} existing blog posts`);

  if (existingCount > 0) {
    console.log(
      '🗑️  Deleting all existing blog posts (clean slate for Tiptap migration)...',
    );
    const deleteResult = await blogPostsCollection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} blog posts`);
  } else {
    console.log('ℹ️  No existing blog posts to delete');
  }

  // Step 2: Ensure new collections exist with proper indexes
  console.log('\n📁 Setting up new blog portal collections...');

  // blog_users indexes
  try {
    await db
      .collection('blog_users')
      .createIndex({ email: 1 }, { unique: true });
    await db
      .collection('blog_users')
      .createIndex({ breyusUserId: 1 }, { sparse: true });
    await db.collection('blog_users').createIndex({ isWriter: 1 });
    await db.collection('blog_users').createIndex({ isBrèyusMember: 1 });
    console.log('✅ blog_users indexes created');
  } catch (error: any) {
    if (error.code === 85 || error.code === 86) {
      console.log('ℹ️  blog_users indexes already exist');
    } else {
      console.error('❌ Error creating blog_users indexes:', error.message);
    }
  }

  // blog_sessions indexes
  try {
    await db
      .collection('blog_sessions')
      .createIndex({ tokenHash: 1 }, { unique: true });
    await db.collection('blog_sessions').createIndex({ blogUserId: 1 });
    await db
      .collection('blog_sessions')
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('✅ blog_sessions indexes created');
  } catch (error: any) {
    if (error.code === 85 || error.code === 86) {
      console.log('ℹ️  blog_sessions indexes already exist');
    } else {
      console.error('❌ Error creating blog_sessions indexes:', error.message);
    }
  }

  // blog_comments indexes
  try {
    await db.collection('blog_comments').createIndex({ blogPostId: 1 });
    await db.collection('blog_comments').createIndex({ blogUserId: 1 });
    await db.collection('blog_comments').createIndex({ parentId: 1 });
    await db.collection('blog_comments').createIndex({ createdAt: -1 });
    await db
      .collection('blog_comments')
      .createIndex({ isFlagged: 1, isHidden: 1 });
    console.log('✅ blog_comments indexes created');
  } catch (error: any) {
    if (error.code === 85 || error.code === 86) {
      console.log('ℹ️  blog_comments indexes already exist');
    } else {
      console.error('❌ Error creating blog_comments indexes:', error.message);
    }
  }

  // blog_likes indexes
  try {
    await db
      .collection('blog_likes')
      .createIndex({ blogPostId: 1, blogUserId: 1 }, { unique: true });
    await db.collection('blog_likes').createIndex({ blogPostId: 1 });
    console.log('✅ blog_likes indexes created');
  } catch (error: any) {
    if (error.code === 85 || error.code === 86) {
      console.log('ℹ️  blog_likes indexes already exist');
    } else {
      console.error('❌ Error creating blog_likes indexes:', error.message);
    }
  }

  // blog_writer_invites indexes
  try {
    await db
      .collection('blog_writer_invites')
      .createIndex({ token: 1 }, { unique: true });
    await db
      .collection('blog_writer_invites')
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('blog_writer_invites').createIndex({ createdBy: 1 });
    await db
      .collection('blog_writer_invites')
      .createIndex({ usedBy: 1 }, { sparse: true });
    console.log('✅ blog_writer_invites indexes created');
  } catch (error: any) {
    if (error.code === 85 || error.code === 86) {
      console.log('ℹ️  blog_writer_invites indexes already exist');
    } else {
      console.error(
        '❌ Error creating blog_writer_invites indexes:',
        error.message,
      );
    }
  }

  // Step 3: Update blog_posts collection with new indexes
  console.log('\n📁 Updating blog_posts indexes for new schema...');
  try {
    // Drop old text index if it exists (will be recreated with same structure)
    try {
      await blogPostsCollection.dropIndex('title_text_excerpt_text_tags_text');
    } catch {
      // Index might not exist
    }

    // Add new indexes
    await blogPostsCollection.createIndex({ writerId: 1, status: 1 });
    await blogPostsCollection.createIndex({ accessLevel: 1, status: 1 });
    await blogPostsCollection.createIndex({ isFeatured: 1, status: 1 });
    await blogPostsCollection.createIndex({ isPinned: 1, status: 1 });
    await blogPostsCollection.createIndex({ viewCount: -1 });

    // Recreate text index
    await blogPostsCollection.createIndex({
      title: 'text',
      excerpt: 'text',
      tags: 'text',
    });

    console.log('✅ blog_posts indexes updated');
  } catch (error: any) {
    if (error.code === 85 || error.code === 86) {
      console.log('ℹ️  blog_posts indexes already exist');
    } else {
      console.error('❌ Error updating blog_posts indexes:', error.message);
    }
  }

  console.log('\n✅ Blog migration complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Next steps:');
  console.log('1. Restart your backend server');
  console.log('2. Create new blog posts using the Tiptap editor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}

migrateBlogs().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
