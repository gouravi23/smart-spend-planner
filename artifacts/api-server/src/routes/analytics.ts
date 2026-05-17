import { Router, Response } from "express";
import mongoose from "mongoose";
import { Expense } from "../models/Expense";
import { Budget } from "../models/Budget";
import { authMiddleware, AuthRequest } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/analytics/summary", async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const userId = new mongoose.Types.ObjectId(req.userId);

    const [spendAgg, categoryAgg, budget, recentExpenses] = await Promise.all([
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]),
      Budget.findOne({ userId, month, year }).lean(),
      Expense.find({ userId }).sort({ date: -1 }).limit(5).lean(),
    ]);

    const totalSpentThisMonth = spendAgg[0]?.total ?? 0;
    const expenseCount = spendAgg[0]?.count ?? 0;
    const totalBudget = budget?.totalLimit ?? 0;
    const budgetUsedPercent = totalBudget > 0 ? Math.round((totalSpentThisMonth / totalBudget) * 100) : 0;
    const remainingBudget = Math.max(0, totalBudget - totalSpentThisMonth);
    const topCategory: string | null = categoryAgg[0]?._id ?? null;

    res.json({
      totalSpentThisMonth,
      totalBudget,
      budgetUsedPercent,
      remainingBudget,
      expenseCount,
      topCategory,
      recentExpenses: recentExpenses.map((e) => ({
        id: e._id.toString(),
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date instanceof Date ? e.date.toISOString() : String(e.date),
        description: e.description ?? null,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "GetSummary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/monthly", async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const agg = await Expense.aggregate([
      { $match: { userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const result = agg.map((item) => ({
      month: `${MONTH_NAMES[item._id.month - 1]} ${item._id.year}`,
      total: item.total,
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "GetMonthlyTrend error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/categories", async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const agg = await Expense.aggregate([
      { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = agg.reduce((sum, item) => sum + item.total, 0);

    const result = agg.map((item) => ({
      category: item._id,
      total: item.total,
      percent: grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0,
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "GetCategoryBreakdown error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
