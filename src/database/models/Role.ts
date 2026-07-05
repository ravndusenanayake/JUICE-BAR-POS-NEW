import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  permissions: string[];
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

export default Role;
