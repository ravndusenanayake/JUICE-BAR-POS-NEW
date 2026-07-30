import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import StockTransfer from '@/database/models/StockTransfer';
import Branch from '@/database/models/Branch';
import BranchInventory from '@/database/models/BranchInventory';
import StockLedger from '@/database/models/StockLedger';
import InventoryItem from '@/database/models/InventoryItem';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    
    let query: any = {};
    if (branch && branch !== 'All Branches') {
      const branchDoc = await Branch.findOne({ name: branch });
      if (branchDoc) {
        query.$or = [
          { sourceBranchId: branchDoc._id },
          { destinationBranchId: branchDoc._id }
        ];
      }
    }
    
    const transfers = await StockTransfer.find(query)
      .populate('sourceBranchId', 'name')
      .populate('destinationBranchId', 'name')
      .populate('items.productId', 'name sku unit')
      .sort({ createdAt: -1 });
      
    const mappedTransfers = transfers.map(t => {
      const sourceName = t.sourceBranchId ? (t.sourceBranchId as any).name : 'Unknown';
      const destName = t.destinationBranchId ? (t.destinationBranchId as any).name : 'Unknown';
      
      return {
        _id: t._id,
        transferNumber: t.transferNo,
        sourceBranch: sourceName,
        destinationBranch: destName,
        createdDate: t.createdAt,
        status: t.status,
        items: t.items.map((i: any) => ({
          productId: i.productId ? i.productId._id : null,
          rawMaterialName: i.productId ? i.productId.name : 'Unknown',
          sku: i.productId ? i.productId.sku : 'Unknown',
          unit: i.productId ? i.productId.unit : 'Unknown',
          quantity: i.quantity
        }))
      };
    });

    return NextResponse.json(mappedTransfers, { status: 200 });
  } catch (error: any) {
    console.error('GET StockTransfers Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const sourceBranchDoc = await Branch.findOne({ name: body.sourceBranch });
    const destBranchDoc = await Branch.findOne({ name: body.destinationBranch });
    
    if (!sourceBranchDoc || !destBranchDoc) {
      return NextResponse.json({ error: 'Invalid branches specified' }, { status: 400 });
    }

    const transferItems = [];
    for (const item of body.items) {
      let invItem = await InventoryItem.findOne({ sku: item.sku });
      if (!invItem) {
        invItem = new InventoryItem({ sku: item.sku, name: item.rawMaterialName, unit: item.unit || 'Nos', type: 'Raw Material' });
        await invItem.save();
      }
      
      transferItems.push({
        productId: invItem._id,
        quantity: item.quantity
      });
    }

    const transfer = new StockTransfer({
      transferNo: body.transferNumber,
      sourceBranchId: sourceBranchDoc._id,
      destinationBranchId: destBranchDoc._id,
      status: body.status || 'Pending Approval',
      items: transferItems
    });
    
    await transfer.save();
    
    return NextResponse.json(transfer, { status: 201 });
  } catch (error: any) {
    console.error('POST StockTransfer Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, status } = body;
    
    if (!id || !status) {
       return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 });
    }
    
    const transfer = await StockTransfer.findById(id)
      .populate('sourceBranchId')
      .populate('destinationBranchId')
      .populate('items.productId');
      
    if (!transfer) {
       return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
    
    // If transitioning to Approved, deduct from source branch
    if (status === 'Approved' && transfer.status !== 'Approved') {
      const sourceBranchName = (transfer.sourceBranchId as any).name;
      for (const item of transfer.items) {
        if (!item.productId) continue;
        const sku = (item.productId as any).sku;
        const inventory = await BranchInventory.findOne({ branch: sourceBranchName, sku });
        if (inventory) {
          inventory.quantity -= Number(item.quantity);
          if (inventory.quantity <= 0) inventory.status = 'Out of Stock';
          else if (inventory.quantity <= (inventory.minStockLevel || 0)) inventory.status = 'Low Stock';
          else inventory.status = 'In Stock';
          await inventory.save();
          
          await StockLedger.create({
            branch: sourceBranchName,
            sku,
            type: 'OUT',
            quantity: Number(item.quantity),
            reference: transfer.transferNo,
            remarks: 'Stock Transfer Out to ' + (transfer.destinationBranchId as any).name,
            date: new Date()
          });
        }
      }
    }
    
    // If transitioning to Completed, add to destination branch
    if (status === 'Completed' && transfer.status !== 'Completed') {
      const destBranchName = (transfer.destinationBranchId as any).name;
      for (const item of transfer.items) {
        if (!item.productId) continue;
        const sku = (item.productId as any).sku;
        let inventory = await BranchInventory.findOne({ branch: destBranchName, sku });
        if (!inventory) {
          inventory = new BranchInventory({
            branch: destBranchName,
            sku,
            name: (item.productId as any).name,
            category: 'General',
            unit: (item.productId as any).unit || 'Nos',
            quantity: 0
          });
        }
        inventory.quantity += Number(item.quantity);
        inventory.status = inventory.quantity > (inventory.minStockLevel || 0) ? 'In Stock' : 'Low Stock';
        await inventory.save();
        
        await StockLedger.create({
          branch: destBranchName,
          sku,
          type: 'IN',
          quantity: Number(item.quantity),
          reference: transfer.transferNo,
          remarks: 'Stock Transfer In from ' + (transfer.sourceBranchId as any).name,
          date: new Date()
        });
      }
    }
    
    transfer.status = status;
    await transfer.save();
    
    return NextResponse.json(transfer, { status: 200 });
  } catch (error: any) {
    console.error('PUT StockTransfer Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
