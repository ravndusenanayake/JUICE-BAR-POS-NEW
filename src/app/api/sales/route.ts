import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Sale from '@/database/models/Sale';

// GET all sales
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // We can filter by branch using URL params if needed
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    const query = branch && branch !== "All Branches" ? { branch } : {};

    const sales = await Sale.find(query).sort({ createdAt: -1 }).limit(100);
    
    return NextResponse.json(sales, { status: 200 });
  } catch (error: any) {
    console.error('GET Sales Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST new sale
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
    }

    const newSale = new Sale({
      invoiceNo: body.receiptNumber || `REC-${Date.now()}`,
      branch: body.branch || 'Colombo 07',
      cashier: body.cashier || 'Unknown',
      customer: body.customer || 'Walk-In Customer',
      subtotal: body.subTotal || 0,
      discount: body.discount || 0,
      total: body.total || 0,
      paymentMethod: body.paymentMethod || 'Cash',
      items: body.items, 
      status: 'Completed'
    });

    await newSale.save();

    // -- INVENTORY DEDUCTION LOGIC (MODULE 2.5) --
    try {
      const Recipe = (await import('@/database/models/Recipe')).default;
      const BranchInventory = (await import('@/database/models/BranchInventory')).default;
      const StockLedger = (await import('@/database/models/StockLedger')).default;
      
      for (const item of body.items) {
        // Find Recipe for this product and variant
        // item.productId usually stores SKU or ID, item.variant stores variant name
        const recipe = await Recipe.findOne({ 
          productId: item.productId, 
          variant: item.variant || 'Standard' 
        });

        if (recipe && recipe.ingredients) {
          for (const ingredient of recipe.ingredients) {
            const deductionQty = ingredient.quantity * item.quantity;
            
            // Deduct from BranchInventory
            const inventory = await BranchInventory.findOne({ 
              branch: body.branch || 'Colombo 07', 
              sku: ingredient.rawMaterialId 
            });

            if (inventory) {
              inventory.quantity -= deductionQty;
              
              if (inventory.quantity <= 0) inventory.status = 'Out of Stock';
              else if (inventory.quantity <= inventory.minStockLevel) inventory.status = 'Low Stock';
              else inventory.status = 'In Stock';
              
              await inventory.save();
              
              // Log to StockLedger
              await StockLedger.create({
                branch: body.branch || 'Colombo 07',
                sku: ingredient.rawMaterialId,
                type: 'OUT',
                quantity: deductionQty,
                reference: newSale.invoiceNo,
                remarks: `Sale Deduction (Recipe for ${item.name})`
              });
            }
          }
        }
      }
    } catch (deductionError) {
      console.error('Inventory Deduction Error during Sale:', deductionError);
      // We log but do not block the sale completion response
    }
    // --------------------------------------------

    return NextResponse.json(newSale, { status: 201 });
  } catch (error: any) {
    console.error('POST Sale Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
