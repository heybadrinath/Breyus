/**
 * Seed script to populate blog portal with test data for analytics verification
 *
 * This creates:
 * - Blog users (writers)
 * - Blog posts with engagement metrics (views, likes, comments)
 * - Various post statuses to test status distribution charts
 *
 * Run with: npx ts-node src/seeds/seed-blog-analytics-data.ts
 */
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────────────────────
// Schema Definitions (inline for standalone execution)
// ─────────────────────────────────────────────────────────────

const BlogUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    breyusUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isBrèyusMember: { type: Boolean, default: false },
    isWriter: { type: Boolean, default: false },
    writerApprovedAt: { type: Date, default: null },
    writerBio: { type: String, default: '', maxlength: 1000 },
    writerAvatar: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
    isSuspended: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'blog_users' },
);

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: { type: String, maxlength: 500 },
    featuredImage: { type: String },
    contentFormat: { type: String, enum: ['tiptap'], default: 'tiptap' },
    tiptapContent: { type: mongoose.Schema.Types.Mixed, default: null },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
    writerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogUser',
      default: null,
    },
    writerDisplayName: { type: String, default: '' },
    writerBio: { type: String, default: '' },
    writerAvatar: { type: String, default: null },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'in_review',
        'revision_requested',
        'approved',
        'published',
        'rejected',
      ],
      default: 'draft',
    },
    publishedAt: { type: Date },
    accessLevel: {
      type: String,
      enum: ['public', 'member_only'],
      default: 'public',
    },
    categories: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    hsnCodePrefixes: { type: [String], default: [] },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
    uniqueViewCount: { type: Number, default: 0, min: 0 },
    readTimeMinutes: { type: Number, default: 1, min: 1 },
    isFeatured: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'blog_posts' },
);

const BlogCommentSchema = new mongoose.Schema(
  {
    blogPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: true,
    },
    blogUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogUser',
      required: true,
    },
    content: { type: String, required: true, maxlength: 2000 },
    isApproved: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'blog_comments' },
);

const BlogUser = mongoose.model('BlogUser', BlogUserSchema);
const BlogPost = mongoose.model('BlogPost', BlogPostSchema);
const BlogComment = mongoose.model('BlogComment', BlogCommentSchema);

// ─────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────

const testWriters = [
  {
    email: 'writer1@breyus-test.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    companyName: 'Global Trade Insights',
    writerBio:
      'Commodity analyst with 10+ years of experience in agricultural markets.',
  },
  {
    email: 'writer2@breyus-test.com',
    firstName: 'Michael',
    lastName: 'Okonkwo',
    companyName: 'African Trade Network',
    writerBio:
      'Expert in Africa-Asia trade corridors and emerging market commodities.',
  },
  {
    email: 'writer3@breyus-test.com',
    firstName: 'Elena',
    lastName: 'Rodriguez',
    companyName: 'Sustainable Trade Partners',
    writerBio:
      'Sustainability consultant focused on ethical sourcing and certification.',
  },
];

// Helper to create Tiptap content structure
function createTiptapContent(paragraphs: string[]): Record<string, any> {
  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  };
}

// Random date within last N days
function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const pastMs = daysAgo * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * pastMs);
}

// Random integer between min and max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Standard category names that match navigation
// Navigation uses: commodities, trading, market-analysis
// Backend regex will match: "Commodities" matches "commodities", "Market Analysis" matches "market-analysis"
const STANDARD_CATEGORIES = {
  commodities: 'Commodities',
  trading: 'Trading',
  marketAnalysis: 'Market Analysis',
  sustainability: 'Sustainability',
  technology: 'Technology',
  logistics: 'Logistics',
  globalTrade: 'Global Trade',
};

