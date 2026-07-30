const mongoose = require('mongoose'); 
require('dotenv').config({path: '.env.local'}); 
const bcrypt = require('bcryptjs'); 
mongoose.connect(process.env.MONGODB_URI).then(async () => { 
  const User = mongoose.model('User', new mongoose.Schema({ email: String, password: String, role: String, branch: String, status: String, name: String }, {strict: false}), 'users'); 
  const hashedPassword = await bcrypt.hash('admin123', 10); 
  await User.updateOne({ email: 'superadmin@juicebar.com' }, { $set: { password: hashedPassword, role: 'Super Admin', branch: 'All Branches', status: 'Active' } }); 
  console.log('Reset superadmin password to admin123'); 
  process.exit(0); 
});
