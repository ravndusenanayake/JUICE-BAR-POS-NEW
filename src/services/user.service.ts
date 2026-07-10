import connectToDatabase from '@/database/mongoose';
import User, { IUser } from '@/database/models/User';

export const userService = {
  /**
   * Fetch all users
   */
  async getAllUsers() {
    await connectToDatabase();
    // Populate role and branch so the frontend can display their names
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(users));
  },

  /**
   * Create a new user
   */
  async createUser(data: Partial<IUser>) {
    await connectToDatabase();
    
    const existing = await User.findOne({ email: data.email?.toLowerCase() });
    if (existing) {
      throw new Error(`User with email "${data.email}" already exists.`);
    }

    // In a real app, hash the password using bcrypt here before saving
    // data.password = await bcrypt.hash(data.password, 10);

    const newUser = new User({
      ...data,
      email: data.email?.toLowerCase()
    });
    
    await newUser.save();
    return JSON.parse(JSON.stringify(newUser));
  },

  /**
   * Update a user
   */
  async updateUser(id: string, data: Partial<IUser>) {
    await connectToDatabase();
    
    if (data.email) {
      const existing = await User.findOne({ 
        email: data.email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existing) {
        throw new Error(`User with email "${data.email}" already exists.`);
      }
      data.email = data.email.toLowerCase();
    }

    // If updating password, hash it here
    // if (data.password) { data.password = await bcrypt.hash(data.password, 10); }

    const user = await User.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!user) {
      throw new Error('User not found');
    }
    
    return JSON.parse(JSON.stringify(user));
  },

  /**
   * Delete a user
   */
  async deleteUser(id: string) {
    await connectToDatabase();
    
    // Check if user exists. Ideally we prevent deleting the primary Super Admin.
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');
    
    await User.findByIdAndDelete(id);
    return { success: true };
  }
};
