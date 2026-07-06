import connectToDatabase from '@/database/mongoose';
import Role, { IRole } from '@/database/models/Role';
import { PERMISSIONS } from '@/lib/permissions';

export const roleService = {
  /**
   * Fetch all roles
   */
  async getAllRoles() {
    await connectToDatabase();
    const roles = await Role.find({}).sort({ createdAt: 1 }).lean();
    return JSON.parse(JSON.stringify(roles));
  },

  /**
   * Create a new custom role
   */
  async createRole(data: { name: string; permissions: string[] }) {
    await connectToDatabase();
    
    const existing = await Role.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });
    if (existing) {
      throw new Error(`Role with name "${data.name}" already exists.`);
    }

    const newRole = new Role(data);
    await newRole.save();
    
    return JSON.parse(JSON.stringify(newRole));
  },

  /**
   * Update a role's permissions
   */
  async updateRole(id: string, data: Partial<IRole>) {
    await connectToDatabase();
    
    if (data.name) {
      const existing = await Role.findOne({ 
        name: { $regex: new RegExp(`^${data.name}$`, 'i') }, 
        _id: { $ne: id } 
      });
      if (existing) {
        throw new Error(`Role with name "${data.name}" already exists.`);
      }
    }

    const role = await Role.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!role) {
      throw new Error('Role not found');
    }
    
    return JSON.parse(JSON.stringify(role));
  },

  /**
   * Delete a role
   */
  async deleteRole(id: string) {
    await connectToDatabase();
    
    // Check if role is 'Super Admin'. Prevent deletion of Super Admin.
    const role = await Role.findById(id);
    if (!role) throw new Error('Role not found');
    if (role.name === 'Super Admin') throw new Error('Super Admin role cannot be deleted');
    
    await Role.findByIdAndDelete(id);
    return { success: true };
  },

  /**
   * Seed the database with the default roles provided by the user
   */
  async seedDefaultRoles() {
    await connectToDatabase();

    const defaultRoles = [
      {
        name: "Super Admin",
        permissions: Object.values(PERMISSIONS)
      },
      {
        name: "Branch Manager",
        permissions: [
          PERMISSIONS.VIEW_ASSIGNED_BRANCH,
          PERMISSIONS.MANAGE_INVENTORY,
          PERMISSIONS.MANAGE_PO,
          PERMISSIONS.MANAGE_GRN,
          PERMISSIONS.MANAGE_WASTAGE,
          PERMISSIONS.MANAGE_EXPENSES,
          PERMISSIONS.VIEW_BRANCH_REPORTS,
          PERMISSIONS.APPROVE_STOCK_TRANSFERS
        ]
      },
      {
        name: "Store Keeper",
        permissions: [
          PERMISSIONS.MANAGE_INVENTORY,
          PERMISSIONS.MANAGE_PO,
          PERMISSIONS.MANAGE_GRN,
          PERMISSIONS.STOCK_TRANSFERS,
          PERMISSIONS.MANAGE_WASTAGE
        ]
      },
      {
        name: "Cashier",
        permissions: [
          PERMISSIONS.POS_SALES,
          PERMISSIONS.CUSTOMER_MANAGEMENT,
          PERMISSIONS.RECEIPT_PRINTING
        ]
      }
    ];

    for (const roleData of defaultRoles) {
      const existing = await Role.findOne({ name: roleData.name });
      if (!existing) {
        await Role.create(roleData);
      }
    }

    return { message: 'Default roles seeded successfully' };
  }
};
