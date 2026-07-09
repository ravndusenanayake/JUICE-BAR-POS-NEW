import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import BranchInventory from '@/database/models/BranchInventory';
import Product from '@/database/models/Product';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    const query = branch && branch !== "All Branches" ? { branch } : {};

    // Fetch branch inventory
    const inventory = await BranchInventory.find(query).lean();
    
    // To present the data nicely to the frontend, we need the Product details (Name, SKU, Unit, Category)
    // We'll fetch all products to map them.
    const products = await Product.find({}).lean();
    const productMap = products.reduce((acc: any, p: any) => {
      acc[p.sku] = p;
      return acc;
    }, {});

    // Map inventory data with product details
    const enrichedInventory = inventory.map((item: any) => {
      const product = productMap[item.sku] || {};
      return {
        _id: item._id,
        sku: item.sku,
        productName: product.name || 'Unknown Product',
        category: product.category || 'Uncategorized',
        type: product.type || 'Product',
        unit: product.unit || 'Nos',
        branch: item.branch,
        quantity: item.quantity,
        costPrice: product.cost || 0,
        lastUpdated: item.lastUpdated,
      };
    });

    return NextResponse.json(enrichedInventory, { status: 200 });
  } catch (error: any) {
    console.error('GET Inventory Stock Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
