/**
 * Standalone Seed Script for AI-Matching Sellers
 * Creates seller accounts that match the AI service's trade data
 *
 * Run from backend directory:
 * npx ts-node src/seeds/seed-ai-sellers-standalone.ts
 */

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

// MongoDB connection string for Docker setup
const MONGO_URI = 'mongodb://breyus:breyus_secret@localhost:27017/breyus?authSource=admin';

// Schemas
const companySchema = new mongoose.Schema({
  companyName: String,
  companyAddress: String,
  companyMobile: String,
  taxId: { type: String, unique: true, sparse: true },
  role: String,
  isVerified: Boolean,
  tradeType: String,
  founderName: String,
  websiteUrl: String,
  exportedBefore: Boolean,
  referrel: String,
  mainLineBusiness: [String],
  meanMonthlyRevenue: String,
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  onboardingProgress: { type: Number, default: 0 },
  isOnboardingCompleted: { type: Boolean, default: false },
  deliveryAddresses: [Object],
  bankInfo: Object,
  tradeDetails: Object,
  primaryEmail: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  currency: { type: String, default: 'USD' },
  kycDocuments: [Object],
  isKycVerified: { type: Boolean, default: false },
  billingPreferences: Object,
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  mail: { type: String, unique: true },
  password: String,
  role: String,
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  notificationPreferences: Object,
  aiNotificationPreferences: Object,
  isSuspended: { type: Boolean, default: false },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true },
  stockUnit: { type: String, required: true },
  moq: { type: String, required: true },
  moqUnit: { type: String, required: true },
  description: { type: String, required: true },
  detailedDescription: { type: String, required: true },
  category: { type: String, required: true },
  hsnCode: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, required: true },
  sku: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  tags: [String],
  exportLocation: String,
  nearestPort: String,
  selectedIncoterm: String,
  productImages: [String],
  testReports: [String],
  userId: { type: String, required: true },
  isNicheCommodity: { type: Boolean, default: false },
  isDeactivated: { type: Boolean, default: false },
  ownerDeleted: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// Seed data - These match actual companies in the AI PostgreSQL database
