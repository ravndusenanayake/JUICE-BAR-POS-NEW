import { NextResponse } from 'next/server';
import { saleService } from '@/services/sale.service';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const sales = await saleService.getRecentSales(50);
    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { branchId, cashierId, subtotal, discount, total, paymentMethod, items } = body;
    
    // Convert string IDs to ObjectId
    const saleData = {
      branchId: new mongoose.Types.ObjectId(branchId),
      cashierId: new mongoose.Types.ObjectId(cashierId),
      subtotal: Number(subtotal),
      discount: Number(discount) || 0,
      total: Number(total),
      paymentMethod,
    };
    
    const itemsData = items.map((item: any) => ({
      variantId: new mongoose.Types.ObjectId(item.variantId),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
      addOns: []
    }));

    const newSale = await saleService.processCheckout(saleData, itemsData);
    
    return NextResponse.json(newSale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
