import { Router, Response } from "express";
import { Budget } from "../models/Budget";
import { Expense } from "../models/Expense";
import { authMiddleware, AuthRequest } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/budget", async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let budget = await Budget.findOne({ userId: req.userId, month, year }).lean();

    if (!budget) {
      const newBudget = new Budget({
        userId: req.userId,
        month,
        year,
        totalLimit: 0,
        categoryLimits: [],
      });
      await newBudget.save();
      budget = newBudget.toObject();
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const [totalAgg, categoryAgg] = await Promise.all([
      Expense.aggregate([
        { $match: { userId: budget.userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { userId: budget.userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
      ]),
    ]);

    const spent = totalAgg[0]?.total ?? 0;
    const remaining = budget.totalLimit - spent;
    const categorySpendMap = new Map<string, number>(
      categoryAgg.map((a: { _id: string; total: number }) => [a._id, a.total])
    );

    res.json({
      id: budget._id.toString(),
      month: budget.month,
      year: budget.year,
      totalLimit: budget.totalLimit,
      categoryLimits: budget.categoryLimits.map((cl: { category: string; limit: number }) => ({
        category: cl.category,
        limit: cl.limit,
        spent: categorySpendMap.get(cl.category) ?? 0,
      })),
      spent,
      remaining,
    });
  } catch (err) {
    req.log.error({ err }, "GetBudget error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/budget", async (req: AuthRequest, res: Response) => {
  try {
    const { totalLimit, month, year, categoryLimits } = req.body as {
      totalLimit: number;
      month?: number;
      year?: number;
      categoryLimits?: Array<{ category: string; limit: number }>;
    };

    if (totalLimit === undefined || totalLimit < 0) {
      res.status(400).json({ error: "totalLimit is required and must be >= 0" });
      return;
    }

    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, month: targetMonth, year: targetYear },
      {
        $set: {
          totalLimit: Number(totalLimit),
          categoryLimits: categoryLimits ?? [],
        },
      },
      { new: true, upsert: true }
    ).lean();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const [totalAgg, categoryAgg] = await Promise.all([
      Expense.aggregate([
        { $match: { userId: budget.userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { userId: budget.userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
      ]),
    ]);

    const spent = totalAgg[0]?.total ?? 0;
    const remaining = budget.totalLimit - spent;
    const categorySpendMap = new Map<string, number>(
      categoryAgg.map((a: { _id: string; total: number }) => [a._id, a.total])
    );

    res.json({
      id: budget._id.toString(),
      month: budget.month,
      year: budget.year,
      totalLimit: budget.totalLimit,
      categoryLimits: budget.categoryLimits.map((cl: { category: string; limit: number }) => ({
        category: cl.category,
        limit: cl.limit,
        spent: categorySpendMap.get(cl.category) ?? 0,
      })),
      spent,
      remaining,
    });
  } catch (err) {
    req.log.error({ err }, "SetBudget error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
