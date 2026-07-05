import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  roleId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
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
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ branchId: 1 });
UserSchema.index({ roleId: 1 });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