// Test posts data - using standard categories that match navigation
const testPosts = [
  // PUBLISHED posts (will show in analytics)
  {
    title: 'Global Coffee Market Update: Q1 2025 Trends',
    slug: 'analytics-test-coffee-market-q1-2025',
    excerpt:
      'Comprehensive analysis of global coffee market trends for Q1 2025.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.marketAnalysis,
    ],
    tags: ['coffee', 'commodities', 'brazil', 'vietnam'],
    status: 'published',
    viewCount: randomInt(500, 2000),
    likeCount: randomInt(50, 200),
    commentCount: randomInt(10, 50),
    shareCount: randomInt(5, 30),
    readTimeMinutes: 5,
    isFeatured: true,
  },
  {
    title: 'Sustainable Agriculture: Organic Certification Guide',
    slug: 'analytics-test-organic-certification',
    excerpt:
      'How organic certification is reshaping international agricultural trade.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.sustainability,
    ],
    tags: ['organic', 'certification', 'sustainable-trade'],
    status: 'published',
    viewCount: randomInt(300, 1500),
    likeCount: randomInt(30, 150),
    commentCount: randomInt(5, 30),
    shareCount: randomInt(10, 40),
    readTimeMinutes: 4,
  },
  {
    title: 'Steel Market Outlook: Infrastructure Driving Demand',
    slug: 'analytics-test-steel-infrastructure',
    excerpt:
      'Analysis of global steel markets driven by infrastructure spending.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.marketAnalysis,
    ],
    tags: ['steel', 'metals', 'infrastructure'],
    status: 'published',
    viewCount: randomInt(400, 1800),
    likeCount: randomInt(40, 180),
    commentCount: randomInt(8, 40),
    shareCount: randomInt(3, 25),
    readTimeMinutes: 6,
  },
  {
    title: 'Rice Export Trends: Asia-Pacific Analysis',
    slug: 'analytics-test-rice-asia-pacific',
    excerpt: 'Examining rice export trends in the Asia-Pacific region.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.globalTrade,
    ],
    tags: ['rice', 'grains', 'asia-pacific', 'india'],
    status: 'published',
    viewCount: randomInt(200, 1000),
    likeCount: randomInt(20, 100),
    commentCount: randomInt(3, 20),
    shareCount: randomInt(2, 15),
    readTimeMinutes: 4,
    accessLevel: 'member_only',
  },
  {
    title: 'Cotton Supply Chain Challenges in 2025',
    slug: 'analytics-test-cotton-supply-chain',
    excerpt:
      'Understanding the cotton supply chain disruptions affecting textile manufacturers.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.logistics,
    ],
    tags: ['cotton', 'textiles', 'supply-chain'],
    status: 'published',
    viewCount: randomInt(150, 800),
    likeCount: randomInt(15, 80),
    commentCount: randomInt(2, 15),
    shareCount: randomInt(1, 10),
    readTimeMinutes: 3,
  },
  {
    title: 'Understanding Incoterms 2020: FOB vs CIF',
    slug: 'analytics-test-incoterms-guide',
    excerpt: 'A practical guide to the most important trade terms.',
    categories: [STANDARD_CATEGORIES.trading, STANDARD_CATEGORIES.globalTrade],
    tags: ['incoterms', 'shipping', 'education'],
    status: 'published',
    viewCount: randomInt(600, 2500),
    likeCount: randomInt(60, 250),
    commentCount: randomInt(15, 60),
    shareCount: randomInt(20, 80),
    readTimeMinutes: 7,
    isPinned: true,
  },
  {
    title: 'Cocoa Market Volatility: West African Outlook',
    slug: 'analytics-test-cocoa-west-africa',
    excerpt:
      'Examining cocoa price volatility and supply concerns from West Africa.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.marketAnalysis,
    ],
    tags: ['cocoa', 'ghana', 'ivory-coast'],
    status: 'published',
    viewCount: randomInt(250, 1200),
    likeCount: randomInt(25, 120),
    commentCount: randomInt(5, 25),
    shareCount: randomInt(5, 20),
    readTimeMinutes: 5,
  },
  // Extra posts to ensure each nav category has content
  {
    title: 'Best Practices for International Trade Negotiations',
    slug: 'analytics-test-trade-negotiations',
    excerpt:
      'Master the art of trade negotiations with these proven strategies.',
    categories: [STANDARD_CATEGORIES.trading],
    tags: ['negotiation', 'strategy', 'best-practices'],
    status: 'published',
    viewCount: randomInt(400, 1500),
    likeCount: randomInt(40, 150),
    commentCount: randomInt(10, 40),
    shareCount: randomInt(8, 30),
    readTimeMinutes: 6,
  },
  {
    title: 'AI and Technology in Modern Commodity Trading',
    slug: 'analytics-test-ai-trading-tech',
    excerpt:
      'How artificial intelligence is transforming commodity trading operations.',
    categories: [STANDARD_CATEGORIES.technology, STANDARD_CATEGORIES.trading],
    tags: ['ai', 'technology', 'automation', 'trading'],
    status: 'published',
    viewCount: randomInt(300, 1200),
    likeCount: randomInt(30, 120),
    commentCount: randomInt(5, 25),
    shareCount: randomInt(10, 35),
    readTimeMinutes: 5,
  },
  // DRAFT posts (for status distribution)
  {
    title: 'Upcoming: Soybean Trade Patterns in South America',
    slug: 'analytics-test-soybean-draft',
    excerpt: 'Draft analysis of soybean trade from Brazil and Argentina.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.marketAnalysis,
    ],
    tags: ['soybean', 'brazil', 'argentina'],
    status: 'draft',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    readTimeMinutes: 4,
  },
  {
    title: 'Work in Progress: Copper Mining in Chile',
    slug: 'analytics-test-copper-draft',
    excerpt: 'Draft: Exploring Chile copper mining trends.',
    categories: [STANDARD_CATEGORIES.commodities],
    tags: ['copper', 'chile', 'mining'],
    status: 'draft',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    readTimeMinutes: 5,
  },
  // SUBMITTED posts (pending review)
  {
    title: 'Submitted: Palm Oil Sustainability Challenges',
    slug: 'analytics-test-palm-oil-submitted',
    excerpt: 'Analysis of sustainability challenges in palm oil industry.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.sustainability,
    ],
    tags: ['palm-oil', 'indonesia', 'malaysia'],
    status: 'submitted',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    readTimeMinutes: 6,
  },
  // IN_REVIEW posts
  {
    title: 'In Review: Sugar Trade and Market Dynamics',
    slug: 'analytics-test-sugar-in-review',
    excerpt: 'Comprehensive look at global sugar trade dynamics.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.marketAnalysis,
    ],
    tags: ['sugar', 'brazil', 'india'],
    status: 'in_review',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    readTimeMinutes: 5,
  },
  // APPROVED posts (ready to publish)
  {
    title: 'Approved: Wheat Export Restrictions Analysis',
    slug: 'analytics-test-wheat-approved',
    excerpt: 'Analysis of wheat export restrictions and their market impact.',
    categories: [
      STANDARD_CATEGORIES.commodities,
      STANDARD_CATEGORIES.globalTrade,
    ],
    tags: ['wheat', 'russia', 'ukraine', 'exports'],
    status: 'approved',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    readTimeMinutes: 4,
  },
];

