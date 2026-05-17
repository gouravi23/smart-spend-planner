import mongoose, { Document, Schema } from "mongoose";

export interface ICategoryLimit {
  category: string;
  limit: number;
}

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  totalLimit: number;
  categoryLimits: ICategoryLimit[];
  createdAt: Date;
  updatedAt: Date;
}

const categoryLimitSchema = new Schema<ICategoryLimit>(
  {
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const budgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    totalLimit: { type: Number, required: true, min: 0 },
    categoryLimits: { type: [categoryLimitSchema], default: [] },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>("Budget", budgetSchema);
