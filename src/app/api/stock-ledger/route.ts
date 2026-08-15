import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import StockLedger from '@/database/models/StockLedger';
import RawMaterial from '@/database/models/RawMaterial';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    const query: any = {};
    if (branch && branch !== 'All Branches') {
      query.branch = branch;
    }

    const ledger = await StockLedger.find(query).sort({ date: -1 }).limit(200).lean();
    
    const materials = await RawMaterial.find({}, 'sku name unit').lean();
    const materialMap = new Map();
    materials.forEach((m: any) => materialMap.set(m.sku, { name: m.name, unit: m.unit }));

    const enrichedLedger = ledger.map((entry: any) => {
      const mat = materialMap.get(entry.sku);
      return {
        ...entry,
        rawMaterialName: mat ? mat.name : entry.sku,
        unit: mat ? mat.unit : 'Nos'
      };
    });
    
    return NextResponse.json(enrichedLedger, { status: 200 });
  } catch (error: any) {
    console.error('GET StockLedger Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
