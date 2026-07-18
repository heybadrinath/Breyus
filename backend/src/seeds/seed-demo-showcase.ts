import mongoose, { Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import Redis from 'ioredis';

const SEED = 'portfolio-showcase-v1';
const PRIMARY_EMAIL = 'heybadrinath@gmail.com';
const SECONDARY_EMAIL = 'heybadrinath.work@gmail.com';
const DAY = 24 * 60 * 60 * 1000;
const DEMO_HISTORY_DAYS = 180;
const now = new Date();
const uploadsRoot = process.env.DEMO_UPLOADS_ROOT || join(process.cwd(), 'uploads');

type NativeDocument = Record<string, any>;
type ObjectId = Types.ObjectId;

function demoId(key: string): ObjectId {
  return new Types.ObjectId(createHash('sha256').update(`${SEED}:${key}`).digest('hex').slice(0, 24));
}

function daysAgo(days: number, hour = 10): Date {
  const value = new Date(now.getTime() - days * DAY);
  value.setUTCHours(hour, (days * 7) % 60, 0, 0);
  if (value.getTime() > now.getTime()) {
    return new Date(now.getTime() - ((hour % 4) + 1) * 60 * 60 * 1000);
  }
  return value;
}

function futureDays(days: number): Date {
  return new Date(now.getTime() + days * DAY);
}

function cappedPastDateAfter(base: Date, days: number, hoursBeforeNow = 1): Date {
  return new Date(Math.min(now.getTime() - hoursBeforeNow * 60 * 60 * 1000, base.getTime() + days * DAY));
}

async function invalidateAnalyticsCaches(): Promise<number> {
  if (!process.env.REDIS_URL) return 0;

  const redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  });
  let invalidated = 0;

  try {
    await redis.connect();
    for (const pattern of ['analytics:*', 'admin:analytics:*']) {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length) {
          invalidated += await redis.del(...keys);
        }
      } while (cursor !== '0');
    }
  } finally {
    redis.disconnect();
  }

  return invalidated;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return replacements[character];
  });
}

async function writeAsset(relativePath: string, contents: string | Buffer): Promise<string> {
  const absolutePath = join(uploadsRoot, relativePath);
  await fs.mkdir(dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents);
  return `/uploads/${relativePath.replaceAll('\\', '/')}`;
}

function createShowcaseSvg(
  title: string,
  subtitle: string,
  primary: string,
  secondary: string,
  width = 1600,
  height = 900,
): string {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${secondary}"/>
    </linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-opacity="0.22"/></filter>
  </defs>
  <rect width="100%" height="100%" rx="36" fill="url(#background)"/>
  <circle cx="1310" cy="130" r="290" fill="#ffffff" opacity="0.08"/>
  <circle cx="1420" cy="760" r="360" fill="#ffffff" opacity="0.07"/>
  <path d="M90 690 C330 520 510 760 760 570 S1180 420 1510 610" fill="none" stroke="#ffffff" stroke-width="22" opacity="0.16"/>
  <rect x="105" y="112" width="1390" height="676" rx="42" fill="#ffffff" opacity="0.12" filter="url(#shadow)"/>
  <text x="150" y="360" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="700">${safeTitle}</text>
  <text x="154" y="435" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="34" opacity="0.88">${safeSubtitle}</text>
  <rect x="154" y="520" width="220" height="7" rx="4" fill="#ffffff" opacity="0.9"/>
  <text x="154" y="620" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="29" letter-spacing="7" opacity="0.8">GLOBAL TRADE SHOWCASE</text>
</svg>`;
}

function createPdf(lines: string[]): Buffer {
  const escapePdf = (value: string) => value.replace(/([\\()])/g, '\\$1');
  const textCommands = lines
    .slice(0, 24)
    .map((line, index) => `BT /F1 ${index === 0 ? 18 : 11} Tf 54 ${760 - index * 28} Td (${escapePdf(line)}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(textCommands)} >>\nstream\n${textCommands}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

function tiptap(title: string, paragraphs: string[]): NativeDocument {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: title }] },
      ...paragraphs.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
      {
        type: 'bulletList',
        content: [
          'Confirm specifications and origin before contracting.',
          'Align payment milestones with shipping documents.',
          'Track port, currency, and quality risks throughout the deal.',
        ].map((text) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
        })),
      },
    ],
  };
}

const notificationPreferences = {
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
    documentRejected: true,
    lastAttemptWarning: true,
    tradeAutoCancelled: true,
    signedSpaRequired: true,
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
    documentRejected: true,
    lastAttemptWarning: true,
    tradeAutoCancelled: true,
    signedSpaRequired: true,
  },
};

const productSpecs = [
  { name: 'Premium 1121 Golden Sella Basmati Rice', category: 'Basmati Rice', hsn: '10063020', unit: 'MT', price: 1180, stock: 850, color: ['#6b5b20', '#c4a24e'] },
  { name: 'Specialty Grade Arabica Coffee Beans', category: 'Arabica Coffee', hsn: '09011110', unit: 'MT', price: 4820, stock: 220, color: ['#3a2318', '#9b6042'] },
  { name: 'Milling Grade Hard Red Wheat', category: 'Wheat', hsn: '10019910', unit: 'MT', price: 342, stock: 2400, color: ['#7a4c16', '#d9a441'] },
  { name: 'Organic Long Staple Cotton Fibre', category: 'Cotton', hsn: '52010015', unit: 'Bales', price: 1840, stock: 640, color: ['#67727e', '#d4dce4'] },
  { name: 'ICUMSA 45 Refined White Sugar', category: 'Sugar', hsn: '17019910', unit: 'MT', price: 568, stock: 3100, color: ['#4f6a78', '#b7d3db'] },
  { name: 'RSS3 Natural Rubber Sheets', category: 'RSS Rubber', hsn: '40012100', unit: 'MT', price: 2140, stock: 390, color: ['#453429', '#a48362'] },
  { name: 'LME Grade A Copper Cathodes', category: 'Copper', hsn: '74031100', unit: 'MT', price: 9820, stock: 180, color: ['#6c2f1c', '#d26d3e'] },
  { name: 'P1020 Primary Aluminium Ingots', category: 'Aluminum Ingots', hsn: '76011010', unit: 'MT', price: 2640, stock: 470, color: ['#42536a', '#a5b5c9'] },
] as const;

const hsnEntries = [
  ['10063020', 'Basmati rice, semi-milled or wholly milled', 'Rice'],
  ['10063010', 'Rice, parboiled', 'Rice'],
  ['09011110', 'Coffee, Arabica, not roasted or decaffeinated', 'Coffee'],
  ['09011190', 'Other coffee, not roasted', 'Coffee'],
  ['10019910', 'Wheat for milling', 'Cereals'],
  ['10019920', 'Other wheat and meslin', 'Cereals'],
  ['52010015', 'Cotton, long staple, not carded or combed', 'Textiles'],
  ['52010020', 'Cotton, medium staple', 'Textiles'],
  ['17019910', 'Refined white sugar', 'Sugar'],
  ['17011410', 'Raw cane sugar', 'Sugar'],
  ['40012100', 'Natural rubber in smoked sheets', 'Rubber'],
  ['40012200', 'Technically specified natural rubber', 'Rubber'],
  ['74031100', 'Refined copper cathodes and sections', 'Metals'],
  ['74031900', 'Other refined copper', 'Metals'],
  ['76011010', 'Primary aluminium ingots', 'Metals'],
  ['76012010', 'Aluminium alloy ingots', 'Metals'],
  ['09024020', 'Black tea in bulk packaging', 'Tea'],
  ['15111000', 'Crude palm oil', 'Edible Oils'],
  ['15119020', 'Refined palm oil', 'Edible Oils'],
  ['12019000', 'Soya beans', 'Oilseeds'],
  ['12074090', 'Sesame seeds', 'Oilseeds'],
  ['07133100', 'Dried mung beans', 'Pulses'],
  ['07132000', 'Dried chickpeas', 'Pulses'],
  ['08013100', 'Cashew nuts in shell', 'Nuts'],
  ['08013220', 'Cashew kernels', 'Nuts'],
  ['09041120', 'Black pepper, unground', 'Spices'],
  ['09083120', 'Cardamom, unground', 'Spices'],
  ['10059000', 'Maize other than seed', 'Cereals'],
  ['26030000', 'Copper ores and concentrates', 'Ores'],
  ['72011000', 'Non-alloy pig iron', 'Metals'],
  ['27101990', 'Other petroleum oils', 'Energy'],
  ['31021000', 'Urea fertilizer', 'Fertilizers'],
];

const postTopics = [
  ['Basmati Rice Outlook: Demand Signals Across the Gulf', 'Commodities', 'Rice'],
  ['How to Structure a Commodity Purchase Request', 'Trading', 'Purchase requests'],
  ['Coffee Differentials and the 2026 Crop Cycle', 'Market Analysis', 'Coffee'],
  ['Traceable Cotton: From Farm Gate to Finished Bale', 'Sustainability', 'Cotton'],
  ['Digital Documents Are Reshaping Cross-Border Trade', 'Technology', 'Trade technology'],
  ['Reducing Port Delays With Better Pre-Shipment Planning', 'Logistics', 'Shipping'],
  ['The New India–Gulf Trade Corridor', 'Global Trade', 'Trade corridors'],
  ['Sugar Market Brief: Freight, Weather, and Currency', 'Market Analysis', 'Sugar'],
  ['Incoterms 2020: Choosing Between FOB and CIF', 'Trading', 'Incoterms'],
  ['Responsible Natural Rubber Procurement', 'Sustainability', 'Natural rubber'],
  ['Copper Cathodes: A Buyer Quality Checklist', 'Commodities', 'Copper'],
  ['Building Trust During Multi-Round Negotiations', 'Trading', 'Negotiation'],
  ['Aluminium Supply Chains in a Low-Carbon Economy', 'Sustainability', 'Aluminium'],
  ['Bills of Lading: What Operations Teams Must Verify', 'Logistics', 'Shipping documents'],
  ['Wheat Quality Grades Explained for Importers', 'Commodities', 'Wheat'],
  ['Using Market Data Without Chasing Every Price Move', 'Market Analysis', 'Market data'],
  ['A Practical Guide to Trade Payment Proofs', 'Trading', 'Payments'],
  ['Warehouse Visibility for Mid-Market Exporters', 'Technology', 'Warehousing'],
  ['Why Product Testing Reports Matter', 'Commodities', 'Quality assurance'],
  ['Negotiating Long-Term Supply Agreements', 'Global Trade', 'Contracts'],
  ['Carbon Reporting for Commodity Logistics', 'Sustainability', 'Carbon reporting'],
  ['Five Checks Before Approving an ICPO', 'Trading', 'ICPO'],
  ['Editorial Notes: Our Commodity Coverage Roadmap', 'Global Trade', 'Editorial'],
  ['Palm Oil Freight Economics From Origin to Destination', 'Market Analysis', 'Palm oil'],
  ['Supplier Due Diligence for Agricultural Commodities', 'Trading', 'Supplier verification'],
  ['Tea Auction Prices and Contract Quality Adjustments', 'Commodities', 'Tea'],
  ['Planning Container Capacity for Peak Export Months', 'Logistics', 'Container planning'],
  ['How Currency Volatility Changes Commodity Margins', 'Market Analysis', 'Currency risk'],
  ['A Buyer Guide to Certificates of Analysis', 'Commodities', 'Certificates of analysis'],
  ['Sustainable Packaging for Bulk Commodity Shipments', 'Sustainability', 'Packaging'],
  ['When to Use Documentary Collections in Trade', 'Trading', 'Documentary collections'],
  ['Port Congestion Indicators Operations Teams Can Track', 'Logistics', 'Port congestion'],
  ['Understanding Maize Grades for Regional Buyers', 'Commodities', 'Maize'],
  ['Building a Repeatable Export Documentation Checklist', 'Technology', 'Document workflows'],
  ['How Buyers Compare Competing Commodity Offers', 'Trading', 'Offer comparison'],
  ['Cashew Supply Seasons and Processing Capacity', 'Market Analysis', 'Cashews'],
  ['Responsible Mineral Sourcing for Industrial Buyers', 'Sustainability', 'Mineral sourcing'],
  ['Demurrage and Detention: Preventing Avoidable Costs', 'Logistics', 'Demurrage'],
  ['Quality Claims: Evidence, Timelines, and Resolution', 'Trading', 'Quality claims'],
  ['Black Pepper Market Brief for Wholesale Importers', 'Commodities', 'Black pepper'],
  ['Digital Audit Trails for Trade Operations', 'Technology', 'Audit trails'],
  ['Forecasting Seasonal Demand Without Overcommitting', 'Market Analysis', 'Demand planning'],
  ['A Seller Guide to Strong Commercial Offers', 'Trading', 'Commercial offers'],
  ['Water Stewardship in Agricultural Supply Chains', 'Sustainability', 'Water stewardship'],
  ['Coordinating Surveyors, Agents, and Port Teams', 'Logistics', 'Port operations'],
  ['Urea Procurement: Specifications and Delivery Risk', 'Commodities', 'Fertilizers'],
  ['Trade Operations Metrics Worth Reviewing Monthly', 'Technology', 'Operations metrics'],
  ['Research Notes: Expanding Industrial Commodity Coverage', 'Global Trade', 'Editorial research'],
] as const;

