import mongoose from 'mongoose';
import Role from './src/database/models/Role';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is missing');
}

const defaultRoles = [
  {
    name: 'Super Admin',
    permissions: [
      'Manage Branches',
      'Manage Users',
      'Manage Roles',
      'Manage Products',
      'Manage Categories',
      'Manage Recipes',
      'Manage Suppliers',
      'View All Reports',
      'Manage System Settings'
    ]
  },
  {
    name: 'Branch Manager',
    permissions: [
      'View Assigned Branch',
      'Manage Inventory',
      'Manage PO',
      'Manage GRN',
      'Manage Wastage',
      'Manage Expenses',
      'View Branch Reports',
      'Approve Stock Transfers'
    ]
  },
  {
    name: 'Store Keeper',
    permissions: [
      'Inventory Management',
      'Purchase Orders',
      'Goods Receiving',
      'Stock Transfers',
      'Wastage Entries'
    ]
  },
  {
    name: 'Cashier',
    permissions: [
      'POS Sales',
      'Customer Management',
      'Receipt Printing'
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB.');
    
    let updated = 0;
    for (const roleData of defaultRoles) {
      const role = await Role.findOne({ name: roleData.name });
      if (role) {
        // Update existing role
        role.permissions = roleData.permissions;
        await role.save();
        console.log(`Updated role: ${role.name}`);
        updated++;
      } else {
        // Create new role
        await Role.create(roleData);
        console.log(`Created role: ${roleData.name}`);
        updated++;
      }
    }
    
    console.log(`Role seeding complete! Processed ${updated} roles.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
}

seed();
