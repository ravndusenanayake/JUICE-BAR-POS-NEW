import mongoose from 'mongoose';
import connectToDatabase from '@/database/mongoose';
import Sale, { ISale } from '@/database/models/Sale';
import SaleItem, { ISaleItem } from '@/database/models/SaleItem';

export const saleService = {
  /**
   * Get recent sales
   */
  async getRecentSales(limit = 10) {
    await connectToDatabase();
    
    // Ensure models are registered
    require('@/database/models/SaleItem');
    require('@/database/models/User');
    require('@/database/models/Branch');

    const sales = await Sale.find({})
      .sort({ saleDate: -1 })
      .limit(limit)
      .lean();
      
    return JSON.parse(JSON.stringify(sales));
  },

  /**
   * Process a new sale transaction (POS Checkout)
   */
  async processCheckout(
    saleData: Partial<ISale>, 
    itemsData: Partial<ISaleItem>[]
  ) {
    await connectToDatabase();
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Create the Sale record
      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
      const newSale = new Sale({
        ...saleData,
        invoiceNo,
      });
      await newSale.save({ session });
      
      // 2. Create the Sale Items
      const saleItems = itemsData.map(item => ({
        ...item,
        saleId: newSale._id
      }));
      
      await SaleItem.insertMany(saleItems, { session });
      
      // 3. (Optional) Here we would usually reduce BranchStock 
      // by looking up the Recipe for each ProductVariant.
      // This is omitted for brevity in this step but structured to be added easily.
      
      await session.commitTransaction();
      session.endSession();
      
      return JSON.parse(JSON.stringify(newSale));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
};
