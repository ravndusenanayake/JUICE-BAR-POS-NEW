import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
import User from '@/database/models/User';
import Role from '@/database/models/Role';
import Supplier from '@/database/models/Supplier';
import AddOn from '@/database/models/AddOn';
import Unit from '@/database/models/Unit';
import { roleService } from '@/services/role.service';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';
    const existingBranches = await Branch.countDocuments();
    
    if (existingBranches > 0 && !force) {
      return NextResponse.json({ message: 'Database already seeded. Use ?force=true to re-seed.' }, { status: 200 });
    }

    // Drop existing collections
    const dropIfExists = async (model: any) => {
      try {
        await model.collection.drop();
      } catch (e: any) {
        if (e.code !== 26) console.error('Drop error:', e);
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
    await dropIfExists(User);
    await dropIfExists(Role);
    await dropIfExists(Supplier);
    await dropIfExists(AddOn);
    await dropIfExists(Unit);

    console.log('✅ Cleared existing collections...');

    // ========================================
    // 1. ROLES & USERS
    // ========================================
    await roleService.seedDefaultRoles();

    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const hashedManager = await bcrypt.hash('manager123', 10);
    const hashedCashier = await bcrypt.hash('cashier123', 10);

    await User.insertMany([
      { name: 'Super Admin', email: 'superadmin@juicebar.com', password: hashedAdmin, role: 'Super Admin', branch: 'All Branches', status: 'Active' },
      { name: 'Admin User', email: 'admin@juicebar.com', password: hashedAdmin, role: 'Admin', branch: 'All Branches', status: 'Active' },
      { name: 'Branch Manager - Colombo', email: 'manager@juicebar.com', password: hashedManager, role: 'Branch Manager', branch: 'Colombo 07', status: 'Active' },
      { name: 'Cashier Nimal', email: 'cashier@juicebar.com', password: hashedCashier, role: 'Cashier', branch: 'Colombo 07', status: 'Active' },
      { name: 'Cashier Kamal', email: 'cashier2@juicebar.com', password: hashedCashier, role: 'Cashier', branch: 'Kandy Branch', status: 'Active' },
    ]);
    console.log('✅ Users seeded');

    // ========================================
    // 2. BRANCHES
    // ========================================
    await Branch.insertMany([
      { name: 'Colombo 07', code: 'COL07', address: 'No. 45, Flower Road, Colombo 07', contactNumber: '0112345678', status: 'Active' },
      { name: 'Kandy Branch', code: 'KAN01', address: 'No. 12, Peradeniya Road, Kandy', contactNumber: '0812345678', status: 'Active' },
      { name: 'Galle Branch', code: 'GAL01', address: 'No. 8, Church Street, Galle Fort', contactNumber: '0912345678', status: 'Active' },
    ]);
    console.log('✅ Branches seeded');

    // ========================================
    // 3. UNITS
    // ========================================
    await Unit.insertMany([
      { name: 'Grams', code: 'g', type: 'Weight', isBaseUnit: true, conversionFactor: 1, status: 'Active' },
      { name: 'Kilograms', code: 'Kg', type: 'Weight', isBaseUnit: false, baseUnitCode: 'g', conversionFactor: 1000, status: 'Active' },
      { name: 'Millilitres', code: 'ml', type: 'Volume', isBaseUnit: true, conversionFactor: 1, status: 'Active' },
      { name: 'Litres', code: 'L', type: 'Volume', isBaseUnit: false, baseUnitCode: 'ml', conversionFactor: 1000, status: 'Active' },
      { name: 'Pieces', code: 'Nos', type: 'Count', isBaseUnit: true, conversionFactor: 1, status: 'Active' },
      { name: 'Bottles', code: 'Bottles', type: 'Count', isBaseUnit: true, conversionFactor: 1, status: 'Active' },
      { name: 'Packets', code: 'Packets', type: 'Count', isBaseUnit: true, conversionFactor: 1, status: 'Active' },
    ]);
    console.log('✅ Units seeded');

    // ========================================
    // 4. CATEGORIES
    // ========================================
    const categories = await Category.insertMany([
      { name: 'Fresh Juices', description: 'Fresh fruit juices', status: 'Active' },
      { name: 'Smoothies', description: 'Blended smoothies', status: 'Active' },
      { name: 'Milkshakes', description: 'Milkshakes with fresh milk', status: 'Active' },
      { name: 'Mojitos', description: 'Fresh mojito drinks', status: 'Active' },
      { name: 'Submarines', description: 'Submarine sandwiches', status: 'Active' },
      { name: 'Desserts', description: 'Sweet desserts and cakes', status: 'Active' },
      { name: 'Extras', description: 'Extra items and add-ons', status: 'Active' },
      { name: 'General', description: 'General items', status: 'Active' },
    ]);
    console.log('✅ Categories seeded');

    // ========================================
    // 5. SUPPLIERS
    // ========================================
    await Supplier.insertMany([
      { name: 'Fresh Farms LTD', contactPerson: 'Mr. Perera', mobile: '0771234567', email: 'info@freshfarms.lk', address: 'Dambulla, Sri Lanka', status: 'Active' },
      { name: 'Ceylon Dairy Co.', contactPerson: 'Mr. Silva', mobile: '0779876543', email: 'orders@ceylondairy.lk', address: 'Nuwara Eliya, Sri Lanka', status: 'Active' },
      { name: 'Island Grocers', contactPerson: 'Ms. Fernando', mobile: '0765551234', email: 'supply@islandgrocers.lk', address: 'Colombo 10, Sri Lanka', status: 'Active' },
      { name: 'Tropical Fruits Lanka', contactPerson: 'Mr. Bandara', mobile: '0722223333', email: 'sales@tropicalfruits.lk', address: 'Kurunegala, Sri Lanka', status: 'Active' },
    ]);
    console.log('✅ Suppliers seeded');

    // ========================================
    // 6. ADD-ONS (Global)
    // ========================================
    await AddOn.insertMany([
      { name: 'Vanilla Ice Cream Scoop', price: 150, status: 'Active' },
      { name: 'Chocolate Ice Cream Scoop', price: 180, status: 'Active' },
      { name: 'Whipped Cream', price: 120, status: 'Active' },
      { name: 'Chia Seeds', price: 80, status: 'Active' },
      { name: 'Honey Instead of Sugar', price: 100, status: 'Active' },
      { name: 'Extra Sugar', price: 0, status: 'Active' },
      { name: 'No Sugar', price: 0, status: 'Active' },
      { name: 'Extra Ice', price: 0, status: 'Active' },
      { name: 'No Ice', price: 0, status: 'Active' },
      { name: 'Protein Powder (1 Scoop)', price: 300, status: 'Active' },
      { name: 'Cashew Nuts', price: 200, status: 'Active' },
      { name: 'Oreo Crumbs', price: 150, status: 'Active' },
    ]);
    console.log('✅ Add-ons seeded');

    // ========================================
    // 7. RAW MATERIALS
    // ========================================
    const rawMaterials = await RawMaterial.insertMany([
      // Fruits
      { sku: 'RM-MNG', name: 'Mango', category: 'Fruits', unit: 'g', minStockLevel: 2000, currentStock: 0, status: 'Active' },
      { sku: 'RM-AVO', name: 'Avocado', category: 'Fruits', unit: 'g', minStockLevel: 2000, currentStock: 0, status: 'Active' },
      { sku: 'RM-PAS', name: 'Passion Fruit', category: 'Fruits', unit: 'g', minStockLevel: 1000, currentStock: 0, status: 'Active' },
      { sku: 'RM-STR', name: 'Strawberry', category: 'Fruits', unit: 'g', minStockLevel: 1000, currentStock: 0, status: 'Active' },
      { sku: 'RM-BAN', name: 'Banana', category: 'Fruits', unit: 'g', minStockLevel: 2000, currentStock: 0, status: 'Active' },
      { sku: 'RM-PNP', name: 'Pineapple', category: 'Fruits', unit: 'g', minStockLevel: 1500, currentStock: 0, status: 'Active' },
      { sku: 'RM-WTM', name: 'Watermelon', category: 'Fruits', unit: 'g', minStockLevel: 3000, currentStock: 0, status: 'Active' },
      { sku: 'RM-LMN', name: 'Lime/Lemon', category: 'Fruits', unit: 'g', minStockLevel: 500, currentStock: 0, status: 'Active' },
      // Dairy
      { sku: 'RM-MLK', name: 'Fresh Milk', category: 'Dairy', unit: 'ml', minStockLevel: 5000, currentStock: 0, status: 'Active' },
      { sku: 'RM-YGT', name: 'Yogurt', category: 'Dairy', unit: 'g', minStockLevel: 2000, currentStock: 0, status: 'Active' },
      // Grocery
      { sku: 'RM-SUG', name: 'Sugar', category: 'Grocery', unit: 'g', minStockLevel: 3000, currentStock: 0, status: 'Active' },
      { sku: 'RM-WAT', name: 'Purified Water', category: 'Grocery', unit: 'ml', minStockLevel: 10000, currentStock: 0, status: 'Active' },
      { sku: 'RM-ICE', name: 'Ice Cubes', category: 'Grocery', unit: 'g', minStockLevel: 5000, currentStock: 0, status: 'Active' },
      { sku: 'RM-HNY', name: 'Honey', category: 'Grocery', unit: 'ml', minStockLevel: 500, currentStock: 0, status: 'Active' },
      { sku: 'RM-MNT', name: 'Fresh Mint Leaves', category: 'Herbs', unit: 'g', minStockLevel: 200, currentStock: 0, status: 'Active' },
      { sku: 'RM-CHO', name: 'Chocolate Syrup', category: 'Grocery', unit: 'ml', minStockLevel: 1000, currentStock: 0, status: 'Active' },
    ]);
    console.log('✅ Raw Materials seeded');

    // ========================================
    // 8. PRODUCTS
    // ========================================
    // Recipe-based products (stockType: 'Recipe') — needs recipe, stock deducted via raw materials
    const products = await Product.insertMany([
      // --- RECIPE BASED (Made to Order) ---
      {
        sku: 'MJ01', name: 'Mango Juice', category: 'Fresh Juices', type: 'Made to Order',
        unit: 'Nos', outletPrice: 350, status: 'Active', stockType: 'Recipe',
        addons: [
          { name: 'Vanilla Ice Cream Scoop', price: 150 },
          { name: 'Chia Seeds', price: 80 },
          { name: 'Extra Sugar', price: 0 },
          { name: 'No Sugar', price: 0 },
          { name: 'Honey Instead of Sugar', price: 100 },
        ]
      },
      {
        sku: 'AV01', name: 'Avocado Juice', category: 'Fresh Juices', type: 'Made to Order',
        unit: 'Nos', outletPrice: 450, status: 'Active', stockType: 'Recipe',
        addons: [
          { name: 'Chocolate Ice Cream Scoop', price: 180 },
          { name: 'Honey Instead of Sugar', price: 100 },
          { name: 'Cashew Nuts', price: 200 },
        ]
      },
      {
        sku: 'PJ01', name: 'Passion Fruit Juice', category: 'Fresh Juices', type: 'Made to Order',
        unit: 'Nos', outletPrice: 400, status: 'Active', stockType: 'Recipe',
        addons: [
          { name: 'Extra Sugar', price: 0 },
          { name: 'No Sugar', price: 0 },
          { name: 'Honey Instead of Sugar', price: 100 },
        ]
      },
      {
        sku: 'WM01', name: 'Watermelon Juice', category: 'Fresh Juices', type: 'Made to Order',
        unit: 'Nos', outletPrice: 300, status: 'Active', stockType: 'Recipe',
        addons: [
          { name: 'Extra Ice', price: 0 },
          { name: 'No Ice', price: 0 },
          { name: 'Extra Sugar', price: 0 },
        ]
      },
      {
        sku: 'SM01', name: 'Strawberry Banana Smoothie', category: 'Smoothies', type: 'Made to Order',
        unit: 'Nos', outletPrice: 550, status: 'Active', stockType: 'Recipe',
        addons: [
          { name: 'Protein Powder (1 Scoop)', price: 300 },
          { name: 'Chia Seeds', price: 80 },
          { name: 'Honey Instead of Sugar', price: 100 },
        ]
      },
      {
        sku: 'MS01', name: 'Chocolate Milkshake', category: 'Milkshakes', type: 'Made to Order',
        unit: 'Nos', outletPrice: 600, status: 'Active', stockType: 'Recipe',
        addons: [
          { name: 'Whipped Cream', price: 120 },
          { name: 'Oreo Crumbs', price: 150 },
          { name: 'Vanilla Ice Cream Scoop', price: 150 },
        ]
      },
      {
        sku: 'MJ02', name: 'Virgin Mojito', category: 'Mojitos', type: 'Made to Order',
        unit: 'Nos', outletPrice: 480, status: 'Active', stockType: 'Recipe',
        addons: [
          { name: 'Extra Ice', price: 0 },
          { name: 'No Sugar', price: 0 },
        ]
      },

      // --- NON-INVENTORY (No Recipe, Unlimited Stock) ---
      {
        sku: 'NI01', name: 'Extra Cheese Topping', category: 'Extras', type: 'Made to Order',
        unit: 'Nos', outletPrice: 150, status: 'Active', stockType: 'Non-Inventory',
        addons: []
      },
      {
        sku: 'NI02', name: 'Paper Bag (Large)', category: 'Extras', type: 'Made to Order',
        unit: 'Nos', outletPrice: 50, status: 'Active', stockType: 'Non-Inventory',
        addons: []
      },
      {
        sku: 'NI03', name: 'Special Gift Wrapping', category: 'Extras', type: 'Made to Order',
        unit: 'Nos', outletPrice: 200, status: 'Active', stockType: 'Non-Inventory',
        addons: []
      },

      // --- FINISHED GOODS (Inventory tracked, no recipe) ---
      {
        sku: 'FG01', name: 'Blackforest Cake (Slice)', category: 'Desserts', type: 'Finished Good',
        unit: 'Nos', outletPrice: 500, status: 'Active', stockType: 'Inventory',
        threshold: 5, addons: []
      },
      {
        sku: 'FG02', name: 'Mineral Water Bottle', category: 'General', type: 'Finished Good',
        unit: 'Bottles', outletPrice: 120, status: 'Active', stockType: 'Inventory',
        threshold: 20, addons: []
      },
    ]);
    console.log('✅ Products seeded');

    // ========================================
    // 9. PRODUCT VARIANTS
    // ========================================
    const productVariants = await ProductVariant.insertMany([
      // Mango Juice variants
      { productId: products[0]._id, name: 'Small', sellingPrice: 350, status: 'Active' },
      { productId: products[0]._id, name: 'Large', sellingPrice: 500, status: 'Active' },
      // Avocado Juice variants
      { productId: products[1]._id, name: 'Small', sellingPrice: 450, status: 'Active' },
      { productId: products[1]._id, name: 'Large', sellingPrice: 600, status: 'Active' },
      // Passion Fruit variants
      { productId: products[2]._id, name: 'Small', sellingPrice: 400, status: 'Active' },
      { productId: products[2]._id, name: 'Large', sellingPrice: 550, status: 'Active' },
      // Watermelon variants
      { productId: products[3]._id, name: 'Small', sellingPrice: 300, status: 'Active' },
      { productId: products[3]._id, name: 'Large', sellingPrice: 420, status: 'Active' },
      // Smoothie variants
      { productId: products[4]._id, name: 'Regular', sellingPrice: 550, status: 'Active' },
      { productId: products[4]._id, name: 'Large', sellingPrice: 700, status: 'Active' },
      // Milkshake variants
      { productId: products[5]._id, name: 'Regular', sellingPrice: 600, status: 'Active' },
      { productId: products[5]._id, name: 'Large', sellingPrice: 750, status: 'Active' },
      // Mojito variants
      { productId: products[6]._id, name: 'Regular', sellingPrice: 480, status: 'Active' },
      { productId: products[6]._id, name: 'Large', sellingPrice: 620, status: 'Active' },
    ]);
    console.log('✅ Product Variants seeded');

    // ========================================
    // 10. RECIPES
    // ========================================
    await Recipe.insertMany([
      // Mango Juice - Small
      {
        productId: products[0]._id, productName: 'Mango Juice', variant: 'Small',
        ingredients: [
          { rawMaterialId: 'RM-MNG', name: 'Mango', quantity: 200, unit: 'g' },
          { rawMaterialId: 'RM-SUG', name: 'Sugar', quantity: 30, unit: 'g' },
          { rawMaterialId: 'RM-WAT', name: 'Purified Water', quantity: 150, unit: 'ml' },
          { rawMaterialId: 'RM-ICE', name: 'Ice Cubes', quantity: 100, unit: 'g' },
        ]
      },
      // Mango Juice - Large
      {
        productId: products[0]._id, productName: 'Mango Juice', variant: 'Large',
        ingredients: [
          { rawMaterialId: 'RM-MNG', name: 'Mango', quantity: 350, unit: 'g' },
          { rawMaterialId: 'RM-SUG', name: 'Sugar', quantity: 50, unit: 'g' },
          { rawMaterialId: 'RM-WAT', name: 'Purified Water', quantity: 250, unit: 'ml' },
          { rawMaterialId: 'RM-ICE', name: 'Ice Cubes', quantity: 150, unit: 'g' },
        ]
      },
      // Avocado Juice - Small
      {
        productId: products[1]._id, productName: 'Avocado Juice', variant: 'Small',
        ingredients: [
          { rawMaterialId: 'RM-AVO', name: 'Avocado', quantity: 150, unit: 'g' },
          { rawMaterialId: 'RM-MLK', name: 'Fresh Milk', quantity: 100, unit: 'ml' },
          { rawMaterialId: 'RM-SUG', name: 'Sugar', quantity: 30, unit: 'g' },
          { rawMaterialId: 'RM-ICE', name: 'Ice Cubes', quantity: 100, unit: 'g' },
        ]
      },
      // Avocado Juice - Large
      {
        productId: products[1]._id, productName: 'Avocado Juice', variant: 'Large',
        ingredients: [
          { rawMaterialId: 'RM-AVO', name: 'Avocado', quantity: 250, unit: 'g' },
          { rawMaterialId: 'RM-MLK', name: 'Fresh Milk', quantity: 180, unit: 'ml' },
          { rawMaterialId: 'RM-SUG', name: 'Sugar', quantity: 50, unit: 'g' },
          { rawMaterialId: 'RM-ICE', name: 'Ice Cubes', quantity: 150, unit: 'g' },
        ]
      },
      // Passion Fruit - Small
      {
        productId: products[2]._id, productName: 'Passion Fruit Juice', variant: 'Small',
        ingredients: [
          { rawMaterialId: 'RM-PAS', name: 'Passion Fruit', quantity: 120, unit: 'g' },
          { rawMaterialId: 'RM-SUG', name: 'Sugar', quantity: 40, unit: 'g' },
          { rawMaterialId: 'RM-WAT', name: 'Purified Water', quantity: 200, unit: 'ml' },
          { rawMaterialId: 'RM-ICE', name: 'Ice Cubes', quantity: 100, unit: 'g' },
        ]
      },
      // Watermelon - Small
      {
        productId: products[3]._id, productName: 'Watermelon Juice', variant: 'Small',
        ingredients: [
          { rawMaterialId: 'RM-WTM', name: 'Watermelon', quantity: 300, unit: 'g' },
          { rawMaterialId: 'RM-SUG', name: 'Sugar', quantity: 20, unit: 'g' },
          { rawMaterialId: 'RM-ICE', name: 'Ice Cubes', quantity: 100, unit: 'g' },
        ]
      },
      // Strawberry Banana Smoothie - Regular
      {
        productId: products[4]._id, productName: 'Strawberry Banana Smoothie', variant: 'Regular',
        ingredients: [
          { rawMaterialId: 'RM-STR', name: 'Strawberry', quantity: 100, unit: 'g' },
          { rawMaterialId: 'RM-BAN', name: 'Banana', quantity: 100, unit: 'g' },
          { rawMaterialId: 'RM-YGT', name: 'Yogurt', quantity: 80, unit: 'g' },
          { rawMaterialId: 'RM-MLK', name: 'Fresh Milk', quantity: 100, unit: 'ml' },
          { rawMaterialId: 'RM-HNY', name: 'Honey', quantity: 20, unit: 'ml' },
          { rawMaterialId: 'RM-ICE', name: 'Ice Cubes', quantity: 100, unit: 'g' },
        ]
      },
      // Chocolate Milkshake - Regular
      {
        productId: products[5]._id, productName: 'Chocolate Milkshake', variant: 'Regular',
        ingredients: [
          { rawMaterialId: 'RM-MLK', name: 'Fresh Milk', quantity: 200, unit: 'ml' },
          { rawMaterialId: 'RM-CHO', name: 'Chocolate Syrup', quantity: 50, unit: 'ml' },
          { rawMaterialId: 'RM-SUG', name: 'Sugar', quantity: 30, unit: 'g' },
          { rawMaterialId: 'RM-ICE', name: 'Ice Cubes', quantity: 150, unit: 'g' },
        ]
      },
      // Virgin Mojito - Regular
      {
        productId: products[6]._id, productName: 'Virgin Mojito', variant: 'Regular',
        ingredients: [
          { rawMaterialId: 'RM-LMN', name: 'Lime/Lemon', quantity: 50, unit: 'g' },
          { rawMaterialId: 'RM-MNT', name: 'Fresh Mint Leaves', quantity: 10, unit: 'g' },
          { rawMaterialId: 'RM-SUG', name: 'Sugar', quantity: 30, unit: 'g' },
          { rawMaterialId: 'RM-WAT', name: 'Purified Water', quantity: 200, unit: 'ml' },
          { rawMaterialId: 'RM-ICE', name: 'Ice Cubes', quantity: 200, unit: 'g' },
        ]
      },
    ]);
    console.log('✅ Recipes seeded');

    // ========================================
    // 11. CUSTOMERS
    // ========================================
    await Customer.insertMany([
      { customerCode: 'CUST-001', name: 'Walk-In Customer', mobile: '0000000000', email: 'walkin@juicebar.com', address: 'N/A', loyaltyPoints: 0, status: 'Active' },
      { customerCode: 'CUST-002', name: 'Nimal Perera', mobile: '0712345678', email: 'nimal@example.com', address: '123 Galle Road, Colombo 03', loyaltyPoints: 250, status: 'Active' },
      { customerCode: 'CUST-003', name: 'Kamala Silva', mobile: '0778899001', email: 'kamala@example.com', address: '45 Kandy Road, Kadawatha', loyaltyPoints: 180, status: 'Active' },
      { customerCode: 'CUST-004', name: 'Dilshan Fernando', mobile: '0765432109', email: 'dilshan@example.com', address: '78 Beach Road, Negombo', loyaltyPoints: 520, status: 'Active' },
      { customerCode: 'CUST-005', name: 'Sachini Jayawardena', mobile: '0711112222', email: 'sachini@example.com', address: '22 Temple Road, Kandy', loyaltyPoints: 90, status: 'Active' },
    ]);
    console.log('✅ Customers seeded');

    // ========================================
    // 12. INVENTORY ITEMS & BRANCH INVENTORY
    // ========================================
    const inventoryItems = rawMaterials.map(rm => ({
      sku: rm.sku, name: rm.name, unit: rm.unit, type: 'Raw Material'
    }));
    // Add finished goods to inventory items
    inventoryItems.push({ sku: 'FG01', name: 'Blackforest Cake (Slice)', unit: 'Nos', type: 'Product' });
    inventoryItems.push({ sku: 'FG02', name: 'Mineral Water Bottle', unit: 'Bottles', type: 'Product' });
    await InventoryItem.insertMany(inventoryItems);

    // Colombo Branch Inventory (well stocked)
    const colomboInventory = rawMaterials.map(rm => ({
      branch: 'Colombo 07', sku: rm.sku, name: rm.name, category: rm.category,
      unit: rm.unit, quantity: 10000, minStockLevel: rm.minStockLevel,
      lastRestocked: new Date(), status: 'In Stock'
    }));
    // Add finished goods to branch inventory
    colomboInventory.push({
      branch: 'Colombo 07', sku: 'FG01', name: 'Blackforest Cake (Slice)', category: 'Desserts',
      unit: 'Nos', quantity: 15, minStockLevel: 5, lastRestocked: new Date(), status: 'In Stock'
    });
    colomboInventory.push({
      branch: 'Colombo 07', sku: 'FG02', name: 'Mineral Water Bottle', category: 'General',
      unit: 'Bottles', quantity: 50, minStockLevel: 20, lastRestocked: new Date(), status: 'In Stock'
    });
    await BranchInventory.insertMany(colomboInventory);

    // Kandy Branch Inventory (some items low stock)
    const kandyInventory = rawMaterials.map(rm => ({
      branch: 'Kandy Branch', sku: rm.sku, name: rm.name, category: rm.category,
      unit: rm.unit, quantity: Math.round(Math.random() * 3000 + 500),
      minStockLevel: rm.minStockLevel, lastRestocked: new Date(),
      status: 'In Stock'
    }));
    await BranchInventory.insertMany(kandyInventory);

    console.log('✅ Inventory seeded');

    // ========================================
    // DONE!
    // ========================================
    return NextResponse.json({ 
      message: '🎉 Database seeded successfully!',
      summary: {
        users: 5,
        branches: 3,
        categories: categories.length,
        suppliers: 4,
        addons: 12,
        rawMaterials: rawMaterials.length,
        products: products.length,
        productVariants: productVariants.length,
        recipes: 9,
        customers: 5,
        branchInventory: colomboInventory.length + kandyInventory.length,
      },
      logins: {
        superAdmin: { email: 'superadmin@juicebar.com', password: 'admin123' },
        admin: { email: 'admin@juicebar.com', password: 'admin123' },
        branchManager: { email: 'manager@juicebar.com', password: 'manager123' },
        cashier: { email: 'cashier@juicebar.com', password: 'cashier123' },
      },
      stockTypes: {
        recipeProducts: '7 (Mango, Avocado, Passion, Watermelon, Smoothie, Milkshake, Mojito)',
        nonInventory: '3 (Extra Cheese, Paper Bag, Gift Wrapping) — ∞ unlimited stock',
        inventoryProducts: '2 (Blackforest Cake, Mineral Water) — tracked via PO/GRN',
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Seeding Error:', error);
    return NextResponse.json({ error: 'Failed to seed database', details: error.message }, { status: 500 });
  }
}
