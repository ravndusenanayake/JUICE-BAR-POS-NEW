import mongoose from 'mongoose';
import Product from './src/database/models/Product';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is missing');
}

const dummyProducts = [
  // Fresh Juices
  { sku: 'J001', name: 'Orange Juice', category: 'Fresh Juices', type: 'Product', unit: 'Cup', cost: 150, outletPrice: 350, pickmePrice: 400, uberPrice: 400, status: 'Active', addons: [] },
  { sku: 'J002', name: 'Mango Juice', category: 'Fresh Juices', type: 'Product', unit: 'Cup', cost: 120, outletPrice: 300, pickmePrice: 350, uberPrice: 350, status: 'Active', addons: [] },
  { sku: 'J003', name: 'Papaya Juice', category: 'Fresh Juices', type: 'Product', unit: 'Cup', cost: 100, outletPrice: 250, pickmePrice: 300, uberPrice: 300, status: 'Active', addons: [] },
  { sku: 'J004', name: 'Watermelon Juice', category: 'Fresh Juices', type: 'Product', unit: 'Cup', cost: 120, outletPrice: 280, pickmePrice: 320, uberPrice: 320, status: 'Active', addons: [] },
  
  // Milkshakes
  { sku: 'M001', name: 'Chocolate Milkshake', category: 'Milkshakes', type: 'Product', unit: 'Cup', cost: 250, outletPrice: 550, pickmePrice: 600, uberPrice: 600, status: 'Active', addons: [] },
  { sku: 'M002', name: 'Vanilla Milkshake', category: 'Milkshakes', type: 'Product', unit: 'Cup', cost: 200, outletPrice: 500, pickmePrice: 550, uberPrice: 550, status: 'Active', addons: [] },
  { sku: 'M003', name: 'Strawberry Milkshake', category: 'Milkshakes', type: 'Product', unit: 'Cup', cost: 230, outletPrice: 550, pickmePrice: 600, uberPrice: 600, status: 'Active', addons: [] },
  
  // Mojitos
  { sku: 'MOJ001', name: 'Classic Mint Mojito', category: 'Mojitos', type: 'Product', unit: 'Cup', cost: 150, outletPrice: 450, pickmePrice: 500, uberPrice: 500, status: 'Active', addons: [] },
  { sku: 'MOJ002', name: 'Blue Ocean Mojito', category: 'Mojitos', type: 'Product', unit: 'Cup', cost: 180, outletPrice: 500, pickmePrice: 550, uberPrice: 550, status: 'Active', addons: [] },
  
  // Snacks
  { sku: 'S001', name: 'Chicken Sandwich', category: 'Snacks', type: 'Product', unit: 'Nos', cost: 200, outletPrice: 450, pickmePrice: 500, uberPrice: 500, status: 'Active', addons: [] },
  { sku: 'S002', name: 'Fish Roll', category: 'Snacks', type: 'Product', unit: 'Nos', cost: 60, outletPrice: 120, pickmePrice: 150, uberPrice: 150, status: 'Active', addons: [] },
  { sku: 'S003', name: 'Vegetable Patty', category: 'Snacks', type: 'Product', unit: 'Nos', cost: 50, outletPrice: 100, pickmePrice: 130, uberPrice: 130, status: 'Active', addons: [] },
  
  // Desserts
  { sku: 'D001', name: 'Chocolate Biscuit Pudding', category: 'Desserts', type: 'Product', unit: 'Nos', cost: 150, outletPrice: 350, pickmePrice: 400, uberPrice: 400, status: 'Active', addons: [] },
  { sku: 'D002', name: 'Fruit Salad with Ice Cream', category: 'Desserts', type: 'Product', unit: 'Nos', cost: 180, outletPrice: 400, pickmePrice: 450, uberPrice: 450, status: 'Active', addons: [] }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB.');
    
    let added = 0;
    for (const product of dummyProducts) {
      const exists = await Product.findOne({ sku: product.sku });
      if (!exists) {
        await Product.create(product);
        added++;
        console.log(`Added product: ${product.name}`);
      }
    }
    
    console.log(`Seeding complete! Added ${added} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seed();
