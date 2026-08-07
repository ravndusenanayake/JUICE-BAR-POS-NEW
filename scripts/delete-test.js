const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/juice-bar-pos');
  const result = await mongoose.connection.db.collection('suppliers').deleteMany({ name: /Test Supplier/ });
  console.log('Deleted test suppliers:', result.deletedCount);
  process.exit();
}
run();
