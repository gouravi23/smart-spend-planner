import { Router, Response } from "express";
import mongoose from "mongoose";
import { Expense } from "../models/Expense";
import { authMiddleware, AuthRequest } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/expenses", async (req: AuthRequest, res: Response) => {
  try {
    const { category, startDate, endDate, page = "1", limit = "20" } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { userId: req.userId };

    if (category) filter["category"] = category;
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter["$gte"] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter["$lte"] = end;
      }
      filter["date"] = dateFilter;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limitNum).lean(),
      Expense.countDocuments(filter),
    ]);

    res.json({
      expenses: expenses.map((e) => ({
        id: e._id.toString(),
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date instanceof Date ? e.date.toISOString() : String(e.date),
        description: e.description ?? null,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "GetExpenses error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/expenses", async (req: AuthRequest, res: Response) => {
  try {
    const { title, amount, category, date, description } = req.body as {
      title: string;
      amount: number;
      category: string;
      date: string;
      description?: string;
    };

    if (!title || amount === undefined || !category || !date) {
      res.status(400).json({ error: "title, amount, category, and date are required" });
      return;
    }

    const expense = new Expense({
      userId: req.userId,
      title,
      amount: Number(amount),
      category,
      date: new Date(date),
      description,
    });
    await expense.save();

    res.status(201).json({
      id: expense._id.toString(),
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date.toISOString(),
      description: expense.description ?? null,
      createdAt: expense.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "CreateExpense error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/expenses/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const expense = await Expense.findOne({ _id: id, userId: req.userId }).lean();
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    res.json({
      id: expense._id.toString(),
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date instanceof Date ? expense.date.toISOString() : String(expense.date),
      description: expense.description ?? null,
      createdAt: expense.createdAt instanceof Date ? expense.createdAt.toISOString() : String(expense.createdAt),
    });
  } catch (err) {
    req.log.error({ err }, "GetExpense error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/expenses/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const updates = req.body as {
      title?: string;
      amount?: number;
      category?: string;
      date?: string;
      description?: string;
    };

    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData["title"] = updates.title;
    if (updates.amount !== undefined) updateData["amount"] = Number(updates.amount);
    if (updates.category !== undefined) updateData["category"] = updates.category;
    if (updates.date !== undefined) updateData["date"] = new Date(updates.date);
    if (updates.description !== undefined) updateData["description"] = updates.description;

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    res.json({
      id: expense._id.toString(),
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date instanceof Date ? expense.date.toISOString() : String(expense.date),
      description: expense.description ?? null,
      createdAt: expense.createdAt instanceof Date ? expense.createdAt.toISOString() : String(expense.createdAt),
    });
  } catch (err) {
    req.log.error({ err }, "UpdateExpense error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/expenses/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const expense = await Expense.findOneAndDelete({ _id: id, userId: req.userId });
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    res.json({ message: "Expense deleted" });
  } catch (err) {
    req.log.error({ err }, "DeleteExpense error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
