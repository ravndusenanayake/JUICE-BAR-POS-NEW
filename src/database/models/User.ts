import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: string;
  branch: string;
  status: 'Active' | 'Inactive';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, required: true },
    branch: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ branch: 1 });
UserSchema.index({ role: 1 });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
