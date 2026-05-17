import { Router, Response } from "express";
import mongoose from "mongoose";
import { Expense } from "../models/Expense";
import { Budget } from "../models/Budget";
import { authMiddleware, AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(authMiddleware);

const CATEGORIES = ["Food", "Travel", "Bills", "Shopping", "Education", "Health", "Entertainment", "Other"];
const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

router.post("/assistant/chat", async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body as { message: string };
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const [expenses, budget] = await Promise.all([
      Expense.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } }).lean(),
      Budget.findOne({ userId, month, year }).lean(),
    ]);

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const totalLimit = budget?.totalLimit ?? 0;
    const remaining = totalLimit - totalSpent;

    const categoryTotals = new Map<string, number>();
    for (const e of expenses) {
      categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount);
    }
    const sortedCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0];

    const msg = message.toLowerCase();

    let reply = "";

    if (msg.includes("highest") || msg.includes("most") || msg.includes("top category") || msg.includes("where did i spend")) {
      if (topCategory) {
        reply = `Your highest spending category this month is **${topCategory[0]}** at ${fmt(topCategory[1])}. ${
          sortedCategories.length > 1
            ? `The next highest is **${sortedCategories[1]![0]}** at ${fmt(sortedCategories[1]![1])}.`
            : ""
        }`;
      } else {
        reply = "You haven't recorded any expenses this month yet. Start adding expenses to track your spending!";
      }
    } else if (msg.includes("remaining") || msg.includes("left") || msg.includes("balance")) {
      if (totalLimit === 0) {
        reply = "You haven't set a monthly budget yet. Go to the Budget page to set one and track your remaining balance!";
      } else if (remaining < 0) {
        reply = `You've exceeded your budget by ${fmt(Math.abs(remaining))} this month. You've spent ${fmt(totalSpent)} against a budget of ${fmt(totalLimit)}.`;
      } else {
        reply = `You have ${fmt(remaining)} remaining out of your ${fmt(totalLimit)} monthly budget. You've used ${Math.round((totalSpent / totalLimit) * 100)}% so far.`;
      }
    } else if (msg.includes("summary") || msg.includes("overview") || msg.includes("this month")) {
      const now2 = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      reply = `**${now2} Summary:**\n- Total spent: ${fmt(totalSpent)}\n- Budget limit: ${totalLimit > 0 ? fmt(totalLimit) : "Not set"}\n- Remaining: ${totalLimit > 0 ? fmt(remaining) : "N/A"}\n- Total transactions: ${expenses.length}\n- Top category: ${topCategory ? topCategory[0] : "None"}`;
    } else if (msg.includes("saving") || msg.includes("save") || msg.includes("suggestion") || msg.includes("tips") || msg.includes("advice")) {
      const tips: string[] = [];
      if (topCategory && topCategory[1] > totalSpent * 0.4) {
        tips.push(`Consider reducing **${topCategory[0]}** spending — it accounts for over 40% of your expenses.`);
      }
      if (totalLimit > 0 && totalSpent > totalLimit * 0.8) {
        tips.push("You're close to your budget limit. Try to avoid non-essential purchases for the rest of the month.");
      }
      if (expenses.length < 5) {
        tips.push("Log all your expenses regularly — even small ones add up and give you a clearer picture.");
      }
      const foodTotal = categoryTotals.get("Food") ?? 0;
      if (foodTotal > totalSpent * 0.35) {
        tips.push("Your Food spending is high. Try meal prepping or cooking at home to save more.");
      }
      const entertainTotal = categoryTotals.get("Entertainment") ?? 0;
      if (entertainTotal > 0) {
        tips.push("Look for free or low-cost entertainment alternatives to trim discretionary spending.");
      }
      if (tips.length === 0) {
        tips.push("Great job! You're managing your finances well. Keep tracking consistently to maintain good habits.");
        tips.push("Consider setting category-specific limits in the Budget page for even more control.");
      }
      reply = `**Saving Tips for You:**\n${tips.map((t) => `• ${t}`).join("\n")}`;
    } else if (msg.includes("category") || msg.includes("breakdown") || msg.includes("categories")) {
      if (sortedCategories.length === 0) {
        reply = "No expenses recorded this month yet.";
      } else {
        const lines = sortedCategories.map(([cat, amt]) => `• ${cat}: ${fmt(amt)}`).join("\n");
        reply = `**Category Breakdown (This Month):**\n${lines}`;
      }
    } else if (msg.includes("budget")) {
      if (totalLimit === 0) {
        reply = "You haven't set a monthly budget yet. Head to the Budget page to set your spending limit!";
      } else {
        const pct = Math.round((totalSpent / totalLimit) * 100);
        reply = `Your monthly budget is ${fmt(totalLimit)}. You've spent ${fmt(totalSpent)} (${pct}%). ${
          pct > 90 ? "Warning: You're nearly at your limit!" : pct > 70 ? "You're using a good portion of your budget." : "You're on track!"
        }`;
      }
    } else if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      reply = `Hello! I'm your SmartSpend AI assistant. I can help you with:\n• Where you spent the most this month\n• Your remaining budget\n• Category-wise breakdown\n• Saving suggestions\n• Monthly expense summary\n\nWhat would you like to know?`;
    } else if (msg.includes("total") || msg.includes("spent") || msg.includes("spend")) {
      reply = `You've spent a total of **${fmt(totalSpent)}** this month across ${expenses.length} transactions.`;
    } else if (msg.includes("count") || msg.includes("how many") || msg.includes("transaction")) {
      reply = `You have **${expenses.length} transactions** recorded this month.`;
    } else {
      reply = `I can help you with:\n• "Where did I spend the most?"\n• "How much budget is remaining?"\n• "Show category breakdown"\n• "Give me saving suggestions"\n• "Monthly summary"\n\nTry one of these!`;
    }

    await new Promise((r) => setTimeout(r, 400));

    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "AssistantChat error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
