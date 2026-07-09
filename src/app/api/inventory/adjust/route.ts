import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import BranchInventory from '@/database/models/BranchInventory';
import StockLedger from '@/database/models/StockLedger';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const { branch, sku, quantity, type, reference, remarks } = body;

    if (!branch || !sku || !quantity || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find or create branch inventory record
    let inventory = await BranchInventory.findOne({ branch, sku });
    if (!inventory) {
      inventory = new BranchInventory({
        branch,
        sku,
        quantity: 0
      });
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
      sku,
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
