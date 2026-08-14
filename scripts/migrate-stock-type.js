const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb://ravindusenanayake3415_db_user:admin1234@ac-v03q4bn-shard-00-00.iazs7qg.mongodb.net:27017,ac-v03q4bn-shard-00-01.iazs7qg.mongodb.net:27017,ac-v03q4bn-shard-00-02.iazs7qg.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0');
  
  const db = mongoose.connection.db;
  
  // 1. Get all recipes to find products that DO have recipes
  const recipes = await db.collection('recipes').find({}).toArray();
  const productIdsWithRecipes = new Set(recipes.map(r => r.productId.toString()));
  
  // 2. Update products
  const products = await db.collection('products').find({ type: 'Made to Order' }).toArray();
  
  let updated = 0;
  for (const p of products) {
    // If stockType is already set, skip
    if (p.stockType) continue;
    
    // Check if this product has recipes
    const hasRecipe = productIdsWithRecipes.has(p._id.toString());
    
    const newStockType = hasRecipe ? 'Recipe' : 'Non-Inventory';
    
    await db.collection('products').updateOne(
      { _id: p._id },
      { $set: { stockType: newStockType } }
    );
    updated++;
    console.log(`Updated product ${p.name} to stockType: ${newStockType}`);
  }
  
  console.log(`Migration complete. Updated ${updated} products.`);
  process.exit(0);
}

migrate().catch(console.error);
