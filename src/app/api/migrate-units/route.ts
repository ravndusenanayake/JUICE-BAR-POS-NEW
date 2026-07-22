import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/database/mongoose';
import RawMaterial from '@/database/models/RawMaterial';
import InventoryItem from '@/database/models/InventoryItem';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Convert RawMaterials
    const rmToUpdate = await RawMaterial.find({ unit: { $regex: /^kg$/i } });
    for (const rm of rmToUpdate) {
      rm.unit = 'g';
      rm.minStockLevel = (rm.minStockLevel || 0) * 1000;
      rm.currentStock = (rm.currentStock || 0) * 1000;
      await rm.save();
    }

    const rmToUpdateL = await RawMaterial.find({ unit: { $regex: /^l$/i } });
    for (const rm of rmToUpdateL) {
      rm.unit = 'ml';
      rm.minStockLevel = (rm.minStockLevel || 0) * 1000;
      rm.currentStock = (rm.currentStock || 0) * 1000;
      await rm.save();
    }

    // Convert InventoryItems
    const invToUpdate = await InventoryItem.find({ unit: { $regex: /^kg$/i } });
    for (const inv of invToUpdate) {
      inv.unit = 'g';
      await inv.save();
    }

    return NextResponse.json({ message: 'Migration successful', updatedKg: rmToUpdate.length, updatedL: rmToUpdateL.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