const seedSellers = [
  // Singapore exporters (match AI data for rice, chemicals, industrial goods)
  {
    companyName: 'CEM MARKETING PTE LTD',
    email: 'sales@cemmarketing.sg',
    founderName: 'Chen Wei Ming',
    country: 'Singapore',
    city: 'Singapore',
    port: 'Port of Singapore',
    products: [
      { name: 'Premium Thai Jasmine Rice', hsCode: '1006', category: 'Rice', price: 850 },
      { name: 'Basmati Long Grain Rice', hsCode: '1006', category: 'Rice', price: 1200 },
    ],
  },
  {
    companyName: 'CMA PEAKMORE PTE LTD',
    email: 'contact@cmapeakmore.sg',
    founderName: 'Lim Kah Wai',
    country: 'Singapore',
    city: 'Singapore',
    port: 'Port of Singapore',
    products: [
      { name: 'Vietnamese Broken Rice Grade A', hsCode: '1006', category: 'Rice', price: 450 },
      { name: 'Iron Ore Pellets 65% Fe', hsCode: '2601', category: 'Iron Ore', price: 120 },
    ],
  },
  {
    companyName: 'BOK SENG INDUSTRIAL SUPPLY PTE LTD',
    email: 'orders@bokseng.sg',
    founderName: 'Tan Boon Huat',
    country: 'Singapore',
    city: 'Singapore',
    port: 'Port of Singapore',
    products: [
      { name: 'Raw Cane Sugar ICUMSA 150', hsCode: '1701', category: 'Sugar', price: 520 },
      { name: 'Refined White Sugar ICUMSA 45', hsCode: '1701', category: 'Sugar', price: 680 },
    ],
  },
  // India exporters
  {
    companyName: 'INDOSTAR EXPORTS PVT LTD',
    email: 'export@indostar.in',
    founderName: 'Rajesh Sharma',
    country: 'India',
    city: 'Mumbai',
    port: 'Jawaharlal Nehru Port',
    products: [
      { name: 'Indian Sona Masoori Rice', hsCode: '1006', category: 'Rice', price: 720 },
      { name: 'Arabica Coffee Beans AA Grade', hsCode: '0901', category: 'Coffee', price: 3500 },
      { name: 'Robusta Coffee Green Beans', hsCode: '0901', category: 'Coffee', price: 2200 },
    ],
  },
  {
    companyName: 'HINDUSTAN COMMODITIES TRADING',
    email: 'trade@hindustancommodities.in',
    founderName: 'Amit Patel',
    country: 'India',
    city: 'Chennai',
    port: 'Chennai Port',
    products: [
      { name: 'Iron Ore Fines 62% Fe', hsCode: '2601', category: 'Iron Ore', price: 95 },
      { name: 'Manganese Ore 42% Mn', hsCode: '2602', category: 'Manganese Ore', price: 280 },
    ],
  },
  // Brazil exporters
  {
    companyName: 'AGRO BRASIL EXPORTADORA LTDA',
    email: 'exports@agrobrasil.br',
    founderName: 'Carlos Eduardo Santos',
    country: 'Brazil',
    city: 'Santos',
    port: 'Port of Santos',
    products: [
      { name: 'Brazilian Santos Coffee Beans', hsCode: '0901', category: 'Coffee', price: 4200 },
      { name: 'Raw Cane Sugar VHP', hsCode: '1701', category: 'Sugar', price: 480 },
      { name: 'Soybean Meal 46% Protein', hsCode: '2304', category: 'Soybeans', price: 420 },
    ],
  },
  // Vietnam exporters
  {
    companyName: 'VIETNAM RICE EXPORT CORPORATION',
    email: 'sales@vnriceexport.vn',
    founderName: 'Nguyen Van Minh',
    country: 'Vietnam',
    city: 'Ho Chi Minh City',
    port: 'Cat Lai Port',
    products: [
      { name: 'Vietnamese Jasmine Rice ST25', hsCode: '1006', category: 'Rice', price: 680 },
      { name: 'Vietnamese White Rice 5% Broken', hsCode: '1006', category: 'Rice', price: 480 },
      { name: 'Robusta Coffee Grade 1', hsCode: '0901', category: 'Coffee', price: 1900 },
    ],
  },
  // Australia exporters
  {
    companyName: 'PILBARA MINERALS TRADING PTY',
    email: 'sales@pilbaraminerals.au',
    founderName: 'Michael OBrien',
    country: 'Australia',
    city: 'Perth',
    port: 'Port Hedland',
    products: [
      { name: 'Pilbara Iron Ore Lump 62.5% Fe', hsCode: '2601', category: 'Iron Ore', price: 140 },
      { name: 'Iron Ore Fines 58% Fe', hsCode: '2601', category: 'Iron Ore', price: 88 },
    ],
  },
  // Thailand exporters
  {
    companyName: 'THAI PREMIUM RICE CO LTD',
    email: 'export@thaipremiumrice.th',
    founderName: 'Somsak Chaiyaporn',
    country: 'Thailand',
    city: 'Bangkok',
    port: 'Laem Chabang Port',
    products: [
      { name: 'Thai Hom Mali Rice Premium', hsCode: '1006', category: 'Rice', price: 920 },
      { name: 'Thai Parboiled Rice', hsCode: '1006', category: 'Rice', price: 580 },
      { name: 'Tapioca Starch Native', hsCode: '1108', category: 'Starch', price: 450 },
    ],
  },
  // Colombia exporters
  {
    companyName: 'CAFE COLOMBIANO SUPREMO SA',
    email: 'ventas@cafecolombianosupremo.co',
    founderName: 'Juan Pablo Rodriguez',
    country: 'Colombia',
    city: 'Medellin',
    port: 'Port of Buenaventura',
    products: [
      { name: 'Colombian Supremo Coffee Beans', hsCode: '0901', category: 'Coffee', price: 4800 },
      { name: 'Colombian Excelso Coffee', hsCode: '0901', category: 'Coffee', price: 4200 },
    ],
  },
];

