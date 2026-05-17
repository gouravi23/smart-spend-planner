import { Router, Response } from "express";
import mongoose from "mongoose";
import { Expense } from "../models/Expense";
import { Budget } from "../models/Budget";
import { Gamification } from "../models/Gamification";
import { authMiddleware, AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

router.get("/gamification", async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const [budget, monthExpenses, gamification] = await Promise.all([
      Budget.findOne({ userId, month, year }).lean(),
      Expense.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }).lean(),
      Gamification.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId, longestStreak: 0, badges: [], weeklyChallenge: null } },
        { new: true, upsert: true }
      ),
    ]);

    const totalLimit = budget?.totalLimit ?? 0;
    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyBudget = totalLimit > 0 ? totalLimit / daysInMonth : 0;

    const expensesByDay = new Map<string, number>();
    for (const e of monthExpenses) {
      const d = new Date(e.date).toISOString().split("T")[0]!;
      expensesByDay.set(d, (expensesByDay.get(d) ?? 0) + e.amount);
    }

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (d < startOfMonth) break;
      const key = d.toISOString().split("T")[0]!;
      const daySpent = expensesByDay.get(key) ?? 0;
      if (dailyBudget > 0 && daySpent <= dailyBudget) {
        currentStreak++;
      } else if (dailyBudget === 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    const longestStreak = Math.max(gamification.longestStreak, currentStreak);
    if (longestStreak > gamification.longestStreak) {
      gamification.longestStreak = longestStreak;
    }

    const categories = new Set(monthExpenses.map((e) => e.category));
    const budgetPct = totalLimit > 0 ? totalSpent / totalLimit : 0;
    const earnedBadges: string[] = [];

    if (monthExpenses.length >= 1) earnedBadges.push("Finance Rookie");
    if (monthExpenses.length >= 10) earnedBadges.push("Expense Controller");
    if (budgetPct <= 0.8 && totalLimit > 0) earnedBadges.push("Smart Saver");
    if (budgetPct <= 0.6 && totalLimit > 0 && currentStreak >= 7) earnedBadges.push("Budget Master");

    const allBadges = [...new Set([...gamification.badges, ...earnedBadges])];
    gamification.badges = allBadges;

    const weekStart = getWeekStart(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekExpenses = monthExpenses.filter((e) => {
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd;
    });
    const weekSpent = weekExpenses.reduce((s, e) => s + e.amount, 0);
    const weekTarget = totalLimit > 0 ? Math.round(totalLimit / 4.3) : 5000;

    const existingChallenge = gamification.weeklyChallenge;
    const challengeIsCurrentWeek =
      existingChallenge &&
      existingChallenge.weekStart.toDateString() === weekStart.toDateString();

    const weeklyChallenge = {
      weekStart: weekStart.toISOString(),
      targetAmount: challengeIsCurrentWeek ? existingChallenge!.targetAmount : weekTarget,
      currentAmount: weekSpent,
      completed: weekSpent <= (challengeIsCurrentWeek ? existingChallenge!.targetAmount : weekTarget),
    };

    gamification.weeklyChallenge = {
      weekStart,
      targetAmount: weeklyChallenge.targetAmount,
      completed: weeklyChallenge.completed,
    };

    await gamification.save();

    const categoryCount = categories.size;
    const healthScore = Math.min(
      100,
      Math.round(
        (totalLimit > 0 ? Math.max(0, (1 - budgetPct)) * 40 : 20) +
        Math.min(20, (categoryCount / 8) * 20) +
        Math.min(20, (currentStreak / 7) * 20) +
        Math.min(20, (monthExpenses.length / 15) * 20)
      )
    );

    res.json({
      currentStreak,
      longestStreak,
      badges: allBadges,
      weeklyChallenge,
      healthScore,
      totalBadgesAvailable: 4,
    });
  } catch (err) {
    req.log.error({ err }, "GetGamification error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
