const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const BranchInventory = mongoose.model('BranchInventory', new mongoose.Schema({}, {strict: false}), 'branchinventories');
  await BranchInventory.deleteMany({ sku: { $in: ['AV01', '6a54b6252dc5774dff1afbd7', '6a54b6252dc5774dff1afbcf'] } });
  console.log('Cleaned up bugged inventory items');
  process.exit(0);
});
