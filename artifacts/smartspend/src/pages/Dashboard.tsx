import { useGetSummary, useGetCategoryBreakdown, useGetMonthlyTrend } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Wallet, Target, Receipt, ArrowUpRight, Flame, Trophy, Star, Zap, Shield } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS = [
  "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280",
];

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const pct = (n: number) => `${Math.min(n, 100)}%`;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface GamificationData {
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  weeklyChallenge: { weekStart: string; targetAmount: number; currentAmount: number; completed: boolean };
  healthScore: number;
  totalBadgesAvailable: number;
}

const BADGE_ICONS: Record<string, React.ElementType> = {
  "Finance Rookie": Star,
  "Expense Controller": Shield,
  "Smart Saver": Zap,
  "Budget Master": Trophy,
};
const BADGE_COLORS: Record<string, string> = {
  "Finance Rookie": "text-yellow-500",
  "Expense Controller": "text-blue-500",
  "Smart Saver": "text-emerald-500",
  "Budget Master": "text-purple-500",
};

function HealthScoreMini({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Excellent" : score >= 40 ? "Good" : "Needs Work";
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-foreground">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color }}>{label}</p>
        <p className="text-xs text-muted-foreground">Financial Health Score</p>
        <p className="text-xs text-muted-foreground mt-0.5">out of 100</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetSummary();
  const { data: categories, isLoading: catLoading } = useGetCategoryBreakdown();
  const { data: monthly, isLoading: monthlyLoading } = useGetMonthlyTrend();

  const token = localStorage.getItem("token");
  const { data: gamification, isLoading: gamLoading } = useQuery<GamificationData>({
    queryKey: ["gamification"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/gamification`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<GamificationData>;
    },
    staleTime: 60_000,
  });

  const statCards = [
    { label: "Total Spent", value: summary ? fmt(summary.totalSpentThisMonth) : "—", icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: "Monthly Budget", value: summary ? fmt(summary.totalBudget) : "—", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    {
      label: "Remaining",
      value: summary ? fmt(summary.remainingBudget) : "—",
      icon: TrendingUp,
      color: summary && summary.remainingBudget < 0 ? "text-destructive" : "text-blue-600",
      bg: summary && summary.remainingBudget < 0 ? "bg-destructive/10" : "bg-blue-50 dark:bg-blue-950/30",
    },
    { label: "Expenses", value: summary ? String(summary.expenseCount) : "—", icon: Receipt, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} overview
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  {summaryLoading ? <Skeleton className="h-7 w-24 mt-2" /> : (
                    <p className="text-2xl font-bold mt-1.5 text-foreground" data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`}>{value}</p>
                  )}
                </div>
                <div className={cn("p-2.5 rounded-lg", bg)}>
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gamification row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Health Score */}
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-5">
            {gamLoading ? <Skeleton className="h-20 w-full" /> : (
              <HealthScoreMini score={gamification?.healthScore ?? 0} />
            )}
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Flame className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                {gamLoading ? <Skeleton className="h-8 w-20" /> : (
                  <>
                    <p className="text-3xl font-bold text-foreground">{gamification?.currentStreak ?? 0}
                      <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Savings streak</p>
                    <p className="text-xs text-orange-500 font-medium mt-0.5">
                      Best: {gamification?.longestStreak ?? 0} days
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Badges Earned</p>
              <Link href="/achievements" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {gamLoading ? <Skeleton className="h-8 w-full" /> : (
              <div className="flex items-center gap-2 flex-wrap">
                {(gamification?.badges ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No badges yet. Start logging expenses!</p>
                ) : (
                  (gamification?.badges ?? []).map((badge) => {
                    const Icon = BADGE_ICONS[badge] ?? Trophy;
                    const color = BADGE_COLORS[badge] ?? "text-primary";
                    return (
                      <div key={badge} title={badge} className="flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1">
                        <Icon className={cn("w-3.5 h-3.5", color)} />
                        <span className="text-xs font-medium text-foreground">{badge}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Challenge */}
      {gamification?.weeklyChallenge && (
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Weekly Savings Challenge</span>
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  gamification.weeklyChallenge.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                )}>
                  {gamification.weeklyChallenge.completed ? "Completed!" : "In Progress"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {fmt(gamification.weeklyChallenge.currentAmount)} / {fmt(gamification.weeklyChallenge.targetAmount)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={cn("h-2 rounded-full transition-all", gamification.weeklyChallenge.completed ? "bg-emerald-500" : "bg-primary")}
                style={{ width: `${Math.min((gamification.weeklyChallenge.currentAmount / gamification.weeklyChallenge.targetAmount) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {gamification.weeklyChallenge.completed
                ? "You stayed within your weekly spending target. Great discipline!"
                : `Spend ${fmt(Math.max(0, gamification.weeklyChallenge.targetAmount - gamification.weeklyChallenge.currentAmount))} less to complete this week's challenge.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Budget progress */}
      {summary && summary.totalBudget > 0 && (
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Budget used this month</span>
              <span className={cn("text-sm font-bold", summary.budgetUsedPercent > 90 ? "text-destructive" : "text-primary")}>
                {summary.budgetUsedPercent}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className={cn("h-2.5 rounded-full transition-all", summary.budgetUsedPercent > 90 ? "bg-destructive" : "bg-primary")}
                style={{ width: pct(summary.budgetUsedPercent) }}
                data-testid="budget-progress-bar"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{fmt(summary.totalSpentThisMonth)} spent</span>
              <span>{fmt(summary.totalBudget)} limit</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {catLoading ? <Skeleton className="h-52 w-full" /> : categories && categories.length > 0 ? (
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {categories.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categories.slice(0, 6).map((c, i) => (
                    <div key={c.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <span className="text-foreground/80">{c.category}</span>
                      </div>
                      <span className="font-medium text-foreground">{c.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No expenses this month</div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? <Skeleton className="h-52 w-full" /> : monthly && monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Spent"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent expenses */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Expenses</CardTitle>
            <Link href="/expenses" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : summary?.recentExpenses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No expenses yet. Add your first one.</div>
          ) : (
            <div className="divide-y divide-border">
              {summary?.recentExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3" data-testid={`expense-row-${e.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {e.category[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.category} · {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
