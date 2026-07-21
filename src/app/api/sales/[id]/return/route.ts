import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/database/dbConnect";
import Sale from "@/database/models/Sale";
import Recipe from "@/database/models/Recipe";
import BranchInventory from "@/database/models/BranchInventory";
import StockLedger from "@/database/models/StockLedger";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  
  try {
    // Await params object before using its properties in Next.js 15+ API routes
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await req.json();
    const { returnedItems } = body; // Array of items being returned

    if (!returnedItems || returnedItems.length === 0) {
      return NextResponse.json({ error: "No items provided for return" }, { status: 400 });
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (sale.status === 'Voided') {
      return NextResponse.json({ error: "Cannot return a voided sale" }, { status: 400 });
    }

    let totalRefundAmount = 0;

    // Process each returned item
    for (const returnItem of returnedItems) {
      // Find the original item in the sale to verify
      const originalItem = sale.items.find((item: any) => item.productId === returnItem.productId && item.name === returnItem.name);
      if (!originalItem) continue;

      totalRefundAmount += returnItem.refundAmount;

      // Handle Inventory based on action
      if (returnItem.action === 'Restock') {
        const recipe = await Recipe.findOne({ productId: returnItem.productId });

        if (recipe && recipe.ingredients) {
          // It's a recipe-based product. Restocking it means returning raw materials (rare, but possible if mistake was caught early)
          for (const ingredient of recipe.ingredients) {
            const addedQty = ingredient.quantity * returnItem.quantity;
            const inventory = await BranchInventory.findOne({ branch: sale.branch, sku: ingredient.rawMaterialId });
            if (inventory) {
              inventory.quantity += addedQty;
              if (inventory.quantity <= 0) inventory.status = 'Out of Stock';
              else if (inventory.quantity <= inventory.minStockLevel) inventory.status = 'Low Stock';
              else inventory.status = 'In Stock';
              await inventory.save();

              await StockLedger.create({
                branch: sale.branch,
                sku: ingredient.rawMaterialId,
                type: 'IN',
                quantity: addedQty,
                reference: `RET-${sale.invoiceNo}`,
                remarks: `Restocked Return (${returnItem.name})`
              });
            }
          }
        } else {
          // Direct product
          const inventory = await BranchInventory.findOne({ branch: sale.branch, sku: returnItem.productId });
          if (inventory) {
            inventory.quantity += returnItem.quantity;
            if (inventory.quantity <= 0) inventory.status = 'Out of Stock';
            else if (inventory.quantity <= (inventory.minStockLevel || 0)) inventory.status = 'Low Stock';
            else inventory.status = 'In Stock';
            await inventory.save();

            await StockLedger.create({
              branch: sale.branch,
              sku: returnItem.productId,
              type: 'IN',
              quantity: returnItem.quantity,
              reference: `RET-${sale.invoiceNo}`,
              remarks: `Restocked Return`
            });
          }
        }
      } else if (returnItem.action === 'Wastage') {
        // Stock is NOT added back. It remains deducted, acting as implicit wastage.
        // We will skip explicit Wastage document creation to avoid Object ID reference errors.
      }
    }

    // Update Sale document
    if (!sale.returnedItems) {
      sale.returnedItems = [];
    }
    sale.returnedItems.push(...returnedItems);

    // Determine new status
    const totalPreviouslyRefunded = sale.returnedItems.reduce((acc: number, curr: any) => acc + curr.refundAmount, 0);
    // Use an epsilon for float comparison
    if (totalPreviouslyRefunded >= sale.total - 0.01) {
      sale.status = 'Refunded';
    } else {
      sale.status = 'Partially Refunded';
    }

    await sale.save();

    return NextResponse.json({ success: true, sale });

  } catch (error: any) {
    console.error("Return error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
