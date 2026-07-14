import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import BranchInventory from '@/database/models/BranchInventory';
import RawMaterial from '@/database/models/RawMaterial';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    
    let query: any = {};
    if (branch && branch !== 'All Branches') {
      query.branch = branch;
    }
    
    const inventory = await BranchInventory.find(query).lean();
    const rawMaterials = await RawMaterial.find({ status: { $in: ['Active', true] } }).lean();
    
    // Also fetch Finished Goods from Products
    const mongoose = require('mongoose');
    const Product = mongoose.models.Product || mongoose.model('Product');
    const finishedGoods = await Product.find({ type: 'Finished Good', status: 'Active' }).lean();
    
    // Combine Raw Materials and Finished Goods
    const allTrackableItems = [...rawMaterials, ...finishedGoods];
    
    const invMap = new Map();
    inventory.forEach(inv => invMap.set(inv.sku, inv));
    
    const mergedList = allTrackableItems.map(item => {
      const invRecord = invMap.get(item.sku);
      const minLevel = item.minStockLevel || item.threshold || 0;
      if (invRecord) {
        return {
           ...invRecord,
           name: item.name,
           minStockLevel: minLevel
        };
      }
      return {
        _id: 'temp-' + item._id,
        sku: item.sku,
        name: item.name,
        category: item.category || 'General',
        unit: item.unit || 'Nos',
        quantity: 0,
        minStockLevel: minLevel,
        branch: branch && branch !== 'All Branches' ? branch : 'All Branches',
        status: minLevel > 0 ? 'Low Stock' : 'Optimal'
      };
    });
    
    mergedList.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json(mergedList, { status: 200 });
  } catch (error: any) {
    console.error('GET BranchInventory Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
