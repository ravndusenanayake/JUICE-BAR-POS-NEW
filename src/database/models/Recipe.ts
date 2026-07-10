import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipeIngredient {
  rawMaterialId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface IRecipe extends Document {
  productId: string;
  productName: string;
  variant: string;
  ingredients: IRecipeIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

const RecipeIngredientSchema = new Schema<IRecipeIngredient>(
  {
    rawMaterialId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const RecipeSchema = new Schema<IRecipe>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    variant: { type: String, required: true },
    ingredients: [RecipeIngredientSchema],
  },
  { timestamps: true }
);

RecipeSchema.index({ productId: 1, variant: 1 });

const Recipe = mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);

export default Recipe;
