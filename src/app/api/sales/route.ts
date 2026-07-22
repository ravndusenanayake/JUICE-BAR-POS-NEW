import { NextResponse } from 'next/server';
import connectToDatabase from '@/database/mongoose';
import Sale from '@/database/models/Sale';
import BranchInventory from '@/database/models/BranchInventory';
import StockLedger from '@/database/models/StockLedger';

// GET all sales
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // We can filter by branch using URL params if needed
    const { searchParams } = new URL(req.url);
    const kitchenStatus = searchParams.get('kitchenStatus');
    const branch = searchParams.get('branch');

    const query: any = branch && branch !== "All Branches" ? { branch } : {};
    
    if (kitchenStatus) {
      if (kitchenStatus.includes(',')) {
        query.kitchenStatus = { $in: kitchenStatus.split(',') };
      } else {
        query.kitchenStatus = kitchenStatus;
      }
    }

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
      orderType: body.orderType || 'Takeaway',
      subtotal: body.subTotal || 0,
      discount: body.discount || 0,
      total: body.total || 0,
      paymentMethod: body.paymentMethod || 'Cash',
      items: body.items, 
      status: 'Completed',
      kitchenStatus: 'Pending',
      shiftId: body.shiftId
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
        let recipe = await Recipe.findOne({ 
          productId: item.productId, 
          variant: item.variant || 'Standard' 
        });

        // Fallback: if specific variant recipe is missing, try to find any recipe for this product
        if (!recipe) {
          recipe = await Recipe.findOne({ productId: item.productId });
        }

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
        } else {
          // Direct Product (Non-Recipe), deduct the item itself
          const itemSku = item.sku || item.productId;
          const inventory = await BranchInventory.findOne({ 
            branch: body.branch || 'Colombo 07', 
            $or: [{ sku: itemSku }, { name: new RegExp('^' + itemSku + '$', 'i') }] 
          });

          if (inventory) {
            inventory.quantity -= item.quantity;
            
            if (inventory.quantity <= 0) inventory.status = 'Out of Stock';
            else if (inventory.quantity <= (inventory.minStockLevel || 0)) inventory.status = 'Low Stock';
            else inventory.status = 'In Stock';
            
            await inventory.save();
            
            await StockLedger.create({
              branch: body.branch || 'Colombo 07',
              sku: inventory.sku,
              type: 'OUT',
              quantity: item.quantity,
              reference: newSale.invoiceNo,
              remarks: `Sale Deduction (Direct Product ${item.name})`
            });
          }
        }
      }
    } catch (deductionError) {
      console.error('Inventory Deduction Error during Sale:', deductionError);
      // We log but do not block the sale completion response
    }
    // --------------------------------------------

    // -- LOYALTY POINTS LOGIC --
    try {
      if (body.customerId) {
        const Customer = (await import('@/database/models/Customer')).default;
        const customer = await Customer.findById(body.customerId);
        if (customer) {
          // Add total spend
          customer.totalSpend = (customer.totalSpend || 0) + newSale.total;
          
          // Deduct redeemed points if any
          const redeemedPoints = body.redeemedPoints || 0;
          customer.loyaltyPoints = Math.max(0, (customer.loyaltyPoints || 0) - redeemedPoints);
          
          // Earn new points (1 point per Rs. 100 spent of the final total paid)
          const earnedPoints = Math.floor(newSale.total / 100);
          customer.loyaltyPoints += earnedPoints;
          
          await customer.save();
        }
      }
    } catch (loyaltyError) {
      console.error('Loyalty Update Error:', loyaltyError);
    }
    // --------------------------------------------

    return NextResponse.json(newSale, { status: 201 });
  } catch (error: any) {
    console.error('POST Sale Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, isReturn, returnedItems, kitchenStatus } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing sale ID' }, { status: 400 });
    }

    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

    // Handle KDS Update
    if (kitchenStatus) {
      sale.kitchenStatus = kitchenStatus;
      await sale.save();
      return NextResponse.json(sale, { status: 200 });
    }

    // Handle Return
    if (!isReturn || !returnedItems) {
      return NextResponse.json({ error: 'Missing return data' }, { status: 400 });
    }

    // Deduct from total, update status, append returnedItems
    let returnTotal = 0;
    returnedItems.forEach((ri: any) => returnTotal += ri.refundAmount);

    sale.returnedItems = [...(sale.returnedItems || []), ...returnedItems];
    sale.total -= returnTotal;
    
    // Check if fully refunded
    const originalTotal = sale.subtotal - sale.discount;
    if (sale.total <= 0) sale.status = 'Refunded';
    else sale.status = 'Partially Refunded';

    await sale.save();

    // Restock logic
    for (const ri of returnedItems) {
      if (ri.action === 'Restock') {
        // Simple restock for direct items (mocked for simplicity here, 
        // real system would check recipes again if needed)
        const inventory = await BranchInventory.findOne({
          branch: sale.branch,
          $or: [{ sku: ri.productId }, { name: new RegExp('^' + ri.productId + '$', 'i') }]
        });
        if (inventory) {
          inventory.quantity += ri.quantity;
          inventory.status = inventory.quantity > (inventory.minStockLevel || 0) ? 'In Stock' : 'Low Stock';
          await inventory.save();

          await StockLedger.create({
            branch: sale.branch,
            sku: inventory.sku,
            type: 'IN',
            quantity: ri.quantity,
            reference: sale.invoiceNo,
            remarks: 'Return Restock'
          });
        }
      }
    }

    return NextResponse.json(sale, { status: 200 });
  } catch (error: any) {
    console.error('PUT Sale Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
