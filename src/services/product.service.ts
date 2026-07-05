import connectToDatabase from '@/database/mongoose';
import Product, { IProduct } from '@/database/models/Product';
import ProductVariant from '@/database/models/ProductVariant';
import Category from '@/database/models/Category';
import mongoose from 'mongoose';

export const productService = {
  /**
   * Fetch all products with their default variants and category.
   */
  async getAllProducts() {
    await connectToDatabase();
    
    // Ensure models are registered
    require('@/database/models/Category');
    require('@/database/models/ProductVariant');

    const products = await Product.find({}).populate('categoryId').lean();
    
    // Fetch variants for these products
    const productIds = products.map(p => p._id);
    const variants = await ProductVariant.find({ productId: { $in: productIds } }).lean();
    
    // Attach variants to products
    const productsWithVariants = products.map(product => {
      return {
        ...product,
        variants: variants.filter(v => v.productId.toString() === product._id.toString())
      };
    });

    return JSON.parse(JSON.stringify(productsWithVariants));
  },

  /**
   * Create a new product and its default variant (e.g. Regular size)
   */
  async createProductWithVariant(
    productData: { sku: string, name: string, categoryId?: string }, 
    variantData: { name: string, sellingPrice: number }
  ) {
    await connectToDatabase();
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const newProduct = new Product(productData);
      await newProduct.save({ session });
      
      const newVariant = new ProductVariant({
        ...variantData,
        productId: newProduct._id
      });
      await newVariant.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      return JSON.parse(JSON.stringify({ ...newProduct.toObject(), variants: [newVariant.toObject()] }));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
};
