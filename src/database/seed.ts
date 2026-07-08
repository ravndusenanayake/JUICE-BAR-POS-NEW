import bcrypt from 'bcryptjs';
import User from './models/User';
import Role from './models/Role';

export async function seedInitialData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return; // Already seeded

    console.log('Seeding initial Super Admin...');

    // 1. Create Super Admin Role
    let superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        permissions: ['ALL'],
      });
    }

    // 2. Create Admin Role
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        permissions: ['MANAGE_USERS', 'MANAGE_BRANCHES', 'POS_ACCESS'],
      });
    }

    // 3. Create Super Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      name: 'Super Admin',
      email: 'admin', // we will use 'admin' as the username/email for login
      password: hashedPassword,
      roleId: superAdminRole._id,
      status: 'Active',
    });

    console.log('Successfully seeded Super Admin user. (Username: admin, Password: admin123)');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}
