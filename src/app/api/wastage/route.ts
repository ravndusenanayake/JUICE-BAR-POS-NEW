import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Wastage from '@/database/models/Wastage';
import Branch from '@/database/models/Branch';
import InventoryItem from '@/database/models/InventoryItem';
import User from '@/database/models/User';
import BranchInventory from '@/database/models/BranchInventory';
import StockLedger from '@/database/models/StockLedger';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    
    let query: any = {};
    if (branch && branch !== 'All Branches') {
      const branchDoc = await Branch.findOne({ name: branch });
      if (branchDoc) {
        query.branchId = branchDoc._id;
      }
    }
    
    const wastages = await Wastage.find(query)
      .populate('branchId', 'name')
      .populate('itemId', 'name sku unit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const mappedWastages = wastages.map(w => ({
      id: w._id,
      branch: w.branchId ? (w.branchId as any).name : 'Unknown',
      item: w.itemId ? { name: (w.itemId as any).name, sku: (w.itemId as any).sku, unit: (w.itemId as any).unit } : null,
      quantity: w.quantity,
      reason: w.reason,
      createdBy: w.createdBy ? (w.createdBy as any).name : 'System',
      createdAt: w.createdAt
    }));

    return NextResponse.json(mappedWastages, { status: 200 });
  } catch (error: any) {
    console.error('GET Wastage Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const { branch, sku, quantity, reason, createdBy } = body;
    
    if (!branch || !sku || !quantity || !reason) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const branchDoc = await Branch.findOne({ name: branch });
    let itemDoc = await InventoryItem.findOne({ sku });
    
    if (!itemDoc) {
      // Find by name if sku fails
      itemDoc = await InventoryItem.findOne({ name: sku });
    }

    if (!branchDoc || !itemDoc) {
      return NextResponse.json({ error: 'Branch or Item not found' }, { status: 404 });
    }

    let userDoc = await User.findOne({ email: createdBy });
    if (!userDoc) {
      userDoc = await User.findOne(); // fallback
    }

    const wastage = new Wastage({
      branchId: branchDoc._id,
      itemId: itemDoc._id,
      quantity,
      reason,
      createdBy: userDoc ? userDoc._id : null
    });
    
    await wastage.save();

    // Adjust Branch Inventory directly
    const inventory = await BranchInventory.findOne({ branch, sku: itemDoc.sku });
    if (inventory) {
      inventory.quantity -= Number(quantity);
      if (inventory.quantity <= 0) inventory.status = 'Out of Stock';
      else if (inventory.quantity <= (inventory.minStockLevel || 0)) inventory.status = 'Low Stock';
      else inventory.status = 'In Stock';
      await inventory.save();
      
      await StockLedger.create({
        branch,
        sku: itemDoc.sku,
        type: 'WASTAGE',
        quantity: Number(quantity),
        reference: 'Wastage Entry',
        remarks: reason || 'Wastage recorded',
        date: new Date()
      });
    }
    
    return NextResponse.json(wastage, { status: 201 });
  } catch (error: any) {
    console.error('POST Wastage Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