async function seed() {
  console.log('Connecting to MongoDB...');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully!\n');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash('Test@12345', 10);

  let companiesCreated = 0;
  let usersCreated = 0;
  let productsCreated = 0;

  console.log('Starting AI Seller Seed...\n');

  for (const seller of seedSellers) {
    try {
      // Check if company already exists
      const existingCompany = await Company.findOne({
        companyName: { $regex: new RegExp(`^${seller.companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });

      if (existingCompany) {
        console.log(`[SKIP] Company already exists: ${seller.companyName}`);
        continue;
      }

      // Check if user email exists
      const existingUser = await User.findOne({ mail: seller.email.toLowerCase() });
      if (existingUser) {
        console.log(`[SKIP] User email already exists: ${seller.email}`);
        continue;
      }

      // Create company
      const company = await Company.create({
        companyName: seller.companyName,
        companyAddress: `${seller.city}, ${seller.country}`,
        companyMobile: '+1234567890',
        taxId: `TAX-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        role: 'Seller',
        isVerified: true,
        tradeType: 'international',
        founderName: seller.founderName,
        websiteUrl: `https://${seller.companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
        exportedBefore: true,
        referrel: 'AI Seed Data',
        mainLineBusiness: [...new Set(seller.products.map(p => p.category))],
        meanMonthlyRevenue: '100000 - 500000',
        users: [],
        onboardingProgress: 100,
        isOnboardingCompleted: true,
        deliveryAddresses: [{
          fullName: seller.founderName,
          mobileNumber: '+1234567890',
          pincode: '100000',
          streetName: 'Industrial Zone',
          city: seller.city,
          state: seller.city,
          country: seller.country,
        }],
        bankInfo: {},
        tradeDetails: {
          agreedToTerms: true,
        },
        primaryEmail: seller.email.toLowerCase(),
        currency: 'USD',
      });

      companiesCreated++;
      console.log(`[CREATE] Company: ${seller.companyName}`);

      // Create user (role must be lowercase to match MongoDB validator)
      const user = await User.create({
        mail: seller.email.toLowerCase(),
        password: hashedPassword,
        role: 'seller',
        company: company._id,
        notificationPreferences: {
          email: {
            tradeCreated: true,
            counterOffer: true,
            tradeAccepted: true,
            tradeRejected: true,
            documentUploaded: true,
            documentsInvalidated: true,
            phaseAdvanced: true,
            tradeCompleted: true,
            tradeCancelled: true,
          },
          realtime: {
            tradeCreated: true,
            counterOffer: true,
            tradeAccepted: true,
            tradeRejected: true,
            documentUploaded: true,
            documentsInvalidated: true,
            phaseAdvanced: true,
            tradeCompleted: true,
            tradeCancelled: true,
          },
        },
        aiNotificationPreferences: {
          useExistingEmail: true,
        },
      });

      usersCreated++;
      console.log(`[CREATE] User: ${seller.email}`);

      // Update company with user reference
      await Company.updateOne(
        { _id: company._id },
        { $push: { users: user._id } }
      );

      // Create products
      for (const product of seller.products) {
        await Product.create({
          name: product.name,
          stock: Math.floor(Math.random() * 10000) + 1000,
          stockUnit: 'MT',
          moq: '100',
          moqUnit: 'MT',
          description: `High quality ${product.name} from ${seller.companyName}`,
          detailedDescription: `${product.name} sourced from ${seller.country}. Premium quality suitable for international trade. Available for immediate shipment from ${seller.port}.`,
          category: product.category,
          hsnCode: product.hsCode,
          price: product.price,
          currency: 'USD',
          sku: `SKU-${product.hsCode}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          isActive: true,
          tags: [product.category.toLowerCase(), seller.country.toLowerCase(), 'export', 'commodity'],
          exportLocation: seller.country,
          nearestPort: seller.port,
          selectedIncoterm: 'FOB',
          productImages: [],
          testReports: [],
          userId: user._id.toString(),
          isNicheCommodity: false,
        });

        productsCreated++;
        console.log(`  [CREATE] Product: ${product.name} (HS: ${product.hsCode})`);
      }
    } catch (error: any) {
      console.error(`[ERROR] Failed to create ${seller.companyName}:`, error.message);
    }
  }

  console.log('\n=== Seed Summary ===');
  console.log(`Companies created: ${companiesCreated}`);
  console.log(`Users created: ${usersCreated}`);
  console.log(`Products created: ${productsCreated}`);
  console.log('\nTest credentials for all seed sellers:');
  console.log('Password: Test@12345');

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB. Seed complete!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
