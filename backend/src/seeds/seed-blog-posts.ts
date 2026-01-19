/**
 * Seed script to create test blog posts for the marketplace
 *
 * Run with: npx ts-node src/seeds/seed-blog-posts.ts
 * Or add to package.json: "seed:blog": "ts-node src/seeds/seed-blog-posts.ts"
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// Blog Post Schema inline for seed script
const BlockContentSchema = {
  id: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'paragraph',
      'heading1',
      'heading2',
      'heading3',
      'bulletList',
      'numberedList',
      'image',
      'quote',
      'divider',
      'code',
    ],
    required: true,
  },
  content: { type: String, default: '' },
  meta: {
    alt: String,
    caption: String,
    language: String,
    items: [String],
  },
};

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    content: { type: [BlockContentSchema], default: [] },
    excerpt: { type: String, maxlength: 500 },
    featuredImage: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date },
    categories: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    hsnCodePrefixes: { type: [String], default: [] },
    readTimeMinutes: { type: Number, default: 1, min: 1 },
    viewCount: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

const BlogPost = mongoose.model('BlogPost', BlogPostSchema);

// Admin User Schema for getting/creating admin
const AdminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'admin' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const AdminUser = mongoose.model('AdminUser', AdminUserSchema);

// Sample blog posts data
const sampleBlogPosts = [
  {
    title: 'Global Coffee Market Update: Q1 2025 Trends and Forecasts',
    slug: 'global-coffee-market-update-q1-2025',
    content: [
      {
        id: '1',
        type: 'paragraph',
        content: 'The global coffee market continues to show robust growth as we enter 2025, with significant developments across major producing regions. This comprehensive analysis covers the key trends shaping the industry.',
      },
      {
        id: '2',
        type: 'heading2',
        content: 'Market Overview',
      },
      {
        id: '3',
        type: 'paragraph',
        content: 'Coffee futures have shown remarkable resilience despite global economic uncertainties. The arabica benchmark has risen by 15% compared to last year, driven by supply concerns in Brazil and increasing demand from Asian markets.',
      },
      {
        id: '4',
        type: 'bulletList',
        content: '',
        meta: {
          items: [
            'Brazil production estimates revised down by 8%',
            'Vietnamese robusta exports up 12% year-over-year',
            'Ethiopian specialty coffee commands premium prices',
            'Colombian coffee quality ratings at historic highs',
          ],
        },
      },
      {
        id: '5',
        type: 'heading2',
        content: 'Price Forecast',
      },
      {
        id: '6',
        type: 'paragraph',
        content: 'Analysts predict continued price strength through H1 2025, with arabica likely to test $2.50/lb resistance levels. Robusta may see more volatility due to weather concerns in Vietnam.',
      },
      {
        id: '7',
        type: 'quote',
        content: 'The coffee market is entering a new era of price discovery, with sustainability premiums becoming increasingly significant for buyers and sellers alike.',
      },
    ],
    excerpt: 'Comprehensive analysis of global coffee market trends for Q1 2025, covering price movements, supply dynamics, and demand forecasts.',
    featuredImage: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=400&fit=crop',
    categories: ['Coffee', 'Market Analysis'],
    tags: ['coffee', 'commodities', 'market-trends', 'brazil', 'vietnam'],
    hsnCodePrefixes: ['09'],
    readTimeMinutes: 4,
    viewCount: 245,
  },
  {
    title: 'Sustainable Agriculture: How Organic Certification is Reshaping Trade',
    slug: 'sustainable-agriculture-organic-certification-trade',
    content: [
      {
        id: '1',
        type: 'paragraph',
        content: 'The organic food market has experienced unprecedented growth, with global sales exceeding $200 billion in 2024. This shift is fundamentally changing how agricultural commodities are traded internationally.',
      },
      {
        id: '2',
        type: 'heading2',
        content: 'The Certification Premium',
      },
      {
        id: '3',
        type: 'paragraph',
        content: 'Organic certified products command premiums ranging from 20% to 100% depending on the commodity. For traders, understanding certification requirements is now essential for accessing premium markets.',
      },
      {
        id: '4',
        type: 'numberedList',
        content: '',
        meta: {
          items: [
            'USDA Organic: Primary standard for US market access',
            'EU Organic: Mandatory for European trade',
            'JAS: Required for Japanese market',
            'India Organic: Growing importance in Asian trade',
          ],
        },
      },
      {
        id: '5',
        type: 'heading2',
        content: 'Trade Implications',
      },
      {
        id: '6',
        type: 'paragraph',
        content: 'Cross-certification agreements between major markets have simplified trade, but documentation requirements remain complex. Successful traders are investing in certification management systems.',
      },
    ],
    excerpt: 'Exploring how organic certification requirements are transforming international agricultural trade and creating new opportunities for compliant suppliers.',
    featuredImage: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=400&fit=crop',
    categories: ['Agriculture', 'Sustainability'],
    tags: ['organic', 'certification', 'sustainable-trade', 'agriculture'],
    hsnCodePrefixes: ['07', '08', '09', '10', '12'],
    readTimeMinutes: 3,
    viewCount: 189,
  },
  {
    title: 'Steel Market Outlook: Infrastructure Spending Drives Demand',
    slug: 'steel-market-outlook-infrastructure-spending',
    content: [
      {
        id: '1',
        type: 'paragraph',
        content: 'Global steel markets are experiencing renewed momentum as governments worldwide accelerate infrastructure investments. This article examines the key factors driving steel demand and price dynamics.',
      },
      {
        id: '2',
        type: 'heading2',
        content: 'Infrastructure Boom',
      },
      {
        id: '3',
        type: 'paragraph',
        content: 'Major infrastructure programs in the US, EU, and India are creating sustained demand for steel products. The US Infrastructure Investment and Jobs Act alone is expected to require an additional 15 million metric tons of steel over the next decade.',
      },
      {
        id: '4',
        type: 'bulletList',
        content: '',
        meta: {
          items: [
            'US infrastructure bill: $1.2 trillion over 10 years',
            'India\'s Gati Shakti plan: $1.35 trillion in infrastructure',
            'EU Green Deal: Significant steel demand for renewable energy',
            'China\'s Belt and Road: Continued global construction projects',
          ],
        },
      },
      {
        id: '5',
        type: 'heading2',
        content: 'Supply Dynamics',
      },
      {
        id: '6',
        type: 'paragraph',
        content: 'Production constraints and environmental regulations are limiting supply growth. European steel producers face additional challenges from high energy costs, while Chinese exports remain subject to trade restrictions.',
      },
      {
        id: '7',
        type: 'quote',
        content: 'The steel industry is at an inflection point where decarbonization requirements meet infrastructure demand, creating both challenges and opportunities for traders.',
      },
    ],
    excerpt: 'Analysis of global steel market dynamics driven by infrastructure spending, supply constraints, and environmental regulations.',
    featuredImage: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&h=400&fit=crop',
    categories: ['Steel', 'Infrastructure'],
    tags: ['steel', 'metals', 'infrastructure', 'construction'],
    hsnCodePrefixes: ['72', '73'],
    readTimeMinutes: 5,
    viewCount: 312,
  },
  {
    title: 'Understanding Incoterms 2020: A Practical Guide for Traders',
    slug: 'understanding-incoterms-2020-practical-guide',
    content: [
      {
        id: '1',
        type: 'paragraph',
        content: 'Incoterms define the responsibilities of buyers and sellers in international trade. Understanding these terms is crucial for successful commodity trading and risk management.',
      },
      {
        id: '2',
        type: 'heading2',
        content: 'Most Used Incoterms',
      },
      {
        id: '3',
        type: 'paragraph',
        content: 'While there are 11 Incoterms in the 2020 revision, certain terms dominate commodity trading. Here are the most frequently used terms and their implications.',
      },
      {
        id: '4',
        type: 'heading3',
        content: 'FOB (Free On Board)',
      },
      {
        id: '5',
        type: 'paragraph',
        content: 'FOB is the most common term for bulk commodity shipments. The seller delivers goods on board the vessel, and risk transfers when goods are loaded. Buyers are responsible for ocean freight and insurance.',
      },
      {
        id: '6',
        type: 'heading3',
        content: 'CIF (Cost, Insurance, and Freight)',
      },
      {
        id: '7',
        type: 'paragraph',
        content: 'CIF requires the seller to arrange and pay for freight and insurance to the destination port. This term is popular for container shipments and when buyers want simplified logistics.',
      },
      {
        id: '8',
        type: 'bulletList',
        content: '',
        meta: {
          items: [
            'EXW: Minimum seller obligation, buyer arranges all logistics',
            'FCA: Seller delivers to carrier at named place',
            'CFR: Like CIF but without insurance obligation',
            'DDP: Maximum seller obligation, delivered duty paid',
          ],
        },
      },
    ],
    excerpt: 'A comprehensive guide to Incoterms 2020, explaining the most important trade terms and their practical applications in commodity trading.',
    featuredImage: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&h=400&fit=crop',
    categories: ['Trade Terms', 'Education'],
    tags: ['incoterms', 'international-trade', 'shipping', 'education'],
    hsnCodePrefixes: [],
    readTimeMinutes: 6,
    viewCount: 567,
  },
  {
    title: 'Rice Export Trends: Asia-Pacific Market Analysis',
    slug: 'rice-export-trends-asia-pacific-analysis',
    content: [
      {
        id: '1',
        type: 'paragraph',
        content: 'The Asia-Pacific region dominates global rice trade, accounting for over 80% of world production and consumption. This analysis examines current export trends and market dynamics.',
      },
      {
        id: '2',
        type: 'heading2',
        content: 'Major Exporters',
      },
      {
        id: '3',
        type: 'paragraph',
        content: 'India, Thailand, and Vietnam remain the world\'s top rice exporters, but market shares have shifted significantly due to policy changes and weather events.',
      },
      {
        id: '4',
        type: 'bulletList',
        content: '',
        meta: {
          items: [
            'India: Leading exporter with 40% market share',
            'Thailand: Premium jasmine rice specialist',
            'Vietnam: Competitive pricing, growing market share',
            'Pakistan: Basmati rice focus',
            'Myanmar: Emerging export potential',
          ],
        },
      },
      {
        id: '5',
        type: 'heading2',
        content: 'Price Trends',
      },
      {
        id: '6',
        type: 'paragraph',
        content: 'Rice prices have shown significant volatility due to export restrictions and weather impacts. Thai 5% broken rice benchmark has ranged from $450 to $650 per metric ton in the past year.',
      },
    ],
    excerpt: 'Comprehensive analysis of rice export trends in the Asia-Pacific region, covering major exporters, price movements, and market forecasts.',
    featuredImage: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&h=400&fit=crop',
    categories: ['Grains', 'Market Analysis'],
    tags: ['rice', 'grains', 'asia-pacific', 'india', 'thailand', 'vietnam'],
    hsnCodePrefixes: ['10'],
    readTimeMinutes: 4,
    viewCount: 198,
  },
  {
    title: 'Textile Industry Update: Cotton Supply Chain Challenges',
    slug: 'textile-industry-cotton-supply-chain-challenges',
    content: [
      {
        id: '1',
        type: 'paragraph',
        content: 'The global cotton market faces significant supply chain disruptions that are impacting textile manufacturers worldwide. This article examines the challenges and potential solutions.',
      },
      {
        id: '2',
        type: 'heading2',
        content: 'Supply Constraints',
      },
      {
        id: '3',
        type: 'paragraph',
        content: 'Weather events in major producing regions have reduced global cotton output. The US, India, and China have all reported lower-than-expected harvests, pushing prices higher.',
      },
      {
        id: '4',
        type: 'quote',
        content: 'Sustainable cotton sourcing is no longer optional – it\'s a business imperative as brands face increasing consumer and regulatory pressure.',
      },
      {
        id: '5',
        type: 'heading2',
        content: 'Sustainability Focus',
      },
      {
        id: '6',
        type: 'paragraph',
        content: 'Better Cotton Initiative (BCI) and organic cotton certifications are becoming standard requirements for major brands. Suppliers without sustainability credentials face market access challenges.',
      },
      {
        id: '7',
        type: 'numberedList',
        content: '',
        meta: {
          items: [
            'Better Cotton Initiative covers 22% of global production',
            'Organic cotton premium: 20-30% above conventional',
            'GOTS certification increasingly required for apparel brands',
            'Traceability technology adoption accelerating',
          ],
        },
      },
    ],
    excerpt: 'Examining the challenges facing the cotton supply chain, from weather-related production issues to increasing sustainability requirements.',
    featuredImage: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=800&h=400&fit=crop',
    categories: ['Textiles', 'Cotton'],
    tags: ['cotton', 'textiles', 'sustainability', 'supply-chain'],
    hsnCodePrefixes: ['52', '61', '62'],
    readTimeMinutes: 4,
    viewCount: 156,
  },
];

async function seedBlogPosts() {
  const mongoUri = process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/breyus';

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find or create an admin user to be the author
    let admin = await AdminUser.findOne({ role: 'super_admin' });

    if (!admin) {
      console.log('No admin found, creating a placeholder admin user...');
      admin = await AdminUser.create({
        email: 'admin@breyus.com',
        password: '$2b$10$placeholder', // Placeholder - won't be used for login
        name: 'Breyus Admin',
        role: 'super_admin',
        isActive: true,
      });
      console.log('Created placeholder admin user');
    }

    console.log(`Using admin: ${admin.email} (${admin._id})`);

    // Check for existing posts
    const existingCount = await BlogPost.countDocuments();
    console.log(`Existing blog posts: ${existingCount}`);

    // Create blog posts
    let created = 0;
    let skipped = 0;

    for (const postData of sampleBlogPosts) {
      // Check if post with same slug exists
      const existing = await BlogPost.findOne({ slug: postData.slug });
      if (existing) {
        console.log(`Skipping existing post: ${postData.title}`);
        skipped++;
        continue;
      }

      await BlogPost.create({
        ...postData,
        author: admin._id,
        status: 'published',
        publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      });

      console.log(`Created: ${postData.title}`);
      created++;
    }

    console.log('\n=== Seed Complete ===');
    console.log(`Created: ${created} posts`);
    console.log(`Skipped: ${skipped} posts (already exist)`);
    console.log(`Total posts now: ${await BlogPost.countDocuments()}`);

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed
seedBlogPosts();
