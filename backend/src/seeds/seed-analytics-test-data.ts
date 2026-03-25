/**
 * Seed Script: Analytics Test Data
 *
 * Creates test products and trades for 2 existing users to populate the analytics dashboard.
 *
 * Requirements:
 * - 10 products (mixed variety: agricultural, metals, other)
 * - 20 trades spread over 90 days
 * - Realistic funnel: 50% completed, 30% in-progress, 20% rejected/cancelled
 * - Multiple delivery countries for geographic analytics
 * - Negotiation history with 1-4 rounds per trade
 *
 * Run: npx ts-node src/seeds/seed-analytics-test-data.ts
 */

import * as mongoose from 'mongoose';
import { Types } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

// ============================================================================
// CONFIGURATION
// ============================================================================

const MONGODB_URI =
  process.env.MONGODB_URI_DEV ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/breyus';

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

// Mixed variety products (agricultural + metals + other)
const SEED_PRODUCTS = [
  // Agricultural
  {
    name: 'Premium Basmati Rice',
    category: 'Cereals',
    hsnCode: '1006',
    price: '850',
    currency: 'USD',
    stock: '5000',
    stockUnit: 'MT',
    moq: '100',
    moqUnit: 'MT',
    description:
      'High-quality aged Basmati rice with long grains and aromatic flavor.',
    detailedDescription:
      'Premium Basmati rice sourced from the foothills of the Himalayas. Aged for 12 months to enhance flavor and elongation. Perfect for biryani, pulao, and other rice dishes.',
    selectedIncoterm: 'FOB' as const,
    tags: ['rice', 'basmati', 'grains', 'food'],
    exportLocation: 'India',
    nearestPort: 'Mumbai Port',
    industry: 'Food & Agriculture',
  },
  {
    name: 'Arabica Coffee Beans',
    category: 'Coffee, Tea & Spices',
    hsnCode: '0901',
    price: '3200',
    currency: 'USD',
    stock: '200',
    stockUnit: 'MT',
    moq: '20',
    moqUnit: 'MT',
    description:
      'Premium single-origin Arabica coffee beans with rich flavor profile.',
    detailedDescription:
      'High-altitude Arabica coffee beans with notes of chocolate, citrus, and caramel. Suitable for espresso and specialty coffee applications.',
    selectedIncoterm: 'CIF' as const,
    tags: ['coffee', 'arabica', 'beverages'],
    exportLocation: 'Brazil',
    nearestPort: 'Santos Port',
    industry: 'Beverages',
  },
  {
    name: 'Raw Cane Sugar ICUMSA 45',
    category: 'Sugar',
    hsnCode: '1701',
    price: '420',
    currency: 'USD',
    stock: '10000',
    stockUnit: 'MT',
    moq: '500',
    moqUnit: 'MT',
    description:
      'White refined sugar with ICUMSA 45 rating for industrial use.',
    detailedDescription:
      'Premium quality refined white sugar meeting international standards. ICUMSA 45 color rating. Suitable for food processing and beverage manufacturing.',
    selectedIncoterm: 'FOB' as const,
    tags: ['sugar', 'refined', 'industrial'],
    exportLocation: 'Brazil',
    nearestPort: 'Santos Port',
    industry: 'Food Processing',
  },
  {
    name: 'Organic Wheat Grade A',
    category: 'Cereals',
    hsnCode: '1001',
    price: '380',
    currency: 'USD',
    stock: '8000',
    stockUnit: 'MT',
    moq: '200',
    moqUnit: 'MT',
    description: 'Certified organic wheat suitable for flour production.',
    detailedDescription:
      'Non-GMO organic wheat with high protein content. Certified by USDA Organic. Ideal for premium flour production and bakery applications.',
    selectedIncoterm: 'EXW' as const,
    tags: ['wheat', 'organic', 'grains', 'flour'],
    exportLocation: 'USA',
    nearestPort: 'Houston Port',
    industry: 'Food & Agriculture',
  },
  {
    name: 'Yellow Soybeans Non-GMO',
    category: 'Oil Seeds',
    hsnCode: '1201',
    price: '520',
    currency: 'USD',
    stock: '3000',
    stockUnit: 'MT',
    moq: '100',
    moqUnit: 'MT',
    description:
      'Non-GMO yellow soybeans for oil extraction and food processing.',
    detailedDescription:
      'High-quality non-GMO soybeans with 40%+ protein content. Suitable for oil extraction, tofu production, and animal feed.',
    selectedIncoterm: 'FOB' as const,
    tags: ['soybeans', 'non-gmo', 'oilseeds'],
    exportLocation: 'Argentina',
    nearestPort: 'Buenos Aires Port',
    industry: 'Food & Agriculture',
  },

  // Metals & Minerals
  {
    name: 'Iron Ore Fines 62% Fe',
    category: 'Ores & Minerals',
    hsnCode: '2601',
    price: '120',
    currency: 'USD',
    stock: '50000',
    stockUnit: 'MT',
    moq: '5000',
    moqUnit: 'MT',
    description: 'High-grade iron ore fines with 62% iron content.',
    detailedDescription:
      'Premium iron ore fines suitable for blast furnace operations. 62% Fe content with low impurities. Consistent sizing for optimal smelting.',
    selectedIncoterm: 'CFR' as const,
    tags: ['iron ore', 'metals', 'mining'],
    exportLocation: 'Australia',
    nearestPort: 'Port Hedland',
    industry: 'Mining & Metals',
  },
  {
    name: 'Copper Cathode Grade A',
    category: 'Base Metals',
    hsnCode: '7403',
    price: '8500',
    currency: 'USD',
    stock: '500',
    stockUnit: 'MT',
    moq: '25',
    moqUnit: 'MT',
    description: 'LME Grade A copper cathodes with 99.99% purity.',
    detailedDescription:
      'High-purity copper cathodes meeting LME specifications. 99.99% Cu content. Suitable for electrical applications and wire drawing.',
    selectedIncoterm: 'CIF' as const,
    tags: ['copper', 'cathode', 'metals'],
    exportLocation: 'Chile',
    nearestPort: 'Antofagasta Port',
    industry: 'Mining & Metals',
  },
  {
    name: 'Aluminum Ingots P1020',
    category: 'Base Metals',
    hsnCode: '7601',
    price: '2400',
    currency: 'USD',
    stock: '1000',
    stockUnit: 'MT',
    moq: '50',
    moqUnit: 'MT',
    description: 'Primary aluminum ingots P1020 grade for industrial use.',
    detailedDescription:
      'High-purity aluminum ingots meeting P1020 specifications. 99.7% Al content. Suitable for extrusion, rolling, and casting applications.',
    selectedIncoterm: 'FOB' as const,
    tags: ['aluminum', 'ingots', 'metals'],
    exportLocation: 'UAE',
    nearestPort: 'Jebel Ali Port',
    industry: 'Mining & Metals',
  },

  // Other Commodities
  {
    name: 'Natural Rubber RSS4',
    category: 'Rubber',
    hsnCode: '4001',
    price: '1800',
    currency: 'USD',
    stock: '800',
    stockUnit: 'MT',
    moq: '40',
    moqUnit: 'MT',
    description: 'Ribbed Smoked Sheet Grade 4 natural rubber.',
    detailedDescription:
      'Premium quality natural rubber meeting RSS4 specifications. Suitable for tire manufacturing and industrial rubber products.',
    selectedIncoterm: 'CIF' as const,
    tags: ['rubber', 'natural', 'industrial'],
    exportLocation: 'Thailand',
    nearestPort: 'Bangkok Port',
    industry: 'Rubber & Plastics',
  },
  {
    name: 'Cotton Bales Shankar-6',
    category: 'Cotton & Textiles',
    hsnCode: '5201',
    price: '1650',
    currency: 'USD',
    stock: '2000',
    stockUnit: 'Bales',
    moq: '100',
    moqUnit: 'Bales',
    description: 'Premium Shankar-6 cotton bales with 29mm staple length.',
    detailedDescription:
      'High-quality Shankar-6 cotton with excellent spinning properties. 29mm staple length, 4.0-4.2 micronaire. Ideal for fine yarn production.',
    selectedIncoterm: 'FOB' as const,
    tags: ['cotton', 'textiles', 'fiber'],
    exportLocation: 'India',
    nearestPort: 'Mundra Port',
    industry: 'Textiles',
  },
];

