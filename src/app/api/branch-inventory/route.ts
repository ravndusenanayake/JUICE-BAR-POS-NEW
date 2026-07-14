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
    
    const invMap = new Map();
    inventory.forEach(inv => invMap.set(inv.sku, inv));
    
    const mergedList = rawMaterials.map(rm => {
      const invRecord = invMap.get(rm.sku);
      const minLevel = rm.minStockLevel || rm.threshold || 0;
      if (invRecord) {
        return {
           ...invRecord,
           name: rm.name,
           minStockLevel: minLevel
        };
      }
      return {
        _id: 'temp-' + rm._id,
        sku: rm.sku,
        name: rm.name,
        category: rm.category || 'General',
        unit: rm.unit,
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
