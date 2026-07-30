import connectToDatabase from '@/database/mongoose';
import Category, { ICategory } from '@/database/models/Category';

export const categoryService = {
  /**
   * Fetch all categories
   */
  async getAllCategories() {
    await connectToDatabase();
    
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(categories));
  },

  /**
   * Fetch only active categories (useful for dropdowns when creating products)
   */
  async getActiveCategories() {
    await connectToDatabase();
    
    const categories = await Category.find({ status: 'Active' }).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(categories));
  },

  /**
   * Create a new category
   */
  async createCategory(data: { name: string; description?: string; status?: 'Active' | 'Inactive' }) {
    await connectToDatabase();
    
    // Check if name already exists to prevent duplicate key errors throwing generic 500s
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });
    if (existing) {
      throw new Error(`Category with name "${data.name}" already exists.`);
    }

    const newCategory = new Category(data);
    await newCategory.save();
    
    return JSON.parse(JSON.stringify(newCategory));
  },

  /**
   * Update a category (Edit details or change Status)
   */
  async updateCategory(id: string, data: Partial<ICategory>) {
    await connectToDatabase();
    
    if (data.name) {
      const existing = await Category.findOne({ 
        name: { $regex: new RegExp(`^${data.name}$`, 'i') }, 
        _id: { $ne: id } 
      });
      if (existing) {
        throw new Error(`Category with name "${data.name}" already exists.`);
      }
    }

    const category = await Category.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!category) {
      throw new Error('Category not found');
    }
    
    return JSON.parse(JSON.stringify(category));
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: string) {
    await connectToDatabase();
    
    // Here we should ideally check if any products are using this category before deleting.
    // For now, we allow deletion.
    
    const result = await Category.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Category not found');
    }
    
    return { success: true };
  }
};
