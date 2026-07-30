const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
        console.log('✅ SUCCESS: Connected to configured MongoDB!');
        process.exit(0);
        return;
      } catch (err) {
        console.warn('⚠️ Could not connect to MONGODB_URI directly. Starting MongoMemoryServer fallback...');
      }
    }
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ SUCCESS: Connected to In-Memory MongoDB instance at:', mongoUri);
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR: Could not connect to MongoDB.', error.message);
    process.exit(1);
  }
}

testConnection();

