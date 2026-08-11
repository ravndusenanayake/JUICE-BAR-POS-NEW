const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, required: true },
  branch: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const adminEmail = 'admin@admin.com';
    const plainPassword = 'admin';

    let user = await User.findOne({ email: adminEmail });
    
    if (user) {
      console.log('Admin user exists. Updating password...');
      user.password = await bcrypt.hash(plainPassword, 10);
      user.role = 'Super Admin'; // ensure role is correct
      await user.save();
      console.log('Admin password reset to "admin"');
    } else {
      console.log('Admin user not found. Creating new...');
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'Super Admin',
        branch: 'All Branches',
        status: 'Active'
      });
      console.log('Created Super Admin user (admin@admin.com / admin)');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
