import mongoose, { Document, Schema } from "mongoose";

export interface IWeeklyChallenge {
  weekStart: Date;
  targetAmount: number;
  completed: boolean;
}

export interface IGamification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  longestStreak: number;
  badges: string[];
  weeklyChallenge: IWeeklyChallenge | null;
  createdAt: Date;
  updatedAt: Date;
}

const gamificationSchema = new Schema<IGamification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    longestStreak: { type: Number, default: 0 },
    badges: [{ type: String }],
    weeklyChallenge: {
      weekStart: Date,
      targetAmount: Number,
      completed: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const Gamification = mongoose.model<IGamification>("Gamification", gamificationSchema);
