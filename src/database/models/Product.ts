import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: string;
  type: string;
  unit: string;
  cost: number;
  outletPrice: number;
  pickmePrice: number;
  uberPrice: number;
  status: 'Active' | 'Inactive';
  addons: { name: string, price: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    type: { type: String, default: 'Product' },
    unit: { type: String, default: 'Nos' },
    cost: { type: Number, default: 0 },
    outletPrice: { type: Number, default: 0 },
    pickmePrice: { type: Number, default: 0 },
    uberPrice: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    addons: [{ name: String, price: Number }],
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