// Delivery countries for geographic analytics
const DELIVERY_ADDRESSES = [
  {
    fullName: 'John Smith',
    mobileNumber: '+1-555-0123',
    pincode: '90001',
    streetName: '123 Trade Boulevard',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    additionalDetails: 'Port of Los Angeles delivery zone',
  },
  {
    fullName: 'Hans Mueller',
    mobileNumber: '+49-40-12345',
    pincode: '20095',
    streetName: 'Handelsweg 45',
    city: 'Hamburg',
    state: 'Hamburg',
    country: 'Germany',
    additionalDetails: 'Near Hamburg Port warehouse district',
  },
  {
    fullName: 'Ahmed Al-Rashid',
    mobileNumber: '+971-4-5551234',
    pincode: '12345',
    streetName: 'Jebel Ali Free Zone',
    city: 'Dubai',
    state: 'Dubai',
    country: 'United Arab Emirates',
    additionalDetails: 'JAFZA South area',
  },
  {
    fullName: 'Wei Chen',
    mobileNumber: '+86-21-12345678',
    pincode: '200000',
    streetName: '88 Pudong Road',
    city: 'Shanghai',
    state: 'Shanghai',
    country: 'China',
    additionalDetails: 'Yangshan Deep Water Port area',
  },
  {
    fullName: 'Carlos Oliveira',
    mobileNumber: '+55-13-3456789',
    pincode: '11010-100',
    streetName: 'Avenida Conselheiro Nebias',
    city: 'Santos',
    state: 'São Paulo',
    country: 'Brazil',
    additionalDetails: 'Port of Santos industrial zone',
  },
  {
    fullName: 'Raj Patel',
    mobileNumber: '+91-22-12345678',
    pincode: '400001',
    streetName: 'Nariman Point',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    additionalDetails: 'Near JNPT Port',
  },
  {
    fullName: 'Takeshi Yamamoto',
    mobileNumber: '+81-3-1234-5678',
    pincode: '135-0064',
    streetName: 'Ariake Coliseum Area',
    city: 'Tokyo',
    state: 'Tokyo',
    country: 'Japan',
    additionalDetails: 'Tokyo Bay logistics hub',
  },
  {
    fullName: 'James Wilson',
    mobileNumber: '+44-20-7123-4567',
    pincode: 'E14 5HQ',
    streetName: 'Canary Wharf',
    city: 'London',
    state: 'England',
    country: 'United Kingdom',
    additionalDetails: 'London Gateway Port delivery',
  },
];

