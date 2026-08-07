require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI.split('@')[1] || 'local');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Clean up test suppliers
    const result = await mongoose.connection.db.collection('suppliers').deleteMany({ name: /Test Supplier/ });
    console.log(`🧹 Deleted ${result.deletedCount} dummy test suppliers.`);
    
    // Count remaining suppliers
    const remaining = await mongoose.connection.db.collection('suppliers').countDocuments();
    console.log(`📦 Remaining Suppliers in DB: ${remaining}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
