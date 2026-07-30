import mongoose from 'mongoose';
import connectToDatabase from './src/database/mongoose';
import { roleService } from './src/services/role.service';

async function seed() {
  await connectToDatabase();
  console.log('Seeding roles...');
  await mongoose.connection.collection('roles').drop().catch(() => {});
  await roleService.seedDefaultRoles();
  console.log('Roles seeded successfully!');
  process.exit(0);
}

seed().catch(console.error);
