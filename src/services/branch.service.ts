import connectToDatabase from '@/database/mongoose';
import Branch, { IBranch } from '@/database/models/Branch';

export const branchService = {
  /**
   * Fetch all branches
   */
  async getAllBranches() {
    await connectToDatabase();
    const branches = await Branch.find({})
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(branches));
  },

  /**
   * Create a new branch
   */
  async createBranch(data: Partial<IBranch>) {
    await connectToDatabase();
    
    const existing = await Branch.findOne({ code: data.code?.toUpperCase() });
    if (existing) {
      throw new Error(`Branch with code "${data.code}" already exists.`);
    }

    const newBranch = new Branch({
      ...data,
      code: data.code?.toUpperCase()
    });
    
    await newBranch.save();
    return JSON.parse(JSON.stringify(newBranch));
  },

  /**
   * Update a branch
   */
  async updateBranch(id: string, data: Partial<IBranch>) {
    await connectToDatabase();
    
    if (data.code) {
      const existing = await Branch.findOne({ 
        code: data.code.toUpperCase(), 
        _id: { $ne: id } 
      });
      if (existing) {
        throw new Error(`Branch with code "${data.code}" already exists.`);
      }
      data.code = data.code.toUpperCase();
    }

    const branch = await Branch.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!branch) {
      throw new Error('Branch not found');
    }
    
    return JSON.parse(JSON.stringify(branch));
  },

  /**
   * Delete a branch
   */
  async deleteBranch(id: string) {
    await connectToDatabase();
    
    const branch = await Branch.findById(id);
    if (!branch) throw new Error('Branch not found');
    
    // In the future, check if Users or Inventory are assigned to this branch before deleting
    
    await Branch.findByIdAndDelete(id);
    return { success: true };
  }
};
