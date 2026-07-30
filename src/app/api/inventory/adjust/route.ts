import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import BranchInventory from '@/database/models/BranchInventory';
import StockLedger from '@/database/models/StockLedger';
import RawMaterial from '@/database/models/RawMaterial';
import Product from '@/database/models/Product';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const { branch, sku, quantity, type, reference, remarks } = body;

    if (!branch || !sku || !quantity || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Attempt to find by exact SKU first, then by name (since POs currently pass name as SKU)
    let inventory = await BranchInventory.findOne({ branch, sku });
    if (!inventory) {
      inventory = await BranchInventory.findOne({ branch, name: new RegExp('^' + sku + '$', 'i') });
    }

    let actualSku = sku;
    
    if (!inventory) {
      // If we don't have it in branch inventory, we need to create it.
      // But we need name, category, and unit to satisfy the schema.
      // Let's try to find it in RawMaterials or Products.
      let masterItem = await RawMaterial.findOne({ $or: [{ sku }, { name: new RegExp('^' + sku + '$', 'i') }] });
      
      if (!masterItem) {
        masterItem = await Product.findOne({ $or: [{ sku }, { name: new RegExp('^' + sku + '$', 'i') }] });
      }

      const itemName = masterItem ? masterItem.name : sku;
      const itemCategory = masterItem ? masterItem.category : 'General';
      const itemUnit = masterItem ? masterItem.unit : 'Nos';
      actualSku = masterItem ? masterItem.sku : sku;

      // Double check if we already have it under the actualSku
      inventory = await BranchInventory.findOne({ branch, sku: actualSku });
      
      if (!inventory) {
        inventory = new BranchInventory({
          branch,
          sku: actualSku,
          name: itemName,
          category: itemCategory,
          unit: itemUnit,
          quantity: 0
        });
      }
    } else {
      actualSku = inventory.sku;
    }

    // Update quantity based on type
    const numQuantity = Number(quantity);
    if (type === 'IN' || type === 'GRN') {
      inventory.quantity += numQuantity;
    } else if (type === 'OUT' || type === 'WASTAGE' || type === 'SALE') {
      inventory.quantity -= numQuantity;
    }

    inventory.lastUpdated = new Date();
    await inventory.save();

    // Create a Ledger entry for the audit trail
    const ledgerEntry = new StockLedger({
      branch,
      sku: actualSku,
      type,
      quantity: numQuantity,
      reference: reference || 'Manual Adjustment',
      remarks: remarks || '',
      date: new Date()
    });

    await ledgerEntry.save();

    return NextResponse.json({ message: 'Stock adjusted successfully', inventory }, { status: 200 });
  } catch (error: any) {
    console.error('POST Inventory Adjust Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