async function main(): Promise<void> {
  const mongoUri =
    process.env.MONGODB_URI_PROD || process.env.MONGODB_URI_DEV || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('A MongoDB connection string is required.');
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection was established without a database.');
  }

  const users = db.collection('users');
  const companies = db.collection('companies');
  const existingPrimary = await users.findOne({ mail: PRIMARY_EMAIL });
  if (!existingPrimary?.password || !existingPrimary.company) {
    throw new Error(`The existing account ${PRIMARY_EMAIL} is required before running this seed.`);
  }
  const admin = await db.collection('adminusers').findOne({ email: 'admin@breyus.com' });
  if (!admin) {
    throw new Error('The default admin account must exist before running this seed.');
  }

  const obsoleteEmailIndex = (await users.indexes()).find((index) => index.name === 'email_1');
  if (obsoleteEmailIndex) {
    await users.dropIndex('email_1');
  }
  const mailIndex = (await users.indexes()).find((index) => index.name === 'mail_1');
  if (!mailIndex) {
    await users.createIndex({ mail: 1 }, { unique: true, name: 'mail_1' });
  }

  const primaryUserId = existingPrimary._id as ObjectId;
  const primaryCompanyId = existingPrimary.company as ObjectId;
  const existingSecondary = await users.findOne({ mail: SECONDARY_EMAIL });
  const secondaryUserId = (existingSecondary?._id as ObjectId | undefined) || demoId('user:secondary');
  const secondaryCompanyId =
    (existingSecondary?.company as ObjectId | undefined) || demoId('company:secondary');

  const profileAssets = await Promise.all([
    writeAsset(
      'demo/companies/badrinath-global-profile.svg',
      createShowcaseSvg('BG', 'Badrinath Global', '#182a3a', '#766f51', 900, 900),
    ),
    writeAsset(
      'demo/companies/badrinath-global-banner.svg',
      createShowcaseSvg('Badrinath Global Trade Partners', 'Reliable commodity sourcing across Asia and the Gulf', '#182a3a', '#766f51'),
    ),
    writeAsset(
      'demo/companies/badrinath-works-profile.svg',
      createShowcaseSvg('BW', 'Badrinath Works', '#263a2e', '#a2763d', 900, 900),
    ),
    writeAsset(
      'demo/companies/badrinath-works-banner.svg',
      createShowcaseSvg('Badrinath Works Commodities', 'Quality-led exports for food, fibre, and industrial inputs', '#263a2e', '#a2763d'),
    ),
  ]);

  const kycPaths = await Promise.all([
    writeAsset(
      'demo/kyc/badrinath-global-cis.pdf',
      createPdf(['CUSTOMER INFORMATION SHEET', 'Badrinath Global Trade Partners', 'Chennai, India', 'Verification copy for showcase trading profile']),
    ),
    writeAsset(
      'demo/kyc/badrinath-global-catalog.pdf',
      createPdf(['PRODUCT CATALOG', 'Badrinath Global Trade Partners', 'Rice, coffee, wheat, cotton, sugar, rubber, copper, aluminium']),
    ),
    writeAsset(
      'demo/kyc/badrinath-works-cis.pdf',
      createPdf(['CUSTOMER INFORMATION SHEET', 'Badrinath Works Commodities', 'Hyderabad, India', 'Verification copy for showcase trading profile']),
    ),
    writeAsset(
      'demo/kyc/badrinath-works-catalog.pdf',
      createPdf(['PRODUCT CATALOG', 'Badrinath Works Commodities', 'Food commodities, fibres, and industrial metals']),
    ),
  ]);

  const companyProfiles = [
    {
      _id: primaryCompanyId,
      companyName: 'Badrinath Global Trade Partners',
      companyAddress: 'Level 7, Olympia Tech Park, Guindy, Chennai, Tamil Nadu 600032',
      companyMobile: '+91 78429 00154',
      whatsappContact: '+91 78429 00154',
      taxId: '33AABCB9042Q1Z8',
      country: 'India',
      founderName: 'Badrinath Reddy',
      websiteUrl: 'https://badrinath-global.example',
      primaryEmail: PRIMARY_EMAIL,
      alternativeSalesEmail: 'sales@badrinath-global.example',
      mainLineBusiness: ['International trading', 'Commodity sourcing', 'Wholesale distribution'],
      meanMonthlyRevenue: '100k Dollars - 1000k Dollars',
      tradeType: 'international',
      profilePicture: profileAssets[0],
      bannerImage: profileAssets[1],
      bankInfo: {
        ifscCode: 'HDFC0000123',
        accountNumber: '50200041025837',
        accountHolderName: 'Badrinath Global Trade Partners',
        bankAddress: 'Anna Salai, Chennai, Tamil Nadu',
        bankBranch: 'Chennai Trade Finance Branch',
      },
      deliveryAddresses: [
        { fullName: 'Badrinath Reddy', mobileNumber: '+91 78429 00154', pincode: '600001', streetName: 'Gate 3, Chennai Port Trust', landmark: 'Near Customs House', city: 'Chennai', state: 'Tamil Nadu', country: 'India', additionalDetails: 'Notify logistics desk 24 hours before arrival.' },
        { fullName: 'Inbound Operations', mobileNumber: '+91 78429 00154', pincode: '500081', streetName: 'HITEC City Main Road', landmark: 'Next to Cyber Towers', city: 'Hyderabad', state: 'Telangana', country: 'India', additionalDetails: 'Warehouse receiving: 09:00–17:00 IST.' },
      ],
      kycDocuments: [
        { _id: demoId('kyc:p:cis'), type: 'cis', customName: 'Customer Information Sheet', description: 'Verified company and banking profile', filename: 'badrinath-global-cis.pdf', originalName: 'Badrinath Global CIS.pdf', path: kycPaths[0], mimeType: 'application/pdf', size: 2048, status: 'approved', uploadedAt: daysAgo(55), reviewedBy: admin._id, reviewedAt: daysAgo(53), reviewNotes: 'Company information and banking references verified.' },
        { _id: demoId('kyc:p:catalog'), type: 'product_catalog', customName: '2026 Export Catalog', filename: 'badrinath-global-catalog.pdf', originalName: '2026 Export Catalog.pdf', path: kycPaths[1], mimeType: 'application/pdf', size: 2048, status: 'approved', uploadedAt: daysAgo(54), reviewedBy: admin._id, reviewedAt: daysAgo(52), reviewNotes: 'Catalog approved for marketplace use.' },
      ],
      isKycVerified: true,
      kycVerifiedBy: admin._id,
      kycVerifiedAt: daysAgo(52),
      kycVerificationNotes: 'Business profile reviewed for the demo trading workspace.',
      gstVerified: true,
      gstVerifiedAt: daysAgo(54),
      gstPendingManualReview: false,
      gstVerificationData: { legalName: 'Badrinath Global Trade Partners Private Limited', tradeName: 'Badrinath Global', status: 'Active', registrationDate: '2021-04-16', stateJurisdiction: 'Tamil Nadu' },
    },
    {
      _id: secondaryCompanyId,
      companyName: 'Badrinath Works Commodities',
      companyAddress: 'Plot 18, Financial District, Nanakramguda, Hyderabad, Telangana 500032',
      companyMobile: '+91 78429 00155',
      whatsappContact: '+91 78429 00155',
      taxId: '36AALFB6724D1Z4',
      country: 'India',
      founderName: 'Badrinath Reddy',
      websiteUrl: 'https://badrinath-works.example',
      primaryEmail: SECONDARY_EMAIL,
      alternativeSalesEmail: 'trade@badrinath-works.example',
      mainLineBusiness: ['Commodity exports', 'Contract supply', 'Quality assurance'],
      meanMonthlyRevenue: '100k Dollars - 1000k Dollars',
      tradeType: 'international',
      profilePicture: profileAssets[2],
      bannerImage: profileAssets[3],
      bankInfo: {
        ifscCode: 'ICIC0000456',
        accountNumber: '145205003182',
        accountHolderName: 'Badrinath Works Commodities',
        bankAddress: 'Financial District, Hyderabad, Telangana',
        bankBranch: 'Gachibowli Commercial Branch',
      },
      deliveryAddresses: [
        { fullName: 'Export Operations', mobileNumber: '+91 78429 00155', pincode: '500032', streetName: 'Financial District Road', landmark: 'Opposite WaveRock SEZ', city: 'Hyderabad', state: 'Telangana', country: 'India', additionalDetails: 'Document delivery desk on the second floor.' },
        { fullName: 'Port Logistics Team', mobileNumber: '+91 78429 00155', pincode: '530035', streetName: 'Visakhapatnam Port Area', landmark: 'Near Container Terminal', city: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', additionalDetails: 'Container receiving by confirmed slot only.' },
      ],
      kycDocuments: [
        { _id: demoId('kyc:s:cis'), type: 'cis', customName: 'Customer Information Sheet', description: 'Company, tax, and banking information', filename: 'badrinath-works-cis.pdf', originalName: 'Badrinath Works CIS.pdf', path: kycPaths[2], mimeType: 'application/pdf', size: 2048, status: 'approved', uploadedAt: daysAgo(44), reviewedBy: admin._id, reviewedAt: daysAgo(42), reviewNotes: 'Identity and company information approved.' },
        { _id: demoId('kyc:s:catalog'), type: 'product_catalog', customName: 'Commodity Supply Catalog', filename: 'badrinath-works-catalog.pdf', originalName: 'Commodity Supply Catalog.pdf', path: kycPaths[3], mimeType: 'application/pdf', size: 2048, status: 'pending', uploadedAt: daysAgo(3) },
      ],
      isKycVerified: false,
      kycVerificationNotes: 'Core company identity approved; refreshed product catalog awaits review.',
      gstVerified: true,
      gstVerifiedAt: daysAgo(43),
      gstPendingManualReview: false,
      gstVerificationData: { legalName: 'Badrinath Works Commodities LLP', tradeName: 'Badrinath Works', status: 'Active', registrationDate: '2022-09-05', stateJurisdiction: 'Telangana' },
    },
  ];

  for (const profile of companyProfiles) {
    const { _id: companyId, ...companyProfile } = profile;
    await companies.updateOne(
      { _id: companyId },
      {
        $set: {
          ...companyProfile,
          role: 'Seller and Buyer',
          isVerified: profile.isKycVerified,
          exportedBefore: true,
          referrel: 'Industry network',
          users: [companyId.equals(primaryCompanyId) ? primaryUserId : secondaryUserId],
          onboardingProgress: 100,
          isOnboardingCompleted: true,
          tradeDetails: { emergingInterest: 'Long-term international commodity partnerships', agreedToTerms: true, cisDocument: profile.kycDocuments[0].path },
          billingPreferences: { useExistingEmail: true, invoiceEmail: profile.primaryEmail },
          currency: 'USD',
          createdAt: daysAgo(225),
          updatedAt: now,
          demoSeed: SEED,
        },
        $setOnInsert: { __v: 0 },
        $unset: { onboardingExpiresAt: '' },
      },
      { upsert: true },
    );
  }

  await users.updateOne(
    { _id: primaryUserId },
    {
      $set: {
        mail: PRIMARY_EMAIL,
        company: primaryCompanyId,
        notificationPreferences,
        aiNotificationPreferences: { useExistingEmail: true },
        isSuspended: false,
        failedLoginAttempts: 0,
        lockUntil: null,
        createdAt: daysAgo(220),
        updatedAt: now,
      },
      $unset: { role: '', suspendedAt: '', suspensionReason: '', suspendedBy: '' },
    },
  );
  await users.updateOne(
    { _id: secondaryUserId },
    {
      $set: {
        mail: SECONDARY_EMAIL,
        password: existingSecondary?.password || existingPrimary.password,
        company: secondaryCompanyId,
        notificationPreferences,
        aiNotificationPreferences: { useExistingEmail: true },
        isSuspended: false,
        failedLoginAttempts: 0,
        lockUntil: null,
        createdAt: daysAgo(215),
        updatedAt: now,
        demoSeed: SEED,
      },
      $setOnInsert: { __v: 0 },
      $unset: { role: '', suspendedAt: '', suspensionReason: '', suspendedBy: '' },
    },
    { upsert: true },
  );

  const seededCollections = [
    'products',
    'trades',
    'auditlogs',
    'notifications',
    'conversations',
    'messages',
    'wishlists',
    'feedbacks',
    'tradedisputes',
    'adminactivitylogs',
    'alertrules',
    'alerthistory',
    'failedloginattempts',
    'blockedips',
    'blog_posts',
    'blog_users',
    'blog_comments',
    'blog_likes',
    'blog_writer_invites',
    'newslettersubscribers',
    'hsn_codes',
  ];
  for (const collectionName of seededCollections) {
    await db.collection(collectionName).deleteMany({ demoSeed: SEED });
  }

  const categories = await db.collection('productcategories').find({
    name: { $in: productSpecs.map((product) => product.category) },
  }).toArray();
  const categoryByName = new Map(categories.map((category) => [category.name, category]));

  const products: NativeDocument[] = [];
  for (const [ownerIndex, owner] of [
    { userId: primaryUserId, companyCode: 'BGP', port: 'Chennai Port', origin: 'India' },
    { userId: secondaryUserId, companyCode: 'BWC', port: 'Visakhapatnam Port', origin: 'India' },
  ].entries()) {
    for (const [productIndex, specification] of productSpecs.entries()) {
      const productId = demoId(`product:${ownerIndex}:${productIndex}`);
      const imagePath = await writeAsset(
        `demo/products/${owner.companyCode.toLowerCase()}-${slugify(specification.name)}.svg`,
        createShowcaseSvg(specification.name, `${specification.category} · Export grade · Origin: ${owner.origin}`, specification.color[0], specification.color[1]),
      );
      const reportPath = await writeAsset(
        `demo/products/${owner.companyCode.toLowerCase()}-${slugify(specification.name)}-quality-report.pdf`,
        createPdf(['INDEPENDENT QUALITY REPORT', specification.name, `HS code: ${specification.hsn}`, `Supplier: ${owner.companyCode}`, 'Result: Conforms to agreed export specification', 'Inspection standard: ISO sampling protocol']),
      );
      const productAgeDays = [210, 204, 198, 192, 186, 180, 32, 4];
      const createdAt = daysAgo(productAgeDays[productIndex] + ownerIndex);
      const viewHistoryDays = Math.min(DEMO_HISTORY_DAYS, productAgeDays[productIndex] + ownerIndex + 1);
      const dailyViews = Array.from({ length: viewHistoryDays }, (_, day) => ({
        date: daysAgo(viewHistoryDays - 1 - day),
        count: 5 + ((productIndex * 11 + ownerIndex * 7 + day * 3) % 42),
      }));
      const basePrice = specification.price + ownerIndex * Math.max(12, Math.round(specification.price * 0.018));
      const isAdminDeactivated = ownerIndex === 1 && productIndex === 7;
      products.push({
        _id: productId,
        name: specification.name,
        stock: productIndex === 6 && ownerIndex === 1 ? 0 : specification.stock - ownerIndex * 30,
        stockUnit: specification.unit,
        moq: String(productIndex === 3 ? 50 : 25),
        moqUnit: specification.unit,
        description: `Consistent export-grade ${specification.category.toLowerCase()} supplied with traceable origin and lot documentation.`,
        detailedDescription: `${specification.name} is prepared for international wholesale buyers. Each shipment includes commercial packing, independent quality checks, traceability records, and documentation aligned to the agreed Incoterm.`,
        application: 'Food processing, wholesale distribution, industrial manufacturing, and long-term contract supply.',
        environmentalImpact: productIndex % 2 === 0 ? 'Supplier tracks water, energy, and freight impact for each contracted shipment.' : 'Responsible sourcing documentation is available on request.',
        qualityAssurance: 'Pre-shipment inspection, certificate of analysis, and sealed lot samples are available.',
        category: specification.category,
        hsnCode: specification.hsn,
        price: basePrice,
        currency: 'USD',
        sku: `BRY-${['BASM', 'COFF', 'WHEAT', 'COTT', 'SUGAR', 'RUBB', 'COPP', 'ALUM'][productIndex]}-${ownerIndex + 1}${String(productIndex + 1).padStart(3, '0')}`,
        isActive: productIndex !== 7 || ownerIndex === 0,
        onSale: productIndex === 1 || productIndex === 4,
        discount: productIndex === 1 ? 6 : productIndex === 4 ? 4 : 0,
        salePrice: productIndex === 1 ? Math.round(basePrice * 0.94) : productIndex === 4 ? Math.round(basePrice * 0.96) : undefined,
        costOfGoods: Math.round(basePrice * 0.78),
        profit: Math.round(basePrice * 0.22),
        pricing: 'Contract and spot pricing available',
        margin: '18–24%',
        tags: [specification.category.toLowerCase(), 'export-grade', 'verified-supplier', owner.origin.toLowerCase()],
        exportLocation: owner.origin,
        nearestPort: owner.port,
        revenueMin: '100,000',
        revenueMax: '1,000,000',
        currencyTrade: 'USD',
        unitTrade: 'Annual contract value',
        paymentTerms: '20% advance with balance against verified shipping documents or irrevocable LC at sight.',
        logisticsTerms: 'Containerized shipment with inspection and insurance options.',
        popTerms: 'Warehouse receipt, inspection certificate, and lot photographs before dispatch.',
        yearsTrade: String(6 + ownerIndex),
        industry: specification.category,
        marketYears: String(8 + productIndex),
        sellerMarketYears: String(7 + ownerIndex),
        marketcapture: `${3 + productIndex}%`,
        selectedIncoterm: productIndex % 3 === 0 ? 'FOB' : productIndex % 3 === 1 ? 'CIF' : 'CFR',
        selectedIncotermData: { 'Export clearance': 'Seller', Insurance: productIndex % 3 === 1 ? 'Seller' : 'Buyer', 'Import clearance': 'Buyer' },
        productImages: [imagePath],
        testReports: [reportPath],
        userId: owner.userId.toHexString(),
        categoryId: categoryByName.get(specification.category)?._id?.toString(),
        isNicheCommodity: categoryByName.get(specification.category)?.isMainstream === false,
        isDeactivated: isAdminDeactivated,
        deactivatedAt: isAdminDeactivated ? daysAgo(2) : undefined,
        deactivatedBy: isAdminDeactivated ? admin._id.toString() : undefined,
        deactivationReason: isAdminDeactivated ? 'Temporarily hidden while the latest smelter certificate is reviewed.' : undefined,
        ownerDeleted: false,
        isFeatured: productIndex < 3 || productIndex === 6,
        featuredAt: productIndex < 3 || productIndex === 6 ? daysAgo(8 + productIndex) : undefined,
        featuredBy: productIndex < 3 || productIndex === 6 ? admin._id.toString() : undefined,
        viewCount: dailyViews.reduce((sum, view) => sum + view.count, 0),
        lastViewedAt: daysAgo(0, 7 + productIndex),
        dailyViews,
        createdAt,
        updatedAt: daysAgo(productIndex % 5),
        demoSeed: SEED,
      });
    }
  }
  await db.collection('products').insertMany(products);

  await db.collection('hsn_codes').insertMany(
    hsnEntries.map(([hsn_code, description, category], index) => ({
      _id: demoId(`hsn:${hsn_code}`),
      hsn_code,
      description,
      category,
      demoSeed: SEED,
      createdAt: daysAgo(205 - (index % 12)),
    })),
  );

  const phasePlan: ReadonlyArray<readonly [string, string]> = [
    ['PR', 'pending'], ['PR', 'countered'], ['PR', 'buyer_responded'], ['PR', 'accepted'],
    ['PR', 'rejected'], ['PR', 'pending'], ['PR', 'countered'], ['PR', 'accepted'],
    ...Array.from({ length: 6 }, () => ['SCO', 'accepted'] as const),
    ...Array.from({ length: 6 }, () => ['ICPO', 'accepted'] as const),
    ...Array.from({ length: 6 }, () => ['SPA', 'accepted'] as const),
    ...Array.from({ length: 6 }, () => ['PAYMENT', 'accepted'] as const),
    ...Array.from({ length: 6 }, () => ['BOL', 'accepted'] as const),
    ...Array.from({ length: 24 }, () => ['COMPLETED', 'accepted'] as const),
    ...Array.from({ length: 10 }, () => ['CANCELLED', 'cancelled'] as const),
  ];
  const phaseRank = ['PR', 'SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED'];
  const completedStartIndex = phasePlan.findIndex(([phase]) => phase === 'COMPLETED');
  const cancelledStartIndex = phasePlan.findIndex(([phase]) => phase === 'CANCELLED');
  const stalledTradeIndex = phasePlan.findIndex(([phase]) => phase === 'PAYMENT');
  const completedCreatedDays = [2, 4, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106, 114, 122, 130, 138, 146, 154, 162, 168, 174, 179];
  const signatureDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLFRwAAAABJRU5ErkJggg==';
  const trades: NativeDocument[] = [];
  const documentSizeByPath = new Map<string, number>();

  const createTradeDocument = async (
    tradeId: ObjectId,
    documentType: string,
    uploadedBy: ObjectId,
    status: string,
    day: number,
  ): Promise<NativeDocument> => {
    const labelByType: Record<string, string> = {
      sco: 'Soft Corporate Offer',
      icpo: 'Irrevocable Corporate Purchase Order',
      spa: 'Sales and Purchase Agreement',
      signedSpa: 'Buyer-Signed Sales and Purchase Agreement',
      paymentProof: 'Payment Proof',
      bol: 'Bill of Lading',
    };
    const label = labelByType[documentType];
    const filename = `${tradeId.toHexString().slice(-8)}-${slugify(label)}.pdf`;
    const relativePath = `demo/trades/${tradeId.toHexString()}/${filename}`;
    const buffer = createPdf([
      label.toUpperCase(),
      `Trade reference: ${tradeId.toHexString().toUpperCase()}`,
      `Issued: ${daysAgo(day).toISOString().slice(0, 10)}`,
      'Badrinath Global Trade Partners / Badrinath Works Commodities',
      'Demo document generated for the complete platform showcase.',
    ]);
    const filePath = await writeAsset(relativePath, buffer);
    documentSizeByPath.set(filePath, buffer.length);
    return {
      filePath,
      originalName: filename,
      mimeType: 'application/pdf',
      size: buffer.length,
      uploadedAt: daysAgo(day),
      uploadedBy,
      status,
      notes: status === 'approved' ? 'Document reviewed and approved.' : 'Awaiting counterparty review.',
      version: 1,
      history: [],
      ...(status === 'approved' && ['sco', 'icpo', 'signedSpa', 'bol'].includes(documentType)
        ? { signatureDataUrl, signedAt: daysAgo(Math.max(0, day - 1)), signedBy: uploadedBy }
        : {}),
    };
  };

  for (const [index, [plannedPhase, plannedStatus]] of phasePlan.entries()) {
    const tradeId = demoId(`trade:${index}`);
    const primaryIsSeller = index % 2 === 0;
    const seller = primaryIsSeller ? primaryUserId : secondaryUserId;
    const buyer = primaryIsSeller ? secondaryUserId : primaryUserId;
    const sellerProducts = products.filter((product) => product.userId === seller.toHexString());
    const generatedCreatedDay = DEMO_HISTORY_DAYS - 1 - ((index * 37) % (DEMO_HISTORY_DAYS - 8));
    const createdDay = plannedPhase === 'COMPLETED'
      ? completedCreatedDays[index - completedStartIndex]
      : generatedCreatedDay;
    const tradeCreatedAt = daysAgo(createdDay);
    const eligibleSellerProducts = sellerProducts.filter((candidate) => candidate.createdAt <= tradeCreatedAt);
    let sellerProductIndex = index % eligibleSellerProducts.length;
    if (index === completedStartIndex) sellerProductIndex = 1;
    if (index === completedStartIndex + 1) sellerProductIndex = 0;
    const product = eligibleSellerProducts[sellerProductIndex];
    const cancellationOrdinal = plannedPhase === 'CANCELLED' ? index - cancelledStartIndex : -1;
    const phaseBeforeCancellation = ['ICPO', 'SPA', 'PAYMENT', 'BOL'][Math.max(0, cancellationOrdinal) % 4];
    const effectiveRank = plannedPhase === 'CANCELLED' ? phaseRank.indexOf(phaseBeforeCancellation) : phaseRank.indexOf(plannedPhase as string);
    const activeDay = Math.max(0, createdDay - Math.min(10, effectiveRank + 2));
    const quantity = 25 + (index % 7) * 15;
    const buyerPrice = Math.round(product.price * (0.91 + (index % 4) * 0.015));
    const sellerPrice = Math.round(product.price * (0.975 + (index % 3) * 0.008));
    const negotiationHistory: NativeDocument[] = [
      { round: 1, party: 'buyer', offeredPrice: buyerPrice, offeredIncoterms: { selectedIncoterm: index % 2 ? 'CIF' : 'FOB' }, message: 'Please confirm availability, inspection terms, and the proposed loading window.', timestamp: daysAgo(createdDay) },
    ];
    if (plannedStatus !== 'pending' && plannedStatus !== 'rejected') {
      negotiationHistory.push({ round: 2, party: 'seller', offeredPrice: sellerPrice, offeredIncoterms: { selectedIncoterm: index % 2 ? 'CIF' : 'FOB' }, message: 'Stock is allocated. This price includes export packing and inspection.', timestamp: daysAgo(Math.max(0, createdDay - 1)) });
    }
    if (['buyer_responded', 'accepted', 'cancelled'].includes(plannedStatus)) {
      negotiationHistory.push({ round: 3, party: 'buyer', offeredPrice: Math.round((buyerPrice + sellerPrice) / 2), offeredIncoterms: { selectedIncoterm: index % 2 ? 'CIF' : 'FOB' }, message: 'Agreed subject to final document review and the stated shipment window.', timestamp: daysAgo(Math.max(0, createdDay - 2)) });
    }

    const trade: NativeDocument = {
      _id: tradeId,
      product: product._id,
      buyer,
      seller,
      purchaseRequestStatus: plannedStatus === 'rejected' ? 'rejected' : plannedStatus === 'pending' || plannedStatus === 'countered' || plannedStatus === 'buyer_responded' ? 'pending' : 'accepted',
      purchaseOrderStatus: effectiveRank >= 2 ? 'accepted' : 'pending',
      quantity,
      quantityUnit: product.stockUnit,
      buyerOfferedPrice: buyerPrice,
      buyerIncoterms: { selectedIncoterm: index % 2 ? 'CIF' : 'FOB', selectedIncotermData: { Insurance: index % 2 ? 'Seller' : 'Buyer', Carriage: 'Seller' } },
      buyerMessage: 'Seeking a reliable shipment with independent quality verification and complete export documentation.',
      selectedAddress: primaryIsSeller ? companyProfiles[1].deliveryAddresses[0] : companyProfiles[0].deliveryAddresses[0],
      buyerIndustryType: ['Wholesale distribution', 'Food processing', 'Industrial manufacturing'][index % 3],
      buyerMarketYears: String(4 + (index % 8)),
      marketCapture: `${2 + (index % 9)}%`,
      tradeYears: String(3 + (index % 7)),
      productUsage: 'Contract supply for regional distribution and approved downstream customers.',
      nearestPort: primaryIsSeller ? 'Visakhapatnam Port' : 'Chennai Port',
      buyerCisDocument: primaryIsSeller ? kycPaths[2] : kycPaths[0],
      paymentMethod: index % 3 === 0 ? { type: 'advance', method: 'RTGS', percentage: '20' } : { type: 'credit', method: 'LetterOfCredit', days: '30' },
      sellerOfferedPrice: plannedStatus === 'pending' ? undefined : sellerPrice,
      sellerOfferedIncoterms: { selectedIncoterm: index % 2 ? 'CIF' : 'FOB' },
      sellerMessage: 'Offer confirmed against the listed specification, subject to document approval milestones.',
      negotiationStatus: plannedStatus,
      currentNegotiationRound: negotiationHistory.length,
      negotiationHistory,
      buyerCounterCount: plannedStatus === 'buyer_responded' ? 1 : plannedStatus === 'accepted' ? Math.min(2, index % 3) : 0,
      maxBuyerCounters: 2,
      isNegotiationLocked: plannedStatus === 'accepted' || plannedStatus === 'rejected' || plannedStatus === 'cancelled',
      rejectionReason: plannedStatus === 'rejected' ? 'Delivery window could not be aligned with the buyer programme.' : undefined,
      acceptedAt: plannedStatus === 'accepted' || plannedStatus === 'cancelled' ? daysAgo(Math.max(0, createdDay - 3)) : undefined,
      rejectedAt: plannedStatus === 'rejected' ? daysAgo(Math.max(0, createdDay - 1)) : undefined,
      tradePhase: plannedPhase,
      documentUploadInProgress: false,
      scoRejectionTracking: { rejectionCount: index === 9 ? 1 : 0, maxAttempts: 2, ...(index === 9 ? { lastRejectionAt: daysAgo(4), lastRejectionReason: 'Please use the contracted currency and correct delivery date.' } : {}) },
      icpoRejectionTracking: { rejectionCount: 0, maxAttempts: 2 },
      spaRejectionTracking: { rejectionCount: 0, maxAttempts: 2 },
      signedSpaRejectionTracking: { rejectionCount: 0, maxAttempts: 2 },
      paymentProofRejectionTracking: { rejectionCount: 0, maxAttempts: 2 },
      bolRejectionTracking: { rejectionCount: 0, maxAttempts: 3 },
      buyerHasUnread: index % 5 === 0,
      sellerHasUnread: index % 4 === 0,
      lastBuyerViewedAt: daysAgo(index % 4),
      lastSellerViewedAt: daysAgo(index % 3),
      lastPhaseChangeAt: index === stalledTradeIndex ? daysAgo(18) : daysAgo(activeDay),
      adminNotes: index % 8 === 0 ? [{ _id: demoId(`trade-note:${index}`), content: index === stalledTradeIndex ? 'Payment confirmation is stalled; monitor before the next reminder.' : 'Documents and counterparty details reviewed during routine monitoring.', addedBy: admin._id, addedByEmail: admin.email, addedAt: daysAgo(Math.max(0, activeDay - 1)) }] : [],
      buyerDeleted: false,
      sellerDeleted: false,
      stockRestored: plannedPhase === 'CANCELLED' || plannedStatus === 'rejected',
      createdAt: tradeCreatedAt,
      updatedAt: daysAgo(activeDay),
      demoSeed: SEED,
    };

    if (effectiveRank >= 1) {
      trade.scoDocument = await createTradeDocument(tradeId, 'sco', seller, effectiveRank === 1 && plannedPhase !== 'CANCELLED' ? 'uploaded' : 'approved', Math.max(0, createdDay - 4));
      trade.scoSubmittedAt = trade.scoDocument.uploadedAt;
    }
    if (effectiveRank >= 2) {
      trade.icpoDocument = await createTradeDocument(tradeId, 'icpo', buyer, effectiveRank === 2 && plannedPhase !== 'CANCELLED' ? 'uploaded' : 'approved', Math.max(0, createdDay - 5));
      trade.icpoSubmittedAt = trade.icpoDocument.uploadedAt;
    }
    if (effectiveRank >= 3) {
      trade.spaDocument = await createTradeDocument(tradeId, 'spa', seller, effectiveRank === 3 && plannedPhase !== 'CANCELLED' && index % 2 === 0 ? 'uploaded' : 'approved', Math.max(0, createdDay - 6));
      trade.spaUploadedAt = trade.spaDocument.uploadedAt;
      if (trade.spaDocument.status === 'approved') {
        trade.signedSpaDocument = await createTradeDocument(tradeId, 'signedSpa', buyer, effectiveRank === 3 && plannedPhase !== 'CANCELLED' ? 'uploaded' : 'approved', Math.max(0, createdDay - 7));
        trade.signedSpaSubmittedAt = trade.signedSpaDocument.uploadedAt;
        if (trade.signedSpaDocument.status === 'approved') trade.signedSpaApprovedAt = daysAgo(Math.max(0, createdDay - 8));
      }
    }
    if (effectiveRank >= 4) {
      trade.paymentProof = await createTradeDocument(tradeId, 'paymentProof', buyer, effectiveRank === 4 && plannedPhase !== 'CANCELLED' ? 'uploaded' : 'approved', Math.max(0, createdDay - 9));
      if (trade.paymentProof.status === 'approved') trade.paymentVerifiedAt = daysAgo(Math.max(0, createdDay - 10));
    }
    if (effectiveRank >= 5) {
      trade.bolDocument = await createTradeDocument(tradeId, 'bol', seller, effectiveRank === 5 && plannedPhase !== 'CANCELLED' ? 'uploaded' : 'approved', Math.max(0, createdDay - 11));
      trade.bolUploadedAt = trade.bolDocument.uploadedAt;
    }
    if (plannedPhase === 'COMPLETED') {
      trade.completedAt = daysAgo(Math.max(0, createdDay - 12));
      trade.updatedAt = trade.completedAt;
      trade.lastPhaseChangeAt = trade.completedAt;
      trade.disputeEligibilityEndsAt = new Date(trade.completedAt.getTime() + 30 * DAY);
    }
    if (plannedPhase === 'CANCELLED') {
      const cancellationOffset = 5 + effectiveRank * 2 + (cancellationOrdinal % 4);
      const cancellationDaysAgo = Math.max(0, createdDay - cancellationOffset);
      trade.cancelledAt = daysAgo(cancellationDaysAgo);
      trade.cancelledBy = index % 2 ? buyer : seller;
      trade.cancellationReason = ['Buyer programme changed before shipment allocation.', 'Repeated document mismatch required the trade to be closed.', 'Counterparties mutually agreed to revise the delivery schedule offline.', 'Payment timing could not be aligned within the validity window.'][cancellationOrdinal % 4];
      trade.phaseBeforeCancellation = phaseBeforeCancellation;
      trade.lastActivePhase = phaseBeforeCancellation;
      trade.updatedAt = trade.cancelledAt;
      trade.lastPhaseChangeAt = trade.cancelledAt;
      trade.disputeEligibilityEndsAt = new Date(trade.cancelledAt.getTime() + 30 * DAY);
      if (cancellationOrdinal === 1 || cancellationOrdinal === 7) {
        trade.autoCancelledAt = trade.cancelledAt;
        trade.autoCancellationReason = 'Document rejection attempt limit reached.';
      }
    }
    trades.push(trade);
  }
  await db.collection('trades').insertMany(trades);

  const auditLogs: NativeDocument[] = [];
  for (const [index, trade] of trades.entries()) {
    auditLogs.push(
      { _id: demoId(`audit:${index}:created`), trade: trade._id, performedBy: trade.buyer, action: 'trade_created', newState: { tradePhase: 'PR', negotiationStatus: 'pending' }, details: 'Purchase request created with commercial and delivery terms.', ipAddress: '192.0.2.21', userAgent: 'Breyus showcase browser', createdAt: trade.createdAt, updatedAt: trade.createdAt, demoSeed: SEED },
      { _id: demoId(`audit:${index}:offer`), trade: trade._id, performedBy: trade.seller, action: trade.negotiationHistory.length > 1 ? 'counter_offer' : 'buyer_response', previousState: { price: trade.buyerOfferedPrice }, newState: { price: trade.sellerOfferedPrice || trade.buyerOfferedPrice }, details: 'Commercial terms reviewed by the seller.', ipAddress: '192.0.2.34', userAgent: 'Breyus showcase browser', createdAt: cappedPastDateAfter(trade.createdAt, 1), updatedAt: cappedPastDateAfter(trade.createdAt, 1), demoSeed: SEED },
    );
    if (trade.negotiationStatus === 'accepted' || trade.negotiationStatus === 'cancelled') {
      auditLogs.push({ _id: demoId(`audit:${index}:accepted`), trade: trade._id, performedBy: trade.seller, action: 'accepted', previousState: { negotiationStatus: 'countered' }, newState: { negotiationStatus: 'accepted' }, details: 'Commercial terms accepted and trade workflow opened.', createdAt: trade.acceptedAt || trade.updatedAt, updatedAt: trade.acceptedAt || trade.updatedAt, demoSeed: SEED });
    }
    if (trade.tradePhase === 'COMPLETED') {
      auditLogs.push({ _id: demoId(`audit:${index}:completed`), trade: trade._id, performedBy: trade.seller, action: 'trade_completed', previousState: { tradePhase: 'BOL' }, newState: { tradePhase: 'COMPLETED' }, details: 'Bill of lading approved and trade marked complete.', createdAt: trade.completedAt, updatedAt: trade.completedAt, demoSeed: SEED });
    } else if (trade.tradePhase === 'CANCELLED') {
      auditLogs.push({ _id: demoId(`audit:${index}:cancelled`), trade: trade._id, performedBy: trade.cancelledBy, action: 'cancelled', previousState: { tradePhase: trade.phaseBeforeCancellation }, newState: { tradePhase: 'CANCELLED' }, details: trade.cancellationReason, createdAt: trade.cancelledAt, updatedAt: trade.cancelledAt, demoSeed: SEED });
    } else if (trade.tradePhase !== 'PR') {
      auditLogs.push({ _id: demoId(`audit:${index}:phase`), trade: trade._id, performedBy: trade.seller, action: 'phase_advanced', previousState: { tradePhase: phaseRank[Math.max(0, phaseRank.indexOf(trade.tradePhase) - 1)] }, newState: { tradePhase: trade.tradePhase }, details: `Trade advanced to ${trade.tradePhase}.`, createdAt: trade.updatedAt, updatedAt: trade.updatedAt, demoSeed: SEED });
    }
  }
  await db.collection('auditlogs').insertMany(auditLogs);

  const conversations: NativeDocument[] = [];
  const messages: NativeDocument[] = [];
  const conversationTopics = [
    ['Rice shipment quality and packing', 0],
    ['Coffee samples and loading window', 1],
    ['Copper cathode inspection documents', 6],
    ['Long-term wheat supply programme', 2],
    ['Cotton bale traceability records', 3],
    ['Sugar shipment insurance options', 4],
    ['Natural rubber inspection scheduling', 5],
    ['Aluminium smelter certificate review', 7],
  ] as const;
  const conversationStartDays = [168, 143, 118, 92, 67, 43, 21, 7];
  const attachmentPath = await writeAsset('demo/messages/pre-shipment-checklist.pdf', createPdf(['PRE-SHIPMENT CHECKLIST', 'Inspection appointment', 'Packing list', 'Container seal record', 'Certificate of analysis']));
  for (const [conversationIndex, [topic, productIndex]] of conversationTopics.entries()) {
    const conversationId = demoId(`conversation:${conversationIndex}`);
    const messageIds: ObjectId[] = [];
    const messageCount = 12 + conversationIndex;
    const conversationStartDay = conversationStartDays[conversationIndex];
    const conversationCreatedAt = daysAgo(conversationStartDay, 8);
    for (let messageIndex = 0; messageIndex < messageCount; messageIndex += 1) {
      const senderIsPrimary = messageIndex % 2 === 0;
      const messageId = demoId(`message:${conversationIndex}:${messageIndex}`);
      messageIds.push(messageId);
      const messageCreatedAt = cappedPastDateAfter(conversationCreatedAt, messageIndex * 0.5);
      const scriptedMessages = [
        `Hello, I would like to align the next steps for ${topic.toLowerCase()}.`,
        'The stock is available and the latest inspection report is ready for review.',
        'Please confirm whether the proposed port window works for your logistics team.',
        'The window works. Could you share the packing and marking specification?',
        'Certainly. I have attached the pre-shipment checklist used by our operations team.',
        'Thank you. The documentation sequence is clear and matches our internal process.',
        'We can reserve the lot once the current commercial terms are accepted.',
        'The terms have been reviewed. Please proceed with the next document milestone.',
        'Confirmed. We will keep all updates and approvals in this trade workspace.',
        'Inspection has been scheduled and the surveyor details will follow shortly.',
        'Received. Our team will monitor the shipment and respond here if anything changes.',
        'Everything remains on schedule for the agreed loading date.',
      ];
      messages.push({
        _id: messageId,
        text: scriptedMessages[messageIndex % scriptedMessages.length],
        sender: senderIsPrimary ? primaryCompanyId : secondaryCompanyId,
        receiver: senderIsPrimary ? secondaryCompanyId : primaryCompanyId,
        readBy: messageIndex >= messageCount - 2 ? [senderIsPrimary ? primaryCompanyId : secondaryCompanyId] : [primaryCompanyId, secondaryCompanyId],
        replyTo: messageIndex === 5 ? messageIds[3] : null,
        reactions: messageIndex === 6 ? [{ user: senderIsPrimary ? secondaryCompanyId : primaryCompanyId, emoji: '👍', reactedAt: cappedPastDateAfter(messageCreatedAt, 1) }] : [],
        attachments: messageIndex === 4 ? [{ filePath: attachmentPath, fileName: 'pre-shipment-checklist.pdf', mimeType: 'application/pdf' }] : [],
        senderDeleted: false,
        receiverDeleted: false,
        createdAt: messageCreatedAt,
        updatedAt: messageCreatedAt,
        demoSeed: SEED,
      });
    }
    conversations.push({ _id: conversationId, participants: [primaryCompanyId, secondaryCompanyId], product: products[(conversationIndex % 2) * 8 + productIndex]._id, messages: messageIds, createdAt: conversationCreatedAt, updatedAt: messages.at(-1)?.createdAt, demoSeed: SEED });
  }
  await db.collection('messages').insertMany(messages);
  await db.collection('conversations').insertMany(conversations);

  const notifications: NativeDocument[] = [];
  const notificationTypes = ['trade_created', 'counter_offer', 'trade_accepted', 'document_uploaded', 'phase_advanced', 'signed_spa_required', 'new_message', 'trade_completed', 'trade_cancelled', 'company_kyc_verified', 'kyc_document_approved', 'analysis_completed', 'wishlist_price_dropped', 'stalled_trade_reminder', 'dispute_status_updated'];
  const notificationTitles = ['New purchase request', 'Counter offer received', 'Trade terms accepted', 'Document ready for review', 'Trade moved forward', 'Signed SPA required', 'New company message', 'Trade completed', 'Trade cancelled', 'Company KYC verified', 'KYC document approved', 'Partner analysis ready', 'Saved product price changed', 'Trade requires attention', 'Dispute status updated'];
  for (const [userIndex, userId] of [primaryUserId, secondaryUserId].entries()) {
    for (let index = 0; index < 36; index += 1) {
      const notificationTypeIndex = index % notificationTypes.length;
      const notificationType = notificationTypes[notificationTypeIndex];
      const notificationTitle = notificationTitles[notificationTypeIndex];
      // Read notifications expire after 30 days, so keep the showcase inbox
      // dense and realistic inside the product's actual retention window.
      const notificationDay = Math.round((index * 28) / 35);
      const trade = trades[(index * 2 + userIndex) % trades.length];
      notifications.push({
        _id: demoId(`notification:${userIndex}:${index}`),
        userId,
        type: notificationType,
        title: notificationTitle,
        message: notificationType === 'stalled_trade_reminder' ? 'A payment-stage trade has not changed for several days. Review the latest documents and contact the counterparty.' : `${notificationTitle} for ${products.find((product) => product._id.equals(trade.product))?.name || 'your commodity trade'}.`,
        read: index > 7,
        tradeId: notificationType.includes('trade') || ['counter_offer', 'document_uploaded', 'phase_advanced', 'signed_spa_required', 'stalled_trade_reminder', 'dispute_status_updated'].includes(notificationType) ? trade._id : undefined,
        conversationId: notificationType === 'new_message' ? conversations[(index + userIndex) % conversations.length]._id : undefined,
        metadata: { productName: products.find((product) => product._id.equals(trade.product))?.name, showcase: true },
        priority: notificationType === 'stalled_trade_reminder' ? 'urgent' : notificationTypeIndex < 6 ? 'high' : notificationTypeIndex > 10 ? 'low' : 'normal',
        actionUrl: notificationType === 'new_message' ? '/messages' : notificationType.includes('kyc') ? '/settings' : '/trades',
        createdAt: daysAgo(notificationDay, 12),
        updatedAt: daysAgo(notificationDay, 12),
        demoSeed: SEED,
      });
    }
  }
  await db.collection('notifications').insertMany(notifications);

  const wishlists: NativeDocument[] = [];
  for (const [userIndex, userId] of [primaryUserId, secondaryUserId].entries()) {
    const otherCompany = userIndex === 0 ? secondaryCompanyId : primaryCompanyId;
    const otherProducts = products.filter((product) => product.userId !== userId.toHexString());
    wishlists.push(
      { _id: demoId(`wishlist:${userIndex}:product:0`), user: userId, product: otherProducts[0]._id, sourceType: 'product', dateAdded: daysAgo(146), demoSeed: SEED },
      { _id: demoId(`wishlist:${userIndex}:product:1`), user: userId, product: otherProducts[6]._id, sourceType: 'product', dateAdded: daysAgo(98), demoSeed: SEED },
      { _id: demoId(`wishlist:${userIndex}:product:2`), user: userId, product: otherProducts[2]._id, sourceType: 'product', dateAdded: daysAgo(51), demoSeed: SEED },
      { _id: demoId(`wishlist:${userIndex}:product:3`), user: userId, product: otherProducts[4]._id, sourceType: 'product', dateAdded: daysAgo(12), demoSeed: SEED },
      { _id: demoId(`wishlist:${userIndex}:company`), user: userId, company: otherCompany, sourceType: 'company', notes: 'Verified counterparty for recurring commodity programmes.', dateAdded: daysAgo(132), demoSeed: SEED },
      { _id: demoId(`wishlist:${userIndex}:contact:0`), user: userId, sourceType: 'ai_contact', savedContactName: userIndex === 0 ? 'Meridian Foods Trading LLC' : 'Northstar Materials GmbH', savedContactEmail: userIndex === 0 ? 'procurement@meridian-foods.example' : 'sourcing@northstar-materials.example', savedContactPhone: userIndex === 0 ? '+971 4 555 0182' : '+49 40 555 0176', savedContactCountry: userIndex === 0 ? 'United Arab Emirates' : 'Germany', savedContactAddress: userIndex === 0 ? 'Jebel Ali Free Zone, Dubai' : 'HafenCity, Hamburg', savedCommodity: userIndex === 0 ? 'Basmati Rice' : 'Copper Cathodes', savedHsCode: userIndex === 0 ? '10063020' : '74031100', savedMatchScore: userIndex === 0 ? 94 : 91, savedContactRole: 'buyer', notes: 'Promising AI-matched partner; review before outreach.', dateAdded: daysAgo(76), demoSeed: SEED },
      { _id: demoId(`wishlist:${userIndex}:contact:1`), user: userId, sourceType: 'ai_contact', savedContactName: userIndex === 0 ? 'Atlas Retail Foods SARL' : 'Pacific Alloy Procurement Pte Ltd', savedContactEmail: userIndex === 0 ? 'trade@atlas-retail.example' : 'metals@pacific-alloy.example', savedContactPhone: userIndex === 0 ? '+212 5 555 0136' : '+65 6555 0198', savedContactCountry: userIndex === 0 ? 'Morocco' : 'Singapore', savedContactAddress: userIndex === 0 ? 'Casablanca Finance City' : 'Jurong Logistics Hub', savedCommodity: userIndex === 0 ? 'Refined Sugar' : 'Aluminium Ingots', savedHsCode: userIndex === 0 ? '17019910' : '76011010', savedMatchScore: userIndex === 0 ? 89 : 88, savedContactRole: 'buyer', notes: 'Saved from a recent partner discovery result for follow-up.', dateAdded: daysAgo(9), demoSeed: SEED },
    );
  }
  await db.collection('wishlists').insertMany(wishlists);

  const completedTrades = trades.filter((trade) => trade.tradePhase === 'COMPLETED');
  const feedbacks: NativeDocument[] = [];
  for (const [tradeIndex, trade] of completedTrades.entries()) {
    const product = products.find((candidate) => candidate._id.equals(trade.product));
    for (const [feedbackIndex, feedbackType] of ['seller', 'delivery', 'product'].entries()) {
      feedbacks.push({
        _id: demoId(`feedback:${tradeIndex}:${feedbackType}`),
        trade: trade._id,
        product: feedbackType === 'product' ? trade.product : undefined,
        reviewer: trade.buyer,
        reviewee: trade.seller,
        feedbackType,
        rating: 4 + ((tradeIndex + feedbackIndex) % 3 === 0 ? 1 : 0),
        comment: feedbackType === 'seller' ? 'Responsive counterparty with clear updates at each document milestone.' : feedbackType === 'delivery' ? 'Shipment documentation and delivery coordination matched the agreed schedule.' : `${product?.name || 'Product'} matched the contracted grade and packing specification.`,
        tags: feedbackType === 'seller' ? ['responsive', 'professional', 'clear-documentation'] : feedbackType === 'delivery' ? ['on-time', 'well-coordinated'] : ['quality-as-described', 'good-packaging'],
        details: { quality: 'Meets specification', communication: 'Very good', documentation: 'Complete' },
        createdAt: new Date(Math.min(now.getTime() - 60 * 60 * 1000, trade.completedAt.getTime() + DAY)),
        updatedAt: new Date(Math.min(now.getTime() - 60 * 60 * 1000, trade.completedAt.getTime() + DAY)),
        demoSeed: SEED,
      });
    }
  }
  await db.collection('feedbacks').insertMany(feedbacks);

  const cancelledTrades = trades.filter((trade) => trade.tradePhase === 'CANCELLED');
  const paymentTrades = trades.filter((trade) => trade.tradePhase === 'PAYMENT');
  const bolTrades = trades.filter((trade) => trade.tradePhase === 'BOL');
  const disputePlans = [
    { trade: paymentTrades[0], raisedByRole: 'buyer', reason: 'payment_issue', priority: 'urgent', status: 'under_review', description: 'Payment proof was uploaded but settlement confirmation is taking longer than expected.' },
    { trade: completedTrades[1], raisedByRole: 'buyer', reason: 'quality_issue', priority: 'high', status: 'open', description: 'A small variance was found in one inspection sample and needs joint review.' },
    { trade: completedTrades[4], raisedByRole: 'seller', reason: 'documentation_problem', priority: 'medium', status: 'resolved', description: 'The consignee name needed correction on a supporting shipping document.' },
    { trade: cancelledTrades[2], raisedByRole: 'buyer', reason: 'delivery_delay', priority: 'low', status: 'closed', description: 'The revised loading window conflicted with the buyer warehouse schedule.' },
    { trade: bolTrades[2], raisedByRole: 'buyer', reason: 'documentation_problem', priority: 'high', status: 'under_review', description: 'The carrier amendment has not yet appeared on the latest bill of lading copy.' },
    { trade: completedTrades[10], raisedByRole: 'seller', reason: 'payment_issue', priority: 'medium', status: 'resolved', description: 'Bank charges were allocated differently from the signed commercial terms.' },
    { trade: completedTrades[17], raisedByRole: 'buyer', reason: 'quality_issue', priority: 'low', status: 'closed', description: 'The final packing list required reconciliation against the received warehouse count.' },
    { trade: cancelledTrades[7], raisedByRole: 'seller', reason: 'other', priority: 'urgent', status: 'open', description: 'The cancellation record needs confirmation of the agreed inventory release date.' },
  ].map((plan) => {
    const raisedBy = plan.raisedByRole === 'buyer' ? plan.trade.buyer : plan.trade.seller;
    return {
      ...plan,
      raisedBy,
      role: plan.raisedByRole,
      email: raisedBy.equals(primaryUserId) ? PRIMARY_EMAIL : SECONDARY_EMAIL,
    };
  });
  const disputes = disputePlans.map((plan, index) => {
    const disputeId = demoId(`dispute:${index}`);
    const referenceDate = plan.trade.completedAt || plan.trade.cancelledAt || plan.trade.lastPhaseChangeAt || plan.trade.updatedAt;
    const createdAt = cappedPastDateAfter(referenceDate, 2);
    const assignedAt = cappedPastDateAfter(createdAt, 1);
    const reviewedAt = cappedPastDateAfter(createdAt, 2);
    const resolutionAt = cappedPastDateAfter(createdAt, 4);
    const closedAt = cappedPastDateAfter(createdAt, 5);
    return {
      _id: disputeId,
      trade: plan.trade._id,
      raisedBy: plan.raisedBy,
      raisedByRole: plan.role,
      raisedByEmail: plan.email,
      reason: plan.reason,
      description: plan.description,
      priority: plan.priority,
      status: plan.status,
      assignedAdmin: admin._id,
      assignedAdminEmail: admin.email,
      assignedAt,
      resolutionNotes: ['under_review', 'open'].includes(plan.status) ? undefined : 'Counterparties confirmed the correction and no further action is required.',
      resolvedAt: ['resolved', 'closed'].includes(plan.status) ? resolutionAt : undefined,
      resolvedBy: ['resolved', 'closed'].includes(plan.status) ? admin._id : undefined,
      resolvedByEmail: ['resolved', 'closed'].includes(plan.status) ? admin.email : undefined,
      closedAt: plan.status === 'closed' ? closedAt : undefined,
      closedBy: plan.status === 'closed' ? admin._id : undefined,
      messages: [
        { _id: demoId(`dispute-message:${index}:0`), content: plan.description, sender: plan.raisedBy, senderType: plan.role, senderEmail: plan.email, createdAt, isInternal: false },
        { _id: demoId(`dispute-message:${index}:1`), content: 'The operations record and supporting documents are under review.', sender: admin._id, senderType: 'admin', senderEmail: admin.email, createdAt: assignedAt, isInternal: false },
        { _id: demoId(`dispute-message:${index}:2`), content: 'Internal review checklist completed; awaiting final counterparty confirmation.', sender: admin._id, senderType: 'admin', senderEmail: admin.email, createdAt: reviewedAt, isInternal: true },
      ],
      createdAt,
      updatedAt: plan.status === 'closed' ? closedAt : ['resolved'].includes(plan.status) ? resolutionAt : reviewedAt,
      demoSeed: SEED,
    };
  });
  await db.collection('tradedisputes').insertMany(disputes);
  await db.collection('trades').updateOne({ _id: disputePlans[0].trade._id }, { $set: { activeDispute: disputes[0]._id } });
  await db.collection('trades').updateOne({ _id: disputePlans[1].trade._id }, { $set: { activeDispute: disputes[1]._id } });

  const adminActions = ['auth.login', 'user.view', 'company.kyc_review', 'product.feature', 'trade.view', 'trade.add_note', 'dispute.assign', 'dispute.status_update', 'content.post_review', 'security.failed_login_review', 'alert.rule_update', 'analytics.export'];
  const adminLogs = Array.from({ length: 144 }, (_, index) => {
    const action = adminActions[index % adminActions.length];
    const targetTrade = trades[index % trades.length];
    const targetCompany = index % 2 ? companyProfiles[0] : companyProfiles[1];
    const activityDay = Math.round((index * (DEMO_HISTORY_DAYS - 1)) / 143);
    const targetType = action.startsWith('trade') ? 'trade' : action.startsWith('company') ? 'company' : action.startsWith('product') ? 'product' : action.startsWith('dispute') ? 'dispute' : action.startsWith('content') ? 'blog_post' : action.startsWith('user') ? 'user' : 'system';
    const targetId = targetType === 'trade' ? targetTrade._id : targetType === 'company' ? targetCompany._id : targetType === 'product' ? products[index % products.length]._id : targetType === 'dispute' ? disputes[index % disputes.length]._id : targetType === 'user' ? (index % 2 ? primaryUserId : secondaryUserId) : admin._id;
    return {
      _id: demoId(`admin-log:${index}`),
      adminId: admin._id,
      adminEmail: admin.email,
      action,
      actionCategory: action.split('.')[0],
      targetType,
      targetId,
      targetIdentifier: targetType === 'trade' ? `TRD-${targetTrade._id.toHexString().slice(-8).toUpperCase()}` : targetType === 'company' ? targetCompany.companyName : targetType === 'user' ? (index % 2 ? PRIMARY_EMAIL : SECONDARY_EMAIL) : targetType === 'product' ? products[index % products.length].sku : 'Breyus operations',
      description: `${action.replaceAll('.', ' ')} completed during routine platform operations.`,
      previousValue: index % 3 === 0 ? { status: 'pending' } : {},
      newValue: index % 3 === 0 ? { status: 'reviewed' } : {},
      metadata: { ipAddress: `192.0.2.${40 + (index % 10)}`, userAgent: 'Admin portal showcase session', requestId: `demo-${String(index + 1).padStart(4, '0')}`, duration: 80 + index * 7 },
      timestamp: daysAgo(activityDay, 9 + (index % 8)),
      createdAt: daysAgo(activityDay, 9 + (index % 8)),
      updatedAt: daysAgo(activityDay, 9 + (index % 8)),
      demoSeed: SEED,
    };
  });
  await db.collection('adminactivitylogs').insertMany(adminLogs);

  const alertTypes = ['USER_SUSPENDED', 'KYC_PENDING_THRESHOLD', 'TRADE_STALLED', 'FAILED_LOGIN_SPIKE', 'NEW_DISPUTE'];
  const alertRules = alertTypes.map((eventType, index) => ({
    _id: demoId(`alert-rule:${index}`),
    name: ['Suspended account review', 'Pending KYC workload', 'Stalled active trades', 'Failed login spike', 'New high-priority dispute'][index],
    eventType,
    isEnabled: index !== 0,
    threshold: [1, 5, 3, 8, 1][index],
    timeWindowMinutes: [60, 1440, 1440, 30, 60][index],
    recipients: ['admin@breyus.com'],
    cooldownMinutes: [120, 240, 180, 60, 30][index],
    lastTriggeredAt: index > 0 ? daysAgo(index * 2) : undefined,
    createdBy: admin._id,
    createdAt: daysAgo(190 - index),
    updatedAt: daysAgo(index),
    demoSeed: SEED,
  }));
  await db.collection('alertrules').insertMany(alertRules);
  const alertHistory = alertRules.flatMap((rule, ruleIndex) => [0, 1, 2, 3].map((eventIndex) => ({
    _id: demoId(`alert-history:${ruleIndex}:${eventIndex}`),
    ruleId: rule._id,
    ruleName: rule.name,
    eventType: rule.eventType,
    triggeredAt: daysAgo(2 + ruleIndex * 31 + eventIndex * 7),
    payload: { threshold: rule.threshold, observed: Number(rule.threshold) + 2 + eventIndex, summary: `${rule.name} threshold reached in showcase data.` },
    recipientsSent: ['admin@breyus.com'],
    emailStatus: ruleIndex === 3 && eventIndex === 1 ? 'FAILED' : 'SENT',
    errorMessage: ruleIndex === 3 && eventIndex === 1 ? 'SMTP retry scheduled by notification worker.' : undefined,
    createdAt: daysAgo(2 + ruleIndex * 31 + eventIndex * 7),
    updatedAt: daysAgo(2 + ruleIndex * 31 + eventIndex * 7),
    demoSeed: SEED,
  })));
  await db.collection('alerthistory').insertMany(alertHistory);

  const failedReasons = ['INVALID_PASSWORD', 'USER_NOT_FOUND', 'OTP_EXPIRED', 'OTP_INVALID', 'IP_BLOCKED'];
  await db.collection('failedloginattempts').insertMany(Array.from({ length: 48 }, (_, index) => ({
    _id: demoId(`failed-login:${index}`),
    email: index % 4 === 0 ? 'unknown.user@example.test' : index % 2 ? PRIMARY_EMAIL : SECONDARY_EMAIL,
    ipAddress: `198.51.100.${20 + (index % 7)}`,
    userAgent: index % 2 ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    attemptedAt: daysAgo(1 + ((index * 17) % (DEMO_HISTORY_DAYS - 2)), 2 + (index % 5)),
    reason: failedReasons[index % failedReasons.length],
    createdAt: daysAgo(1 + ((index * 17) % (DEMO_HISTORY_DAYS - 2)), 2 + (index % 5)),
    updatedAt: daysAgo(1 + ((index * 17) % (DEMO_HISTORY_DAYS - 2)), 2 + (index % 5)),
    demoSeed: SEED,
  })));
  await db.collection('blockedips').insertMany([
    { _id: demoId('blocked-ip:0'), ipAddress: '203.0.113.45', reason: 'Repeated credential stuffing attempts', blockedBy: admin._id, blockedAt: daysAgo(12), isActive: true, createdAt: daysAgo(12), updatedAt: daysAgo(12), demoSeed: SEED },
    { _id: demoId('blocked-ip:1'), ipAddress: '203.0.113.81', reason: 'Automated scraping against protected endpoints', blockedBy: admin._id, blockedAt: daysAgo(7), expiresAt: futureDays(23), isActive: true, createdAt: daysAgo(7), updatedAt: daysAgo(7), demoSeed: SEED },
    { _id: demoId('blocked-ip:2'), ipAddress: '198.51.100.91', reason: 'Temporary block after failed login spike', blockedBy: admin._id, blockedAt: daysAgo(20), expiresAt: daysAgo(5), isActive: false, createdAt: daysAgo(20), updatedAt: daysAgo(5), demoSeed: SEED },
    { _id: demoId('blocked-ip:3'), ipAddress: '203.0.113.108', reason: 'Repeated invalid OTP submissions', blockedBy: admin._id, blockedAt: daysAgo(64), expiresAt: daysAgo(57), isActive: false, createdAt: daysAgo(64), updatedAt: daysAgo(57), demoSeed: SEED },
    { _id: demoId('blocked-ip:4'), ipAddress: '198.51.100.133', reason: 'High-volume requests against authentication endpoints', blockedBy: admin._id, blockedAt: daysAgo(103), expiresAt: daysAgo(96), isActive: false, createdAt: daysAgo(103), updatedAt: daysAgo(96), demoSeed: SEED },
    { _id: demoId('blocked-ip:5'), ipAddress: '203.0.113.177', reason: 'Suspicious account enumeration activity', blockedBy: admin._id, blockedAt: daysAgo(151), expiresAt: daysAgo(144), isActive: false, createdAt: daysAgo(151), updatedAt: daysAgo(144), demoSeed: SEED },
  ]);

  const blogAvatarPaths = await Promise.all([
    writeAsset('demo/blog/writers/badrinath-global.svg', createShowcaseSvg('BR', 'Trade Strategy', '#182a3a', '#766f51', 900, 900)),
    writeAsset('demo/blog/writers/badrinath-works.svg', createShowcaseSvg('BW', 'Commodity Operations', '#263a2e', '#a2763d', 900, 900)),
    writeAsset('demo/blog/writers/badrinath-global-banner.svg', createShowcaseSvg('Badrinath Reddy', 'Commodity trade strategy and market structure', '#182a3a', '#766f51')),
    writeAsset('demo/blog/writers/badrinath-works-banner.svg', createShowcaseSvg('Badrinath Works Editorial', 'Operations, documentation, and sustainable sourcing', '#263a2e', '#a2763d')),
  ]);
  const blogUsers = [
    { _id: demoId('blog-user:primary'), email: PRIMARY_EMAIL, password: existingPrimary.password, firstName: 'Badrinath', lastName: 'Reddy', companyName: companyProfiles[0].companyName, website: companyProfiles[0].websiteUrl, areaOfInterest: 'Global commodities and trade finance', experience: '8 years', areaOfExpertise: 'Market strategy, sourcing, and negotiation', breyusUserId: primaryUserId, isBrèyusMember: true, passwordSyncedFromBreyus: true, passwordChangedAt: null, isWriter: true, writerInviteToken: null, writerApprovedAt: daysAgo(195), writerBio: 'Commodity trader and operator writing about practical cross-border sourcing, negotiation, and market structure.', writerAvatar: blogAvatarPaths[0], writerBanner: blogAvatarPaths[2], lastLoginAt: daysAgo(0), isSuspended: false, isDeleted: false, createdAt: daysAgo(210), updatedAt: daysAgo(0), demoSeed: SEED },
    { _id: demoId('blog-user:secondary'), email: SECONDARY_EMAIL, password: existingSecondary?.password || existingPrimary.password, firstName: 'Badrinath', lastName: 'Works', companyName: companyProfiles[1].companyName, website: companyProfiles[1].websiteUrl, areaOfInterest: 'Commodity operations and sustainable supply chains', experience: '7 years', areaOfExpertise: 'Export documentation, quality, and logistics', breyusUserId: secondaryUserId, isBrèyusMember: true, passwordSyncedFromBreyus: true, passwordChangedAt: null, isWriter: true, writerInviteToken: null, writerApprovedAt: daysAgo(190), writerBio: 'Operations-focused writer covering product quality, shipping documentation, and resilient commodity supply chains.', writerAvatar: blogAvatarPaths[1], writerBanner: blogAvatarPaths[3], lastLoginAt: daysAgo(1), isSuspended: false, isDeleted: false, createdAt: daysAgo(205), updatedAt: daysAgo(1), demoSeed: SEED },
  ];
  await db.collection('blog_users').insertMany(blogUsers);

  const publishedPostCount = 34;
  const postStatuses = postTopics.map((_, index) => {
    if (index < publishedPostCount) return 'published';
    if (index < 38) return 'draft';
    if (index < 41) return 'submitted';
    if (index < 43) return 'in_review';
    if (index < 45) return 'revision_requested';
    if (index < 47) return 'approved';
    return 'rejected';
  });
  const blogPosts: NativeDocument[] = [];
  for (const [index, [title, category, subject]] of postTopics.entries()) {
    const writer = blogUsers[index % 2];
    const status = postStatuses[index];
    const postId = demoId(`blog-post:${index}`);
    const imagePath = await writeAsset(
      `demo/blog/posts/${String(index + 1).padStart(2, '0')}-${slugify(title)}.svg`,
      createShowcaseSvg(title, `${category} · ${subject}`, index % 2 ? '#263a2e' : '#182a3a', index % 3 ? '#a2763d' : '#766f51'),
    );
    const publishedDay = status === 'published'
      ? 2 + Math.round((index * (DEMO_HISTORY_DAYS - 7)) / (publishedPostCount - 1))
      : undefined;
    const workflowDay = 2 + (((index - publishedPostCount) * 7) % 45);
    const createdDay = publishedDay === undefined ? workflowDay + 12 : Math.min(DEMO_HISTORY_DAYS - 1, publishedDay + 4);
    const publishedAt = publishedDay === undefined ? undefined : daysAgo(publishedDay);
    const submittedAt = ['submitted', 'in_review', 'revision_requested', 'approved', 'rejected'].includes(status)
      ? daysAgo(workflowDay + 7)
      : null;
    const reviewedAt = ['revision_requested', 'approved', 'rejected'].includes(status)
      ? daysAgo(workflowDay + 2)
      : null;
    blogPosts.push({
      _id: postId,
      title,
      slug: `showcase-${slugify(title)}`,
      excerpt: `A practical briefing on ${subject.toLowerCase()} for commodity buyers, sellers, and operations teams.`,
      featuredImage: imagePath,
      contentFormat: 'tiptap',
      tiptapContent: tiptap(subject, [
        `${subject} decisions work best when market context, specifications, counterparties, and documents are evaluated together.`,
        'This briefing translates that workflow into concrete checks for commercial, quality, finance, and logistics teams.',
        'The goal is not to predict every market move. It is to establish a clear operating rhythm, document decisions, and respond quickly when conditions change.',
        'Teams using a shared trade workspace reduce ambiguity because each approval and supporting file remains tied to the relevant commercial milestone.',
      ]),
      author: null,
      writerId: writer._id,
      writerDisplayName: `${writer.firstName} ${writer.lastName}`,
      writerBio: writer.writerBio,
      writerAvatar: writer.writerAvatar,
      status,
      publishedAt,
      accessLevel: index % 5 === 0 ? 'member_only' : 'public',
      submittedAt,
      reviewedBy: ['in_review', 'revision_requested', 'approved', 'rejected'].includes(status) ? admin._id : null,
      reviewedAt,
      rejectionReason: status === 'rejected' ? 'Please add primary-source support for the market-size estimate before resubmitting.' : null,
      revisionNotes: status === 'revision_requested' ? 'Add one example for a mid-sized exporter and clarify the documentation timeline.' : null,
      categories: [category, ...(index % 4 === 0 ? ['Global Trade'] : [])],
      tags: [slugify(subject), slugify(category), 'commodity-trade', 'operations'],
      hsnCodePrefixes: [productSpecs[index % productSpecs.length].hsn.slice(0, 4)],
      likeCount: 0,
      commentCount: 0,
      shareCount: status === 'published' ? 6 + ((index * 7) % 39) : 0,
      viewCount: status === 'published' ? 480 + index * 137 : 0,
      uniqueViewCount: status === 'published' ? 340 + index * 101 : 0,
      readTimeMinutes: 4 + (index % 6),
      metaTitle: title.slice(0, 70),
      metaDescription: `Practical ${subject.toLowerCase()} guidance for international commodity trade teams.`.slice(0, 160),
      isFeatured: status === 'published' && [0, 2, 6, 10, 16, 24, 30].includes(index),
      isPinned: status === 'published' && [0, 1, 6, 24].includes(index),
      isDeleted: index === postTopics.length - 1,
      deletedAt: index === postTopics.length - 1 ? daysAgo(Math.max(0, workflowDay - 1)) : undefined,
      createdAt: daysAgo(createdDay),
      updatedAt: daysAgo(publishedDay === undefined ? workflowDay : Math.max(0, publishedDay - (index % 3))),
      demoSeed: SEED,
    });
  }
  await db.collection('blog_posts').insertMany(blogPosts);

  const publishedPosts = blogPosts.filter((post) => post.status === 'published');
  const likes: NativeDocument[] = [];
  for (let index = 0; index < 60; index += 1) {
    const post = publishedPosts[Math.floor(index / 2) % publishedPosts.length];
    const user = blogUsers[index % 2];
    const publicationAgeDays = Math.max(0, Math.floor((now.getTime() - post.publishedAt.getTime()) / DAY));
    const likeDay = Math.max(0, publicationAgeDays - 1 - (index % 4));
    likes.push({ _id: demoId(`blog-like:${index}`), blogPostId: post._id, blogUserId: user._id, createdAt: daysAgo(likeDay), updatedAt: daysAgo(likeDay), demoSeed: SEED });
  }
  await db.collection('blog_likes').insertMany(likes);

  const comments: NativeDocument[] = [];
  for (let index = 0; index < 72; index += 1) {
    const parentIndex = index >= 48 ? index - 48 : null;
    const post = publishedPosts[(parentIndex ?? index) % publishedPosts.length];
    const user = blogUsers[(index + 1) % 2];
    const parent = parentIndex === null ? null : comments[parentIndex]?._id || null;
    const publicationAgeDays = Math.max(0, Math.floor((now.getTime() - post.publishedAt.getTime()) / DAY));
    const commentDay = Math.max(0, publicationAgeDays - 1 - (index % 10));
    const commentCreatedAt = parentIndex === null
      ? daysAgo(commentDay, 6 + (index % 10))
      : cappedPastDateAfter(comments[parentIndex].createdAt, 1);
    const content = [
      'The document sequence in this article is especially useful for operations teams.',
      'This matches what we are seeing in current buyer conversations. Clear specifications make the negotiation much faster.',
      'The practical checklist is helpful. I would also track inspection appointment lead time.',
      'Good overview of the commercial risks without losing the operational details.',
      'The comparison is clear and gives our team a better starting point for the next trade.',
      'I appreciate the focus on traceability and evidence rather than broad market claims.',
      'Could you cover insurance certificates in a follow-up article?',
      'This is a strong framework for reviewing a supplier offer.',
    ][index % 8];
    comments.push({
      _id: demoId(`blog-comment:${index}`),
      blogPostId: post._id,
      blogUserId: user._id,
      content,
      parentId: parent,
      isFlagged: [13, 37, 61].includes(index),
      flagCount: index === 13 ? 2 : [37, 61].includes(index) ? 1 : 0,
      flagReasons: index === 13 ? ['Potential promotional content', 'Off-topic link'] : [37, 61].includes(index) ? ['Needs moderator review'] : [],
      isHidden: index === 13,
      deletedAt: null,
      createdAt: commentCreatedAt,
      updatedAt: commentCreatedAt,
      demoSeed: SEED,
    });
  }
  await db.collection('blog_comments').insertMany(comments);

  const likeCounts = new Map<string, number>();
  const commentCounts = new Map<string, number>();
  for (const like of likes) likeCounts.set(like.blogPostId.toString(), (likeCounts.get(like.blogPostId.toString()) || 0) + 1);
  for (const comment of comments.filter((entry) => !entry.deletedAt)) commentCounts.set(comment.blogPostId.toString(), (commentCounts.get(comment.blogPostId.toString()) || 0) + 1);
  for (const post of blogPosts) {
    await db.collection('blog_posts').updateOne({ _id: post._id }, { $set: { likeCount: likeCounts.get(post._id.toString()) || 0, commentCount: commentCounts.get(post._id.toString()) || 0 } });
  }

  await db.collection('newslettersubscribers').insertMany([
    { _id: demoId('newsletter:primary'), email: PRIMARY_EMAIL, subscribedAt: daysAgo(170), isActive: true, unsubscribeToken: createHash('sha256').update(`${SEED}:newsletter:primary`).digest('hex'), source: 'blog_settings', lastDigestSentAt: daysAgo(7), createdAt: daysAgo(170), updatedAt: daysAgo(7), demoSeed: SEED },
    { _id: demoId('newsletter:secondary'), email: SECONDARY_EMAIL, subscribedAt: daysAgo(3), isActive: true, unsubscribeToken: createHash('sha256').update(`${SEED}:newsletter:secondary`).digest('hex'), source: 'blog_post', lastDigestSentAt: daysAgo(1), createdAt: daysAgo(3), updatedAt: daysAgo(1), demoSeed: SEED },
  ]);
  await db.collection('blog_writer_invites').insertMany([
    { _id: demoId('writer-invite:used:0'), token: createHash('sha256').update(`${SEED}:invite:used:0`).digest('hex'), createdBy: admin._id, usedBy: blogUsers[0]._id, usedAt: daysAgo(5), expiresAt: futureDays(1), emailHint: PRIMARY_EMAIL, adminNote: 'Invited after reviewing the writer profile and commodity experience.', createdAt: daysAgo(6), updatedAt: daysAgo(5), demoSeed: SEED },
    { _id: demoId('writer-invite:used:1'), token: createHash('sha256').update(`${SEED}:invite:used:1`).digest('hex'), createdBy: admin._id, usedBy: blogUsers[1]._id, usedAt: daysAgo(4), expiresAt: futureDays(2), emailHint: SECONDARY_EMAIL, adminNote: 'Invited to contribute operations and logistics coverage.', createdAt: daysAgo(5), updatedAt: daysAgo(4), demoSeed: SEED },
    { _id: demoId('writer-invite:pending:0'), token: createHash('sha256').update(`${SEED}:invite:pending:0`).digest('hex'), createdBy: admin._id, usedBy: null, usedAt: null, expiresAt: futureDays(6), emailHint: 'analyst@meridian-foods.example', adminNote: 'Prospective contributor for Gulf food commodity coverage.', createdAt: daysAgo(1), updatedAt: daysAgo(1), demoSeed: SEED },
    { _id: demoId('writer-invite:pending:1'), token: createHash('sha256').update(`${SEED}:invite:pending:1`).digest('hex'), createdBy: admin._id, usedBy: null, usedAt: null, expiresAt: futureDays(5), emailHint: 'research@northstar-materials.example', adminNote: 'Prospective contributor for industrial metals coverage.', createdAt: daysAgo(2), updatedAt: daysAgo(2), demoSeed: SEED },
    { _id: demoId('writer-invite:pending:2'), token: createHash('sha256').update(`${SEED}:invite:pending:2`).digest('hex'), createdBy: admin._id, usedBy: null, usedAt: null, expiresAt: futureDays(10), emailHint: 'editor@harbour-logistics.example', adminNote: 'Prospective contributor for ports, freight, and documentation coverage.', createdAt: daysAgo(3), updatedAt: daysAgo(3), demoSeed: SEED },
    { _id: demoId('writer-invite:pending:3'), token: createHash('sha256').update(`${SEED}:invite:pending:3`).digest('hex'), createdBy: admin._id, usedBy: null, usedAt: null, expiresAt: futureDays(3), emailHint: 'markets@oldtown-trading.example', adminNote: 'Prospective contributor for regional market intelligence.', createdAt: daysAgo(4), updatedAt: daysAgo(4), demoSeed: SEED },
    { _id: demoId('writer-invite:pending:4'), token: createHash('sha256').update(`${SEED}:invite:pending:4`).digest('hex'), createdBy: admin._id, usedBy: null, usedAt: null, expiresAt: futureDays(4), emailHint: 'quality@agri-inspection.example', adminNote: 'Prospective contributor for quality assurance and inspection coverage.', createdAt: daysAgo(3), updatedAt: daysAgo(3), demoSeed: SEED },
    { _id: demoId('writer-invite:pending:5'), token: createHash('sha256').update(`${SEED}:invite:pending:5`).digest('hex'), createdBy: admin._id, usedBy: null, usedAt: null, expiresAt: futureDays(8), emailHint: 'insights@coastal-commodities.example', adminNote: 'Prospective contributor for coastal commodity flows and price trends.', createdAt: daysAgo(2), updatedAt: daysAgo(2), demoSeed: SEED },
  ]);

  const expectedCounts: Record<string, number> = {
    users: 2,
    products: 16,
    trades: 72,
    auditlogs: 274,
    conversations: 8,
    messages: 124,
    notifications: 72,
    wishlists: 14,
    feedbacks: 72,
    tradedisputes: 8,
    adminactivitylogs: 144,
    alertrules: 5,
    alerthistory: 20,
    failedloginattempts: 48,
    blockedips: 6,
    blog_posts: 48,
    blog_comments: 72,
    blog_likes: 60,
    blog_writer_invites: 8,
    newslettersubscribers: 2,
    hsn_codes: 32,
  };
  const validationResults: Record<string, number> = {};
  validationResults.users = await users.countDocuments({ mail: { $in: [PRIMARY_EMAIL, SECONDARY_EMAIL] } });
  for (const collectionName of Object.keys(expectedCounts).filter((name) => name !== 'users')) {
    validationResults[collectionName] = await db.collection(collectionName).countDocuments({ demoSeed: SEED });
  }
  for (const [collectionName, expected] of Object.entries(expectedCounts)) {
    if (validationResults[collectionName] !== expected) {
      throw new Error(`${collectionName} validation failed: expected ${expected}, found ${validationResults[collectionName]}.`);
    }
  }

  const ttlEligibleNotifications = await db.collection('notifications').countDocuments({
    demoSeed: SEED,
    read: true,
    createdAt: { $lte: new Date(now.getTime() - 30 * DAY) },
  });
  if (ttlEligibleNotifications) {
    throw new Error(`Notification retention validation failed for ${ttlEligibleNotifications} records.`);
  }
  const expiredWriterInvites = await db.collection('blog_writer_invites').countDocuments({
    demoSeed: SEED,
    expiresAt: { $lte: now },
  });
  if (expiredWriterInvites) {
    throw new Error(`Writer invite retention validation failed for ${expiredWriterInvites} records.`);
  }

  const orphanedTrades = await db.collection('trades').aggregate([
    { $match: { demoSeed: SEED } },
    { $lookup: { from: 'users', localField: 'buyer', foreignField: '_id', as: 'buyerDoc' } },
    { $lookup: { from: 'users', localField: 'seller', foreignField: '_id', as: 'sellerDoc' } },
    { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productDoc' } },
    { $match: { $or: [{ buyerDoc: { $size: 0 } }, { sellerDoc: { $size: 0 } }, { productDoc: { $size: 0 } }] } },
    { $count: 'count' },
  ]).toArray();
  if (orphanedTrades[0]?.count) {
    throw new Error(`Trade reference validation failed for ${orphanedTrades[0].count} records.`);
  }

  const mismatchedSellerProducts = trades.filter((trade) => {
    const product = products.find((candidate) => candidate._id.equals(trade.product));
    return !product || product.userId !== trade.seller.toHexString();
  });
  if (mismatchedSellerProducts.length) {
    throw new Error(`Seller/product validation failed for ${mismatchedSellerProducts.length} trades.`);
  }

  const completedMonthKeys = new Set(completedTrades.map((trade) => trade.completedAt.toISOString().slice(0, 7)));
  if (completedMonthKeys.size < 6) {
    throw new Error(`Six-month trade coverage validation failed: completed trades cover only ${completedMonthKeys.size} calendar months.`);
  }
  const oldestTradeCreatedAt = Math.min(...trades.map((trade) => trade.createdAt.getTime()));
  if (now.getTime() - oldestTradeCreatedAt < 175 * DAY) {
    throw new Error('Six-month trade coverage validation failed: the oldest trade is less than 175 days old.');
  }
  const recentCompletedSellerIds = new Set(
    completedTrades
      .filter((trade) => now.getTime() - trade.completedAt.getTime() <= 7 * DAY)
      .map((trade) => trade.seller.toHexString()),
  );
  if (![primaryUserId, secondaryUserId].every((userId) => recentCompletedSellerIds.has(userId.toHexString()))) {
    throw new Error('Recent dashboard validation failed: both showcase sellers require a completed trade in the last seven days.');
  }

  const productViewMonthKeys = new Set(
    products.flatMap((product) => product.dailyViews.map((view: NativeDocument) => view.date.toISOString().slice(0, 7))),
  );
  if (productViewMonthKeys.size < 6) {
    throw new Error(`Six-month product-view validation failed: views cover only ${productViewMonthKeys.size} calendar months.`);
  }
  const publishedMonthKeys = new Set(
    publishedPosts.map((post) => post.publishedAt.toISOString().slice(0, 7)),
  );
  if (publishedMonthKeys.size < 6) {
    throw new Error(`Six-month blog coverage validation failed: published posts cover only ${publishedMonthKeys.size} calendar months.`);
  }

  const documentFields = ['scoDocument', 'icpoDocument', 'spaDocument', 'signedSpaDocument', 'paymentProof', 'bolDocument'];
  for (const trade of trades) {
    const lifecycleDates = [
      trade.createdAt,
      trade.acceptedAt,
      ...documentFields.map((field) => trade[field]?.uploadedAt),
      trade.completedAt || trade.cancelledAt || trade.rejectedAt,
    ].filter((date): date is Date => date instanceof Date);
    for (let index = 1; index < lifecycleDates.length; index += 1) {
      if (lifecycleDates[index].getTime() < lifecycleDates[index - 1].getTime()) {
        throw new Error(`Trade lifecycle validation failed for ${trade._id.toHexString()}.`);
      }
    }
  }

  const businessDates: Date[] = [
    ...products.flatMap((product) => [product.createdAt, product.updatedAt, product.lastViewedAt, ...product.dailyViews.map((view: NativeDocument) => view.date)]),
    ...trades.flatMap((trade) => [trade.createdAt, trade.updatedAt, trade.acceptedAt, trade.rejectedAt, trade.completedAt, trade.cancelledAt, ...trade.negotiationHistory.map((entry: NativeDocument) => entry.timestamp), ...documentFields.flatMap((field) => [trade[field]?.uploadedAt, trade[field]?.signedAt])]),
    ...messages.map((message) => message.createdAt),
    ...notifications.map((notification) => notification.createdAt),
    ...feedbacks.map((feedback) => feedback.createdAt),
    ...adminLogs.map((entry) => entry.createdAt),
    ...blogPosts.flatMap((post) => [post.createdAt, post.updatedAt, post.publishedAt, post.submittedAt, post.reviewedAt, post.deletedAt]),
    ...likes.map((like) => like.createdAt),
    ...comments.map((comment) => comment.createdAt),
  ].filter((date): date is Date => date instanceof Date);
  const futureBusinessDate = businessDates.find((date) => date.getTime() > now.getTime());
  if (futureBusinessDate) {
    throw new Error(`Business-date validation failed: ${futureBusinessDate.toISOString()} is in the future.`);
  }

  for (const product of products) {
    if (product.dailyViews.some((view: NativeDocument) => view.date < product.createdAt)) {
      throw new Error(`Product view chronology validation failed for ${product._id.toHexString()}.`);
    }
  }
  for (const conversation of conversations) {
    const conversationMessages = conversation.messages.map((messageId: ObjectId) => messages.find((message) => message._id.equals(messageId)));
    if (conversationMessages.some((message: NativeDocument | undefined) => !message)) {
      throw new Error(`Conversation message reference validation failed for ${conversation._id.toHexString()}.`);
    }
    for (let index = 1; index < conversationMessages.length; index += 1) {
      if (conversationMessages[index].createdAt < conversationMessages[index - 1].createdAt) {
        throw new Error(`Conversation chronology validation failed for ${conversation._id.toHexString()}.`);
      }
    }
  }
  for (const post of blogPosts) {
    const workflowDates = [post.createdAt, post.submittedAt, post.reviewedAt, post.publishedAt, post.updatedAt, post.deletedAt]
      .filter((date): date is Date => date instanceof Date);
    for (let index = 1; index < workflowDates.length; index += 1) {
      if (workflowDates[index] < workflowDates[index - 1]) {
        throw new Error(`Blog workflow chronology validation failed for ${post._id.toHexString()}.`);
      }
    }
  }
  for (const comment of comments) {
    const post = blogPosts.find((candidate) => candidate._id.equals(comment.blogPostId));
    const parent = comment.parentId ? comments.find((candidate) => candidate._id.equals(comment.parentId)) : undefined;
    if (!post?.publishedAt || comment.createdAt < post.publishedAt || (parent && comment.createdAt < parent.createdAt)) {
      throw new Error(`Blog comment chronology validation failed for ${comment._id.toHexString()}.`);
    }
  }
  for (const like of likes) {
    const post = blogPosts.find((candidate) => candidate._id.equals(like.blogPostId));
    if (!post?.publishedAt || like.createdAt < post.publishedAt) {
      throw new Error(`Blog like chronology validation failed for ${like._id.toHexString()}.`);
    }
  }

  for (const [filePath, expectedSize] of documentSizeByPath.entries()) {
    const stats = await fs.stat(join(uploadsRoot, filePath.replace(/^\/uploads\//, '')));
    if (stats.size !== expectedSize || stats.size < 500) {
      throw new Error(`Generated document validation failed for ${filePath}.`);
    }
  }
  if (documentSizeByPath.size !== 289) {
    throw new Error(`Trade document validation failed: expected 289 files, found ${documentSizeByPath.size}.`);
  }

  const invalidatedAnalyticsCacheKeys = await invalidateAnalyticsCaches();

  const summary = {
    seed: SEED,
    accounts: [PRIMARY_EMAIL, SECONDARY_EMAIL],
    mongo: validationResults,
    notifications: await db.collection('notifications').countDocuments({ demoSeed: SEED }),
    auditLogs: await db.collection('auditlogs').countDocuments({ demoSeed: SEED }),
    adminActivity: await db.collection('adminactivitylogs').countDocuments({ demoSeed: SEED }),
    wishlists: await db.collection('wishlists').countDocuments({ demoSeed: SEED }),
    alerts: await db.collection('alertrules').countDocuments({ demoSeed: SEED }),
    alertHistory: await db.collection('alerthistory').countDocuments({ demoSeed: SEED }),
    failedLogins: await db.collection('failedloginattempts').countDocuments({ demoSeed: SEED }),
    writerInvites: await db.collection('blog_writer_invites').countDocuments({ demoSeed: SEED }),
    tradeDocuments: documentSizeByPath.size,
    completedTradeMonths: [...completedMonthKeys].sort(),
    invalidatedAnalyticsCacheKeys,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
