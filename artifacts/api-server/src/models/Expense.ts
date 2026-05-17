import mongoose, { Document, Schema } from "mongoose";

export const CATEGORIES = [
  "Food",
  "Travel",
  "Bills",
  "Shopping",
  "Education",
  "Health",
  "Entertainment",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: Category;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: CATEGORIES },
    date: { type: Date, required: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

export const Expense = mongoose.model<IExpense>("Expense", expenseSchema);
