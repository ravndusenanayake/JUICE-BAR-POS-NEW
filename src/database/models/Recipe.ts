import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipeIngredient {
  inventoryItemId: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
}

export interface IRecipe extends Document {
  variantId: mongoose.Types.ObjectId;
  ingredients: IRecipeIngredient[];
}

const RecipeIngredientSchema = new Schema<IRecipeIngredient>(
  {
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const RecipeSchema = new Schema<IRecipe>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true, unique: true },
    ingredients: [RecipeIngredientSchema],
  },
  { timestamps: true }
);

RecipeSchema.index({ variantId: 1 });

const Recipe = mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);

export default Recipe;
