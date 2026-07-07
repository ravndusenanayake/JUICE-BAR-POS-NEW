import connectToDatabase from '@/database/mongoose';
import AddOn, { IAddOn } from '@/database/models/AddOn';

export const addonService = {
  async getAllAddOns() {
    await connectToDatabase();
    const addons = await AddOn.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(addons));
  },

  async createAddOn(data: Partial<IAddOn>) {
    await connectToDatabase();
    
    const existing = await AddOn.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });
    if (existing) {
      throw new Error(`Add-On with name "${data.name}" already exists.`);
    }

    const newAddOn = new AddOn(data);
    await newAddOn.save();
    return JSON.parse(JSON.stringify(newAddOn));
  },

  async updateAddOn(id: string, data: Partial<IAddOn>) {
    await connectToDatabase();
    
    if (data.name) {
      const existing = await AddOn.findOne({ 
        name: { $regex: new RegExp(`^${data.name}$`, 'i') }, 
        _id: { $ne: id } 
      });
      if (existing) {
        throw new Error(`Add-On with name "${data.name}" already exists.`);
      }
    }

    const addon = await AddOn.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!addon) throw new Error('Add-On not found');
    return JSON.parse(JSON.stringify(addon));
  },

  async deleteAddOn(id: string) {
    await connectToDatabase();
    const addon = await AddOn.findById(id);
    if (!addon) throw new Error('Add-On not found');
    await AddOn.findByIdAndDelete(id);
    return { success: true };
  }
};
