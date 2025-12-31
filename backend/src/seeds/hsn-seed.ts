import * as mongoose from 'mongoose';

const HSN_CODES = [
  // Live Animals
  { hsn_code: '0101', description: 'Live horses, asses, mules and hinnies', category: 'Live Animals' },
  { hsn_code: '0102', description: 'Live bovine animals', category: 'Live Animals' },
  { hsn_code: '0103', description: 'Live swine', category: 'Live Animals' },
  { hsn_code: '0104', description: 'Live sheep and goats', category: 'Live Animals' },
  { hsn_code: '0105', description: 'Live poultry', category: 'Live Animals' },

  // Meat
  { hsn_code: '0201', description: 'Meat of bovine animals, fresh or chilled', category: 'Meat' },
  { hsn_code: '0202', description: 'Meat of bovine animals, frozen', category: 'Meat' },
  { hsn_code: '0203', description: 'Meat of swine, fresh, chilled or frozen', category: 'Meat' },
  { hsn_code: '0207', description: 'Meat and edible offal of poultry', category: 'Meat' },

  // Fish & Seafood
  { hsn_code: '0301', description: 'Live fish', category: 'Fish & Seafood' },
  { hsn_code: '0302', description: 'Fish, fresh or chilled', category: 'Fish & Seafood' },
  { hsn_code: '0303', description: 'Fish, frozen', category: 'Fish & Seafood' },
  { hsn_code: '0306', description: 'Crustaceans (lobsters, crabs, shrimps)', category: 'Fish & Seafood' },
  { hsn_code: '0307', description: 'Molluscs (oysters, scallops, mussels)', category: 'Fish & Seafood' },

  // Dairy Products
  { hsn_code: '0401', description: 'Milk and cream, not concentrated', category: 'Dairy' },
  { hsn_code: '0402', description: 'Milk and cream, concentrated or sweetened', category: 'Dairy' },
  { hsn_code: '0403', description: 'Buttermilk, yogurt, kephir', category: 'Dairy' },
  { hsn_code: '0404', description: 'Whey and milk products', category: 'Dairy' },
  { hsn_code: '0405', description: 'Butter and dairy spreads', category: 'Dairy' },
  { hsn_code: '0406', description: 'Cheese and curd', category: 'Dairy' },

  // Cereals
  { hsn_code: '1001', description: 'Wheat and meslin', category: 'Cereals' },
  { hsn_code: '1002', description: 'Rye', category: 'Cereals' },
  { hsn_code: '1003', description: 'Barley', category: 'Cereals' },
  { hsn_code: '1004', description: 'Oats', category: 'Cereals' },
  { hsn_code: '1005', description: 'Maize (corn)', category: 'Cereals' },
  { hsn_code: '1006', description: 'Rice', category: 'Cereals' },
  { hsn_code: '1007', description: 'Grain sorghum', category: 'Cereals' },
  { hsn_code: '1008', description: 'Buckwheat, millet and other cereals', category: 'Cereals' },

  // Oil Seeds
  { hsn_code: '1201', description: 'Soya beans', category: 'Oil Seeds' },
  { hsn_code: '1202', description: 'Ground-nuts (peanuts)', category: 'Oil Seeds' },
  { hsn_code: '1203', description: 'Copra', category: 'Oil Seeds' },
  { hsn_code: '1204', description: 'Linseed', category: 'Oil Seeds' },
  { hsn_code: '1205', description: 'Rape or colza seeds', category: 'Oil Seeds' },
  { hsn_code: '1206', description: 'Sunflower seeds', category: 'Oil Seeds' },
  { hsn_code: '1207', description: 'Other oil seeds (sesame, mustard, safflower)', category: 'Oil Seeds' },

  // Vegetable Oils
  { hsn_code: '1507', description: 'Soya-bean oil', category: 'Vegetable Oils' },
  { hsn_code: '1508', description: 'Ground-nut oil', category: 'Vegetable Oils' },
  { hsn_code: '1509', description: 'Olive oil', category: 'Vegetable Oils' },
  { hsn_code: '1511', description: 'Palm oil', category: 'Vegetable Oils' },
  { hsn_code: '1512', description: 'Sunflower-seed or safflower oil', category: 'Vegetable Oils' },
  { hsn_code: '1513', description: 'Coconut or palm kernel oil', category: 'Vegetable Oils' },
  { hsn_code: '1514', description: 'Rape, colza or mustard oil', category: 'Vegetable Oils' },
  { hsn_code: '1515', description: 'Other vegetable fats and oils', category: 'Vegetable Oils' },

  // Sugar
  { hsn_code: '1701', description: 'Cane or beet sugar', category: 'Sugar' },
  { hsn_code: '1702', description: 'Other sugars (glucose, fructose)', category: 'Sugar' },
  { hsn_code: '1703', description: 'Molasses', category: 'Sugar' },

  // Coffee, Tea, Spices
  { hsn_code: '0901', description: 'Coffee', category: 'Coffee, Tea & Spices' },
  { hsn_code: '0902', description: 'Tea', category: 'Coffee, Tea & Spices' },
  { hsn_code: '0904', description: 'Pepper', category: 'Coffee, Tea & Spices' },
  { hsn_code: '0905', description: 'Vanilla', category: 'Coffee, Tea & Spices' },
  { hsn_code: '0906', description: 'Cinnamon', category: 'Coffee, Tea & Spices' },
  { hsn_code: '0907', description: 'Cloves', category: 'Coffee, Tea & Spices' },
  { hsn_code: '0908', description: 'Nutmeg, mace, cardamoms', category: 'Coffee, Tea & Spices' },
  { hsn_code: '0909', description: 'Seeds of anise, cumin, caraway', category: 'Coffee, Tea & Spices' },
  { hsn_code: '0910', description: 'Ginger, saffron, turmeric, thyme', category: 'Coffee, Tea & Spices' },

  // Fruits
  { hsn_code: '0803', description: 'Bananas', category: 'Fruits' },
  { hsn_code: '0804', description: 'Dates, figs, pineapples, avocados, mangoes', category: 'Fruits' },
  { hsn_code: '0805', description: 'Citrus fruit (oranges, lemons)', category: 'Fruits' },
  { hsn_code: '0806', description: 'Grapes', category: 'Fruits' },
  { hsn_code: '0808', description: 'Apples, pears', category: 'Fruits' },

  // Vegetables
  { hsn_code: '0701', description: 'Potatoes', category: 'Vegetables' },
  { hsn_code: '0702', description: 'Tomatoes', category: 'Vegetables' },
  { hsn_code: '0703', description: 'Onions, garlic, leeks', category: 'Vegetables' },
  { hsn_code: '0708', description: 'Leguminous vegetables (peas, beans)', category: 'Vegetables' },

  // Cotton & Textiles
  { hsn_code: '5201', description: 'Cotton, not carded or combed', category: 'Cotton & Textiles' },
  { hsn_code: '5202', description: 'Cotton waste', category: 'Cotton & Textiles' },
  { hsn_code: '5203', description: 'Cotton, carded or combed', category: 'Cotton & Textiles' },
  { hsn_code: '5204', description: 'Cotton sewing thread', category: 'Cotton & Textiles' },
  { hsn_code: '5205', description: 'Cotton yarn', category: 'Cotton & Textiles' },
  { hsn_code: '5208', description: 'Woven cotton fabrics', category: 'Cotton & Textiles' },

  // Mineral Fuels
  { hsn_code: '2701', description: 'Coal; briquettes', category: 'Mineral Fuels' },
  { hsn_code: '2704', description: 'Coke and semi-coke of coal', category: 'Mineral Fuels' },
  { hsn_code: '2709', description: 'Petroleum oils, crude', category: 'Mineral Fuels' },
  { hsn_code: '2710', description: 'Petroleum oils, refined', category: 'Mineral Fuels' },
  { hsn_code: '2711', description: 'Petroleum gases (LPG, natural gas)', category: 'Mineral Fuels' },

  // Ores & Minerals
  { hsn_code: '2601', description: 'Iron ores and concentrates', category: 'Ores & Minerals' },
  { hsn_code: '2602', description: 'Manganese ores and concentrates', category: 'Ores & Minerals' },
  { hsn_code: '2603', description: 'Copper ores and concentrates', category: 'Ores & Minerals' },
  { hsn_code: '2604', description: 'Nickel ores and concentrates', category: 'Ores & Minerals' },
  { hsn_code: '2606', description: 'Aluminium ores (bauxite)', category: 'Ores & Minerals' },
  { hsn_code: '2607', description: 'Lead ores and concentrates', category: 'Ores & Minerals' },
  { hsn_code: '2608', description: 'Zinc ores and concentrates', category: 'Ores & Minerals' },
  { hsn_code: '2609', description: 'Tin ores and concentrates', category: 'Ores & Minerals' },
  { hsn_code: '2610', description: 'Chromium ores and concentrates', category: 'Ores & Minerals' },

  // Precious Metals
  { hsn_code: '7106', description: 'Silver', category: 'Precious Metals' },
  { hsn_code: '7108', description: 'Gold', category: 'Precious Metals' },
  { hsn_code: '7110', description: 'Platinum', category: 'Precious Metals' },

  // Base Metals
  { hsn_code: '7201', description: 'Pig iron and spiegeleisen', category: 'Base Metals' },
  { hsn_code: '7206', description: 'Iron and non-alloy steel ingots', category: 'Base Metals' },
  { hsn_code: '7208', description: 'Hot-rolled steel products', category: 'Base Metals' },
  { hsn_code: '7209', description: 'Cold-rolled steel products', category: 'Base Metals' },
  { hsn_code: '7403', description: 'Refined copper', category: 'Base Metals' },
  { hsn_code: '7404', description: 'Copper waste and scrap', category: 'Base Metals' },
  { hsn_code: '7601', description: 'Unwrought aluminium', category: 'Base Metals' },
  { hsn_code: '7602', description: 'Aluminium waste and scrap', category: 'Base Metals' },
  { hsn_code: '7801', description: 'Unwrought lead', category: 'Base Metals' },
  { hsn_code: '7901', description: 'Unwrought zinc', category: 'Base Metals' },
  { hsn_code: '8001', description: 'Unwrought tin', category: 'Base Metals' },

  // Chemicals
  { hsn_code: '2801', description: 'Fluorine, chlorine, bromine, iodine', category: 'Chemicals' },
  { hsn_code: '2804', description: 'Hydrogen, nitrogen, oxygen', category: 'Chemicals' },
  { hsn_code: '2814', description: 'Ammonia', category: 'Chemicals' },
  { hsn_code: '2815', description: 'Sodium hydroxide (caustic soda)', category: 'Chemicals' },
  { hsn_code: '2833', description: 'Sulphates', category: 'Chemicals' },
  { hsn_code: '3102', description: 'Mineral or chemical nitrogenous fertilisers', category: 'Chemicals' },
  { hsn_code: '3103', description: 'Mineral or chemical phosphatic fertilisers', category: 'Chemicals' },
  { hsn_code: '3104', description: 'Mineral or chemical potassic fertilisers', category: 'Chemicals' },
  { hsn_code: '3105', description: 'Mixed fertilisers', category: 'Chemicals' },

  // Rubber
  { hsn_code: '4001', description: 'Natural rubber', category: 'Rubber' },
  { hsn_code: '4002', description: 'Synthetic rubber', category: 'Rubber' },
  { hsn_code: '4005', description: 'Compounded rubber', category: 'Rubber' },

  // Wood & Paper
  { hsn_code: '4401', description: 'Fuel wood, wood chips', category: 'Wood & Paper' },
  { hsn_code: '4403', description: 'Wood in the rough', category: 'Wood & Paper' },
  { hsn_code: '4407', description: 'Wood sawn or chipped', category: 'Wood & Paper' },
  { hsn_code: '4703', description: 'Chemical wood pulp', category: 'Wood & Paper' },
  { hsn_code: '4801', description: 'Newsprint', category: 'Wood & Paper' },
  { hsn_code: '4802', description: 'Uncoated paper for writing/printing', category: 'Wood & Paper' },

  // Plastics
  { hsn_code: '3901', description: 'Polymers of ethylene', category: 'Plastics' },
  { hsn_code: '3902', description: 'Polymers of propylene', category: 'Plastics' },
  { hsn_code: '3903', description: 'Polymers of styrene', category: 'Plastics' },
  { hsn_code: '3904', description: 'Polymers of vinyl chloride (PVC)', category: 'Plastics' },
  { hsn_code: '3907', description: 'Polyacetals, polyethers, epoxide resins', category: 'Plastics' },
];

async function seedHSNCodes() {
  const mongoUri = process.env.MONGODB_URI_DEV || 'mongodb+srv://badri:mongodb@breyus.5tfwoeg.mongodb.net/breyus?retryWrites=true&w=majority';

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db!;
    const collection = db.collection('hsn_codes');

    // Clear existing data
    await collection.deleteMany({});
    console.log('Cleared existing HSN codes');

    // Insert new data
    const result = await collection.insertMany(HSN_CODES);
    console.log(`Inserted ${result.insertedCount} HSN codes`);

    // Create indexes for better search performance
    await collection.createIndex({ hsn_code: 1 });
    await collection.createIndex({ description: 'text', category: 'text' });
    console.log('Created indexes');

    console.log('HSN codes seeded successfully!');
  } catch (error) {
    console.error('Error seeding HSN codes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedHSNCodes();