// Trade status distribution for realistic funnel
const TRADE_DISTRIBUTIONS = {
  // 50% completed (10 trades)
  COMPLETED: 10,
  // 30% in progress
  PAYMENT: 3,
  SPA: 2,
  ICPO: 1,
  // 20% rejected/cancelled
  REJECTED: 2,
  CANCELLED: 2,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a random date within the last N days, weighted toward recent dates
 */
function getRandomDate(maxDaysAgo: number = 90): Date {
  // Weight toward recent dates (more trades recently)
  const weight = Math.random() * Math.random(); // Skews toward 0
  const daysBack = Math.floor(weight * maxDaysAgo);
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  date.setHours(
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    0,
    0,
  );
  return date;
}

/**
 * Generate a date after a given date but before now
 */
function getDateAfter(startDate: Date, maxDaysAfter: number = 14): Date {
  const daysToAdd = Math.floor(Math.random() * maxDaysAfter) + 1;
  const date = new Date(startDate);
  date.setDate(date.getDate() + daysToAdd);
  date.setHours(
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    0,
    0,
  );

  // Make sure it's not in the future
  const now = new Date();
  return date > now ? now : date;
}

/**
 * Generate random negotiation history
 */
interface NegotiationRound {
  round: number;
  party: string;
  offeredPrice: string;
  message: string;
  timestamp: Date;
}

function generateNegotiationHistory(
  rounds: number,
  basePrice: number,
  createdAt: Date,
): { history: NegotiationRound[]; finalPrice: string; status: string } {
  const history: NegotiationRound[] = [];
  let currentPrice = basePrice;
  let timestamp = new Date(createdAt);

  for (let i = 0; i < rounds; i++) {
    const party = i % 2 === 0 ? 'buyer' : 'seller';

    if (party === 'buyer') {
      // Buyer typically offers lower
      currentPrice = currentPrice * (0.85 + Math.random() * 0.1);
    } else {
      // Seller counters higher
      currentPrice = currentPrice * (1.02 + Math.random() * 0.05);
    }

    timestamp = getDateAfter(timestamp, 3);

    history.push({
      round: i + 1,
      party,
      offeredPrice: Math.round(currentPrice).toString(),
      message:
        party === 'buyer'
          ? `Requesting price adjustment to ${Math.round(currentPrice)} per unit based on market rates.`
          : `Counter-offer at ${Math.round(currentPrice)} considering quality and shipping costs.`,
      timestamp,
    });
  }

  return {
    history,
    finalPrice: Math.round(currentPrice).toString(),
    status: 'accepted',
  };
}

/**
 * Generate a unique SKU
 */
function generateSKU(productName: string, index: number): string {
  const prefix = productName.substring(0, 3).toUpperCase().replace(/\s/g, '');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}-${index.toString().padStart(3, '0')}`;
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedAnalyticsTestData() {
  console.log('='.repeat(60));
  console.log('  ANALYTICS TEST DATA SEEDER');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('');

    const db = mongoose.connection.db!;

    // Collections
    const usersCollection = db.collection('users');
    const productsCollection = db.collection('products');
    const tradesCollection = db.collection('trades');

    // ========================================================================
    // SAFETY CHECK: Ensure seed data doesn't already exist
    // ========================================================================

    console.log('Checking for existing seed data...');
    const existingSeededProducts = await productsCollection.countDocuments({
      _seedData: true,
    });
    const existingSeededTrades = await tradesCollection.countDocuments({
      _seedData: true,
    });

    if (existingSeededProducts > 0 || existingSeededTrades > 0) {
      console.error('');
      console.error('='.repeat(60));
      console.error('  ERROR: Seed data already exists!');
      console.error('='.repeat(60));
      console.error('');
      console.error(
        `  Found: ${existingSeededProducts} seeded products, ${existingSeededTrades} seeded trades`,
      );
      console.error('');
      console.error('  To re-seed, first delete existing seed data:');
      console.error('    db.products.deleteMany({ _seedData: true })');
      console.error('    db.trades.deleteMany({ _seedData: true })');
      console.error('');
      process.exit(1);
    }
    console.log('No existing seed data found. Proceeding...');
    console.log('');

    // ========================================================================
    // STEP 1: Find existing users
    // ========================================================================

    console.log('Step 1: Finding existing users...');
    const users = await usersCollection.find({}).limit(2).toArray();

    if (users.length < 2) {
      console.error('');
      console.error('ERROR: Need at least 2 users in the database.');
      console.error(`Found only ${users.length} user(s).`);
      console.error('Please create users first via the onboarding flow.');
      process.exit(1);
    }

    // Determine buyer and seller based on role
    // Role: 'admin' = Buyer, 'user' = Seller (based on schema exploration)
    let buyer, seller;

    if (users[0].role === 'admin') {
      buyer = users[0];
      seller = users[1];
    } else if (users[1].role === 'admin') {
      buyer = users[1];
      seller = users[0];
    } else {
      // If both are same role, just assign first as buyer
      buyer = users[0];
      seller = users[1];
    }

    // IMPORTANT: Use company IDs, not user IDs!
    // Analytics queries by companyId (from JWT), not userId
    const buyerCompanyId = buyer.company;
    const sellerCompanyId = seller.company;

    if (!buyerCompanyId || !sellerCompanyId) {
      console.error('');
      console.error('ERROR: Users must have associated companies.');
      console.error(`Buyer company: ${buyerCompanyId || 'MISSING'}`);
      console.error(`Seller company: ${sellerCompanyId || 'MISSING'}`);
      process.exit(1);
    }

    console.log(
      `  Buyer:  ${buyer.mail} (User: ${buyer._id}, Company: ${buyerCompanyId})`,
    );
    console.log(
      `  Seller: ${seller.mail} (User: ${seller._id}, Company: ${sellerCompanyId})`,
    );
    console.log('');

    // ========================================================================
    // STEP 2: Create products for the seller
    // ========================================================================

    console.log('Step 2: Creating products for seller...');

    const productsToInsert = SEED_PRODUCTS.map((product, index) => ({
      ...product,
      sku: generateSKU(product.name, index),
      userId: sellerCompanyId.toString(), // Use COMPANY ID, not user ID!
      isActive: true,
      onSale: false,
      productImages: [],
      testReports: [],
      createdAt: getRandomDate(120), // Products created in last 4 months
      updatedAt: new Date(),
      _seedData: true,
      _seedVersion: 1,
    }));

    const productResult = await productsCollection.insertMany(productsToInsert);
    console.log(`  Created ${productResult.insertedCount} products`);

    // Get inserted product IDs
    const productIds = Object.values(productResult.insertedIds);
    console.log('');

    // ========================================================================
    // STEP 3: Create trades with realistic funnel distribution
    // ========================================================================

    console.log(
      'Step 3: Creating trades with realistic funnel distribution...',
    );

    const tradesToInsert: any[] = [];
    let tradeIndex = 0;

    // Helper to create a trade
    const createTrade = (
      phase: string,
      productId: Types.ObjectId,
      product: any,
      negotiationStatus: string = 'accepted',
    ) => {
      const createdAt = getRandomDate(90);
      const basePrice = parseFloat(product.price);
      const quantity =
        Math.floor(Math.random() * 10 + 1) * parseInt(product.moq);
      const negotiationRounds = Math.floor(Math.random() * 3) + 1;

      const { history, finalPrice } = generateNegotiationHistory(
        negotiationRounds,
        basePrice,
        createdAt,
      );

      const deliveryAddress =
        DELIVERY_ADDRESSES[tradeIndex % DELIVERY_ADDRESSES.length];

      const trade: any = {
        product: productId,
        buyer: new Types.ObjectId(buyerCompanyId), // Use COMPANY ID, not user ID!
        seller: new Types.ObjectId(sellerCompanyId), // Use COMPANY ID, not user ID!

        // Basic trade info
        quantity: quantity.toString(),
        quantityUnit: product.stockUnit,

        // Negotiation
        buyerOfferedPrice: Math.round(basePrice * 0.9).toString(),
        buyerMessage: `Interested in purchasing ${quantity} ${product.stockUnit} of ${product.name}. Please confirm availability.`,
        sellerOfferedPrice: finalPrice,
        sellerMessage: 'Price confirmed. Ready to proceed with trade.',

        // Incoterms
        buyerIncoterms: {
          selectedIncoterm: product.selectedIncoterm || 'FOB',
          selectedIncotermData: {},
        },
        sellerOfferedIncoterms: {
          selectedIncoterm: product.selectedIncoterm || 'FOB',
          selectedIncotermData: {},
        },

        // Address
        selectedAddress: deliveryAddress,

        // Trade queries
        buyerMarketYears: (Math.floor(Math.random() * 15) + 3).toString(),
        tradeYears: (Math.floor(Math.random() * 10) + 2).toString(),
        buyerIndustryType: product.industry || 'General Trading',

        // Payment
        paymentMethod: {
          type: ['advance', 'credit', 'openAccount'][
            Math.floor(Math.random() * 3)
          ],
          method: Math.random() > 0.5 ? 'RTGS' : 'LetterOfCredit',
          percentage: '30',
          days: '60',
        },

        // Negotiation tracking
        negotiationStatus,
        currentNegotiationRound: negotiationRounds,
        negotiationHistory: history,

        // Status
        purchaseRequestStatus: 'accepted',
        purchaseOrderStatus: phase === 'PR' ? 'pending' : 'accepted',
        tradePhase: phase,

        // Notification badges
        buyerHasUnread: false,
        sellerHasUnread: false,

        // Timestamps
        createdAt,
        updatedAt: new Date(),

        // Seed marker
        _seedData: true,
        _seedVersion: 1,
      };

      // Add phase-specific data
      if (phase !== 'PR' && negotiationStatus === 'accepted') {
        trade.acceptedAt = getDateAfter(createdAt, 5);
      }

      if (
        ['SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED'].includes(phase)
      ) {
        trade.scoSubmittedAt = getDateAfter(trade.acceptedAt || createdAt, 3);
        trade.scoDocument = {
          status: 'approved',
          uploadedAt: trade.scoSubmittedAt,
          uploadedBy: new Types.ObjectId(seller._id),
          version: 1,
        };
      }

      if (['ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED'].includes(phase)) {
        trade.icpoSubmittedAt = getDateAfter(trade.scoSubmittedAt, 3);
        trade.icpoDocument = {
          status: 'approved',
          uploadedAt: trade.icpoSubmittedAt,
          uploadedBy: new Types.ObjectId(buyer._id),
          version: 1,
        };
      }

      if (['SPA', 'PAYMENT', 'BOL', 'COMPLETED'].includes(phase)) {
        trade.spaUploadedAt = getDateAfter(trade.icpoSubmittedAt, 3);
        trade.spaSellerSignedAt = trade.spaUploadedAt;
        trade.spaBuyerSignedAt = getDateAfter(trade.spaUploadedAt, 2);
        trade.spaDocument = {
          status: 'approved',
          uploadedAt: trade.spaUploadedAt,
          uploadedBy: new Types.ObjectId(seller._id),
          sellerSignedAt: trade.spaSellerSignedAt,
          sellerSignedBy: new Types.ObjectId(seller._id),
          buyerSignedAt: trade.spaBuyerSignedAt,
          buyerSignedBy: new Types.ObjectId(buyer._id),
          version: 1,
        };
      }

      if (['PAYMENT', 'BOL', 'COMPLETED'].includes(phase)) {
        trade.paymentVerifiedAt = getDateAfter(trade.spaBuyerSignedAt, 5);
        trade.paymentProof = {
          status: 'approved',
          uploadedAt: trade.paymentVerifiedAt,
          uploadedBy: new Types.ObjectId(buyer._id),
          version: 1,
        };
      }

      if (['BOL', 'COMPLETED'].includes(phase)) {
        trade.bolUploadedAt = getDateAfter(trade.paymentVerifiedAt, 7);
        trade.bolDocument = {
          status: 'approved',
          uploadedAt: trade.bolUploadedAt,
          uploadedBy: new Types.ObjectId(seller._id),
          version: 1,
        };
      }

      if (phase === 'COMPLETED') {
        trade.completedAt = getDateAfter(trade.bolUploadedAt, 2);
      }

      // Handle rejected trades
      if (negotiationStatus === 'rejected') {
        trade.tradePhase = 'PR';
        trade.negotiationStatus = 'rejected';
        trade.purchaseRequestStatus = 'rejected';
        trade.rejectedAt = getDateAfter(createdAt, 3);
        trade.rejectionReason =
          'Unable to meet price requirements at this time.';
      }

      // Handle cancelled trades
      if (negotiationStatus === 'cancelled') {
        trade.tradePhase = 'CANCELLED';
        trade.negotiationStatus = 'cancelled';
        trade.cancelledAt = getDateAfter(
          createdAt,
          Math.floor(Math.random() * 20) + 5,
        );
        trade.cancelledBy =
          Math.random() > 0.5
            ? new Types.ObjectId(buyer._id)
            : new Types.ObjectId(seller._id);
        trade.cancellationReason =
          'Trade cancelled due to market conditions change.';
      }

      tradeIndex++;
      return trade;
    };

    // Create completed trades (50%)
    for (let i = 0; i < TRADE_DISTRIBUTIONS.COMPLETED; i++) {
      const productIndex = i % productIds.length;
      tradesToInsert.push(
        createTrade(
          'COMPLETED',
          productIds[productIndex] as Types.ObjectId,
          productsToInsert[productIndex],
        ),
      );
    }

    // Create in-progress trades (PAYMENT phase - 15%)
    for (let i = 0; i < TRADE_DISTRIBUTIONS.PAYMENT; i++) {
      const productIndex = (i + 2) % productIds.length;
      tradesToInsert.push(
        createTrade(
          'PAYMENT',
          productIds[productIndex] as Types.ObjectId,
          productsToInsert[productIndex],
        ),
      );
    }

    // Create in-progress trades (SPA phase - 10%)
    for (let i = 0; i < TRADE_DISTRIBUTIONS.SPA; i++) {
      const productIndex = (i + 4) % productIds.length;
      tradesToInsert.push(
        createTrade(
          'SPA',
          productIds[productIndex] as Types.ObjectId,
          productsToInsert[productIndex],
        ),
      );
    }

    // Create in-progress trades (ICPO phase - 5%)
    for (let i = 0; i < TRADE_DISTRIBUTIONS.ICPO; i++) {
      const productIndex = (i + 6) % productIds.length;
      tradesToInsert.push(
        createTrade(
          'ICPO',
          productIds[productIndex] as Types.ObjectId,
          productsToInsert[productIndex],
        ),
      );
    }

    // Create rejected trades (10%)
    for (let i = 0; i < TRADE_DISTRIBUTIONS.REJECTED; i++) {
      const productIndex = (i + 7) % productIds.length;
      tradesToInsert.push(
        createTrade(
          'PR',
          productIds[productIndex] as Types.ObjectId,
          productsToInsert[productIndex],
          'rejected',
        ),
      );
    }

    // Create cancelled trades (10%)
    for (let i = 0; i < TRADE_DISTRIBUTIONS.CANCELLED; i++) {
      const productIndex = (i + 8) % productIds.length;
      tradesToInsert.push(
        createTrade(
          'SPA',
          productIds[productIndex] as Types.ObjectId,
          productsToInsert[productIndex],
          'cancelled',
        ),
      );
    }

    const tradeResult = await tradesCollection.insertMany(tradesToInsert);
    console.log(`  Created ${tradeResult.insertedCount} trades`);
    console.log('');

    // ========================================================================
    // STEP 4: Summary
    // ========================================================================

    console.log('='.repeat(60));
    console.log('  SEED COMPLETE - SUMMARY');
    console.log('='.repeat(60));
    console.log('');

    // Count trades by phase
    const phaseCounts = await tradesCollection
      .aggregate([
        { $match: { _seedData: true } },
        { $group: { _id: '$tradePhase', count: { $sum: 1 } } },
      ])
      .toArray();

    console.log('  Products created:');
    console.log(`    Total: ${productResult.insertedCount}`);
    console.log('');

    console.log('  Trades created by phase:');
    for (const phase of phaseCounts) {
      console.log(`    ${phase._id}: ${phase.count}`);
    }
    console.log(`    Total: ${tradeResult.insertedCount}`);
    console.log('');

    // Count by country
    const countryCounts = await tradesCollection
      .aggregate([
        { $match: { _seedData: true } },
        { $group: { _id: '$selectedAddress.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    console.log('  Trades by delivery country:');
    for (const country of countryCounts) {
      console.log(`    ${country._id}: ${country.count}`);
    }
    console.log('');

    console.log('  Seed data marker: _seedData: true');
    console.log('');
    console.log('  To delete seed data later:');
    console.log('    db.products.deleteMany({ _seedData: true })');
    console.log('    db.trades.deleteMany({ _seedData: true })');
    console.log('');
    console.log('='.repeat(60));
    console.log('  SUCCESS!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('');
    console.error('ERROR during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
seedAnalyticsTestData();
