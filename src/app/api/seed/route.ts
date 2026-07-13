import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/database/mongoose';
import Product from '@/database/models/Product';
import Recipe from '@/database/models/Recipe';
import RawMaterial from '@/database/models/RawMaterial';
import ProductVariant from '@/database/models/ProductVariant';
import Customer from '@/database/models/Customer';
import Category from '@/database/models/Category';
import BranchInventory from '@/database/models/BranchInventory';
import Branch from '@/database/models/Branch';
import InventoryItem from '@/database/models/InventoryItem';

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Drop existing core mock collections to clear old indexes
    const dropIfExists = async (model: any) => {
      try {
        await model.collection.drop();
      } catch (e: any) {
        if (e.code !== 26) console.error('Drop error:', e); // 26 is namespace not found
      }
    };

    await dropIfExists(Product);
    await dropIfExists(ProductVariant);
    await dropIfExists(Recipe);
    await dropIfExists(RawMaterial);
    await dropIfExists(Customer);
    await dropIfExists(Category);
    await dropIfExists(BranchInventory);
    await dropIfExists(Branch);
    await dropIfExists(InventoryItem);

    console.log('Cleared existing collections...');

    // 2. Seed Categories
    const categories = await Category.insertMany([
      { name: 'Fresh Juices', description: 'All fresh fruit juices', status: 'Active' },
      { name: 'Smoothies', description: 'Blended smoothies with milk or yogurt', status: 'Active' },
      { name: 'Desserts', description: 'Sweet desserts and cakes', status: 'Active' },
      { name: 'General', description: 'General items', status: 'Active' }
    ]);

    // 3. Seed Raw Materials
    const rawMaterials = await RawMaterial.insertMany([
      { sku: 'RM-MNG', name: 'Mango', category: 'Fruits', unit: 'g', minStockLevel: 1000, currentStock: 0, status: 'Active' },
      { selectedUnit: "g", sku: 'RM-SUG', name: 'Sugar', category: 'Grocery', unit: 'g', minStockLevel: 2000, currentStock: 0, status: 'Active' },
      { sku: 'RM-WAT', name: 'Purified Water', category: 'Grocery', unit: 'ml', minStockLevel: 5000, currentStock: 0, status: 'Active' },
      { sku: 'RM-AVO', name: 'Avocado', category: 'Fruits', unit: 'g', minStockLevel: 1000, currentStock: 0, status: 'Active' },
      { sku: 'RM-MLK', name: 'Fresh Milk', category: 'Dairy', unit: 'ml', minStockLevel: 5000, currentStock: 0, status: 'Active' }
    ]);

    // 4. Seed Products
    const products = await Product.insertMany([
      { sku: 'MJ01', name: 'Mango Juice', category: 'Fresh Juices', type: 'Product', unit: 'Nos', cost: 120, outletPrice: 350, pickmePrice: 400, uberPrice: 420, status: 'Active', addons: [{name: "Vanilla Ice Cream Scoop", price: 150}, {name: "Chia Seeds", price: 80}, {name: "Extra Sugar", price: 0}, {name: "No Sugar", price: 0}, {name: "Honey Instead of Sugar", price: 100}, {name: "Extra Ice", price: 0}, {name: "No Ice", price: 0}] },
      { sku: 'AV01', name: 'Avocado Juice', category: 'Fresh Juices', type: 'Product', unit: 'Nos', cost: 180, outletPrice: 450, pickmePrice: 500, uberPrice: 520, status: 'Active', addons: [{name: "Chocolate Ice Cream Scoop", price: 180}, {name: "Honey Instead of Sugar", price: 100}, {name: "Extra Nuts (Cashews)", price: 200}, {name: "Vanilla Ice Cream Scoop", price: 150}] },
      { sku: 'BF01', name: 'Blackforest Cake', category: 'Desserts', type: 'Product', unit: 'Nos', cost: 200, outletPrice: 500, pickmePrice: 550, uberPrice: 580, status: 'Active', addons: [{name: "Extra Ice Cream (Vanilla)", price: 150}, {name: "Extra Ice Cream (Chocolate)", price: 180}, {name: "Extra Nuts", price: 200}] },
      { sku: 'MS01', name: 'Chocolate Milkshake', category: 'Milkshakes', type: 'Product', unit: 'Nos', cost: 250, outletPrice: 600, status: 'Active', addons: [{name: "Whipped Cream", price: 120}, {name: "Chocolate Syrup", price: 80}, {name: "Oreo Crumbs", price: 150}, {name: "Protein Powder (1 Scoop)", price: 300}] }
    ]);

    // 4.5 Seed Product Variants
    const productVariants = await ProductVariant.insertMany([
      { productId: products[0]._id, name: 'Small', sellingPrice: 350, status: 'Active' },
      { productId: products[0]._id, name: 'Large', sellingPrice: 500, status: 'Active' },
      { productId: products[1]._id, name: 'Small', sellingPrice: 450, status: 'Active' },
      { productId: products[1]._id, name: 'Large', sellingPrice: 600, status: 'Active' }
    ]);

    // 5. Seed Recipes
    const recipes = await Recipe.insertMany([
      {
        productId: products[0]._id, // Mango Juice
        productName: 'Mango Juice',
        variant: 'Small',
        ingredients: [
          { rawMaterialId: rawMaterials[0].sku, name: 'Mango', quantity: 200, unit: 'g', costPerUnit: 0.5, totalCost: 100 },
          { rawMaterialId: rawMaterials[1].sku, name: 'Sugar', quantity: 30, unit: 'g', costPerUnit: 0.2, totalCost: 6 },
          { rawMaterialId: rawMaterials[2].sku, name: 'Purified Water', quantity: 100, unit: 'ml', costPerUnit: 0.05, totalCost: 5 }
        ],
        totalCost: 111
      },
      {
        productId: products[1]._id, // Avocado Juice
        productName: 'Avocado Juice',
        variant: 'Small',
        ingredients: [
          { rawMaterialId: rawMaterials[3].sku, name: 'Avocado', quantity: 150, unit: 'g', costPerUnit: 0.8, totalCost: 120 },
          { rawMaterialId: rawMaterials[4].sku, name: 'Fresh Milk', quantity: 100, unit: 'ml', costPerUnit: 0.4, totalCost: 40 },
          { rawMaterialId: rawMaterials[1].sku, name: 'Sugar', quantity: 30, unit: 'g', costPerUnit: 0.2, totalCost: 6 }
        ],
        totalCost: 166
      }
    ]);

    // 6. Seed Customers
    const customers = await Customer.insertMany([
      { customerCode: 'CUST-001', name: 'Walk-In Customer', mobile: '0000000000', email: 'walkin@juicebar.com', address: 'N/A', loyaltyPoints: 0, status: 'Active' },
      { customerCode: 'CUST-002', name: 'Jane Doe', mobile: '0712345678', email: 'jane@example.com', address: 'Colombo', loyaltyPoints: 120, status: 'Active' }
    ]);

    // 6.5 Seed Branches
    const branches = await Branch.insertMany([
      { name: 'Colombo 07', code: 'COL07', address: 'Colombo 07', contactNumber: '0112345678', status: 'Active', managerId: null },
      { name: 'Kandy Branch', code: 'KAN01', address: 'Kandy', contactNumber: '0812345678', status: 'Active', managerId: null },
      { name: 'Galle Branch', code: 'GAL01', address: 'Galle', contactNumber: '0912345678', status: 'Active', managerId: null }
    ]);

    // 6.6 Seed InventoryItem (Shared Product/RawMaterial registry)
    const inventoryItems = await InventoryItem.insertMany([
      { sku: 'RM-MNG', name: 'Mango', unit: 'g', type: 'Raw Material' },
      { sku: 'RM-SUG', name: 'Sugar', unit: 'g', type: 'Raw Material' },
      { sku: 'RM-WAT', name: 'Purified Water', unit: 'ml', type: 'Raw Material' },
      { sku: 'RM-AVO', name: 'Avocado', unit: 'g', type: 'Raw Material' },
      { sku: 'RM-MLK', name: 'Fresh Milk', unit: 'ml', type: 'Raw Material' },
      { sku: 'item1', name: 'Test Mango', unit: 'Kg', type: 'Raw Material' }
    ]);

    // 7. Seed Branch Inventory (For Colombo 07)
    // We get the first branch, but we can hardcode for Colombo 07 if it exists, or just use string 'Colombo 07' for now since schema uses String for branch
    const branchName = 'Colombo 07';
    const branchInventoryItems = rawMaterials.map(rm => ({
      branch: branchName,
      sku: rm.sku,
      name: rm.name,
      category: rm.category,
      unit: rm.unit,
      quantity: 5000, // Seed with 5000 units each
      minStockLevel: rm.minStockLevel,
      lastRestocked: new Date(),
      status: 'In Stock'
    }));
    await BranchInventory.insertMany(branchInventoryItems);

    return NextResponse.json({ 
      message: 'Database seeded successfully',
      data: {
        categories: categories.length,
        rawMaterials: rawMaterials.length,
        products: products.length,
        recipes: recipes.length,
        customers: customers.length,
        inventory: branchInventoryItems.length
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Seeding Error:', error);
    return NextResponse.json({ error: 'Failed to seed database', details: error.message }, { status: 500 });
  }
}
