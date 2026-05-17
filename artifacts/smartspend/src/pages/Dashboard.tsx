import { useGetSummary, useGetCategoryBreakdown, useGetMonthlyTrend } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Wallet, Target, Receipt, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS = [
  "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280",
];

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const pct = (n: number) => `${Math.min(n, 100)}%`;

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetSummary();
  const { data: categories, isLoading: catLoading } = useGetCategoryBreakdown();
  const { data: monthly, isLoading: monthlyLoading } = useGetMonthlyTrend();

  const statCards = [
    {
      label: "Total Spent",
      value: summary ? fmt(summary.totalSpentThisMonth) : "—",
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Monthly Budget",
      value: summary ? fmt(summary.totalBudget) : "—",
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Remaining",
      value: summary ? fmt(summary.remainingBudget) : "—",
      icon: TrendingUp,
      color: summary && summary.remainingBudget < 0 ? "text-destructive" : "text-blue-600",
      bg: summary && summary.remainingBudget < 0 ? "bg-destructive/10" : "bg-blue-50",
    },
    {
      label: "Expenses",
      value: summary ? String(summary.expenseCount) : "—",
      icon: Receipt,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="p-8 space-y-7">
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
                  {summaryLoading ? (
                    <Skeleton className="h-7 w-24 mt-2" />
                  ) : (
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
            {catLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : categories && categories.length > 0 ? (
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {categories.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
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
            {monthlyLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : monthly && monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Spent"]} />
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