// Sample comments
const sampleComments = [
  'Great analysis! Very helpful for understanding current market trends.',
  'This is exactly the information I was looking for. Thank you!',
  'Excellent breakdown of the supply chain challenges.',
  'Would love to see more content like this.',
  'Very insightful. The data points are particularly useful.',
  'Thanks for covering this important topic.',
  'Clear and well-researched article.',
  'Looking forward to more updates on this market.',
];

// ─────────────────────────────────────────────────────────────
// Seed Function
// ─────────────────────────────────────────────────────────────

async function seedBlogAnalyticsData() {
  const mongoUri =
    process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/breyus';

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Hash password for test writers
    const hashedPassword = await bcrypt.hash('TestWriter123!', 10);

    // ─────────────────────────────────────────────────────────────
    // Create Writers
    // ─────────────────────────────────────────────────────────────
    console.log('👥 Creating test writers...');
    const writerIds: mongoose.Types.ObjectId[] = [];

    for (const writerData of testWriters) {
      // Check if writer already exists
      let writer = await BlogUser.findOne({ email: writerData.email });

      if (!writer) {
        writer = await BlogUser.create({
          ...writerData,
          password: hashedPassword,
          isWriter: true,
          writerApprovedAt: randomDate(60),
          isBrèyusMember: Math.random() > 0.5, // 50% chance of being Breyus member
        });
        console.log(
          `   ✅ Created writer: ${writerData.firstName} ${writerData.lastName}`,
        );
      } else {
        // Ensure they're marked as writer
        if (!writer.isWriter) {
          writer.isWriter = true;
          writer.writerApprovedAt = randomDate(60);
          await writer.save();
        }
        console.log(
          `   ⏭️  Writer exists: ${writerData.firstName} ${writerData.lastName}`,
        );
      }

      writerIds.push(writer._id);
    }

    console.log(`\n📝 Creating ${testPosts.length} test blog posts...`);

    // ─────────────────────────────────────────────────────────────
    // Create Posts
    // ─────────────────────────────────────────────────────────────
    let createdPosts = 0;
    let skippedPosts = 0;
    const publishedPostIds: mongoose.Types.ObjectId[] = [];

    for (const postData of testPosts) {
      // Check if post exists
      const existing = await BlogPost.findOne({ slug: postData.slug });
      if (existing) {
        console.log(
          `   ⏭️  Post exists: ${postData.title.substring(0, 40)}...`,
        );
        skippedPosts++;
        if (existing.status === 'published') {
          publishedPostIds.push(existing._id);
        }
        continue;
      }

      // Assign random writer
      const writerId = writerIds[randomInt(0, writerIds.length - 1)];
      const writer = await BlogUser.findById(writerId);

      // Create post
      const post = await BlogPost.create({
        ...postData,
        writerId,
        writerDisplayName: `${writer?.firstName} ${writer?.lastName}`,
        writerBio: writer?.writerBio || '',
        tiptapContent: createTiptapContent([
          `This is the opening paragraph of "${postData.title}". The global commodity markets continue to evolve rapidly.`,
          'Market participants are closely watching supply-demand dynamics across key producing regions.',
          'Analysts expect continued volatility as geopolitical factors influence trade flows.',
          'Sustainability considerations are becoming increasingly important for market access.',
          'In conclusion, traders should monitor these developments closely and adjust strategies accordingly.',
        ]),
        publishedAt:
          postData.status === 'published' ? randomDate(30) : undefined,
        uniqueViewCount: Math.round((postData.viewCount || 0) * 0.7),
        featuredImage: `https://images.unsplash.com/photo-${1500000000000 + randomInt(0, 100000000)}?w=800&h=400&fit=crop`,
      });

      console.log(
        `   ✅ Created: ${postData.title.substring(0, 40)}... [${postData.status}]`,
      );
      createdPosts++;

      if (post.status === 'published') {
        publishedPostIds.push(post._id);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Create Comments on published posts
    // ─────────────────────────────────────────────────────────────
    console.log('\n💬 Creating test comments...');
    let createdComments = 0;

    for (const postId of publishedPostIds) {
      const post = await BlogPost.findById(postId);
      if (!post) continue;

      // Create 2-5 comments per published post
      const numComments = randomInt(2, 5);

      for (let i = 0; i < numComments; i++) {
        const userId = writerIds[randomInt(0, writerIds.length - 1)];
        const commentContent =
          sampleComments[randomInt(0, sampleComments.length - 1)];

        // Check if this exact comment exists
        const existing = await BlogComment.findOne({
          blogPostId: postId,
          blogUserId: userId,
          content: commentContent,
        });

        if (!existing) {
          await BlogComment.create({
            blogPostId: postId,
            blogUserId: userId,
            content: commentContent,
            isApproved: true,
          });
          createdComments++;
        }
      }
    }

    console.log(`   ✅ Created ${createdComments} comments`);

    // ─────────────────────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 SEED COMPLETE - Analytics Data Summary');
    console.log('═══════════════════════════════════════════════════');

    const totalWriters = await BlogUser.countDocuments({ isWriter: true });
    const totalPosts = await BlogPost.countDocuments({ isDeleted: false });
    const publishedPosts = await BlogPost.countDocuments({
      status: 'published',
      isDeleted: false,
    });
    const totalComments = await BlogComment.countDocuments({ deletedAt: null });

    // Aggregate total metrics
    const metrics = await BlogPost.aggregate([
      { $match: { status: 'published', isDeleted: false } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: '$commentCount' },
          totalShares: { $sum: '$shareCount' },
        },
      },
    ]);

    const stats = metrics[0] || {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
    };

    console.log(`\n📈 Database Statistics:`);
    console.log(`   Writers:         ${totalWriters}`);
    console.log(`   Total Posts:     ${totalPosts}`);
    console.log(`   Published:       ${publishedPosts}`);
    console.log(`   Comments:        ${totalComments}`);
    console.log(`\n📊 Engagement Metrics (Published Posts):`);
    console.log(`   Total Views:     ${stats.totalViews.toLocaleString()}`);
    console.log(`   Total Likes:     ${stats.totalLikes.toLocaleString()}`);
    console.log(`   Total Comments:  ${stats.totalComments.toLocaleString()}`);
    console.log(`   Total Shares:    ${stats.totalShares.toLocaleString()}`);

    // Post status distribution
    const statusDist = await BlogPost.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log(`\n📋 Post Status Distribution:`);
    for (const s of statusDist) {
      console.log(`   ${s._id.padEnd(20)} ${s.count}`);
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ Seed completed! Analytics page should now show data.');
    console.log('═══════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed
seedBlogAnalyticsData();
