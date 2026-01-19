/**
 * Seed Script for AI-Matching Sellers
 * Creates seller accounts that match the AI service's trade data
 * This ensures "On Platform" matches appear in AI search results
 *
 * Run: npx ts-node src/seeds/seed-ai-sellers.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Types based on schemas
interface User {
  _id: Types.ObjectId;
  mail: string;
  password: string;
  role: string;
  company: Types.ObjectId;
}

interface Company {
  _id: Types.ObjectId;
  companyName: string;
  companyAddress: string;
  companyMobile: string;
  taxId: string;
  role: string;
  isVerified: boolean;
  tradeType: string;
  founderName: string;
  websiteUrl: string;
  exportedBefore: boolean;
  referrel: string;
  mainLineBusiness: string[];
  meanMonthlyRevenue: string;
  users: Types.ObjectId[];
  onboardingProgress: number;
  isOnboardingCompleted: boolean;
  deliveryAddresses: any[];
  bankInfo: any;
  tradeDetails: any;
  primaryEmail: string;
  currency: string;
}

interface Product {
  name: string;
  stock: number;
  stockUnit: string;
  moq: string;
  moqUnit: string;
  description: string;
  detailedDescription: string;
  category: string;
  hsnCode: string;
  price: number;
  currency: string;
  sku: string;
  isActive: boolean;
  tags: string[];
  exportLocation: string;
  nearestPort: string;
  selectedIncoterm: string;
  productImages: string[];
  testReports: string[];
  userId: string;
  isNicheCommodity: boolean;
}

// Seed data - These match actual companies in the AI PostgreSQL database
const seedSellers = [
  {
    // Singapore exporters (match AI data for rice, chemicals, industrial goods)
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
    founderName: 'Michael O\'Brien',
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
  console.log('Starting AI Seller Seed Script...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken('User'));
  const companyModel = app.get<Model<Company>>(getModelToken('Company'));
  const productModel = app.get<Model<Product>>(getModelToken('Product'));

  const hashedPassword = await bcrypt.hash('Test@12345', 10);

  let companiesCreated = 0;
  let usersCreated = 0;
  let productsCreated = 0;

  for (const seller of seedSellers) {
    // Check if company already exists
    const existingCompany = await companyModel.findOne({
      companyName: { $regex: new RegExp(`^${seller.companyName}$`, 'i') }
    });

    if (existingCompany) {
      console.log(`[SKIP] Company already exists: ${seller.companyName}`);
      continue;
    }

    // Check if user email exists
    const existingUser = await userModel.findOne({ mail: seller.email.toLowerCase() });
    if (existingUser) {
      console.log(`[SKIP] User email already exists: ${seller.email}`);
      continue;
    }

    // Create company
    const company = await companyModel.create({
      companyName: seller.companyName,
      companyAddress: `${seller.city}, ${seller.country}`,
      companyMobile: '+1234567890',
      taxId: `TAX-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      role: 'Seller',
      isVerified: true,
      tradeType: 'international',
      founderName: seller.founderName,
      websiteUrl: `https://${seller.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      exportedBefore: true,
      referrel: 'AI Seed Data',
      mainLineBusiness: seller.products.map(p => p.category),
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

    // Create user
    const user = await userModel.create({
      mail: seller.email.toLowerCase(),
      password: hashedPassword,
      role: 'Seller',
      company: company._id,
    });

    usersCreated++;
    console.log(`[CREATE] User: ${seller.email}`);

    // Update company with user reference
    await companyModel.updateOne(
      { _id: company._id },
      { $push: { users: user._id } }
    );

    // Create products
    for (const product of seller.products) {
      await productModel.create({
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
        sku: `SKU-${product.hsCode}-${Date.now()}`,
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
  }

  console.log('\n=== Seed Summary ===');
  console.log(`Companies created: ${companiesCreated}`);
  console.log(`Users created: ${usersCreated}`);
  console.log(`Products created: ${productsCreated}`);
  console.log('\nTest credentials for all seed sellers:');
  console.log('Password: Test@12345\n');

  await app.close();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
