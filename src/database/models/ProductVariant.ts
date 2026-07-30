import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant extends Document {
  productId: mongoose.Types.ObjectId;
  name: string;
  sellingPrice: number;
  status: 'Active' | 'Inactive';
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

ProductVariantSchema.index({ productId: 1 });

const ProductVariant = mongoose.models.ProductVariant || mongoose.model<IProductVariant>('ProductVariant', ProductVariantSchema);

export default ProductVariant;
