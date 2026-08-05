// test-suppliers-db.js
const mongoose = require('mongoose');
const uri = "mongodb+srv://admin:admin@cluster0.zox2n.mongodb.net/juice-bar-pos?retryWrites=true&w=majority&appName=Cluster0";

async function test() {
  await mongoose.connect(uri);
  const db = mongoose.connection;
  const suppliers = await db.collection('suppliers').find().toArray();
  console.log(JSON.stringify(suppliers, null, 2));
  process.exit(0);
}
test();
