import { useGetCategoryBreakdown, useGetMonthlyTrend, useGetSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line,
} from "recharts";

const CATEGORY_COLORS = [
  "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280",
];

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Analytics() {
  const { data: categories, isLoading: catLoading } = useGetCategoryBreakdown();
  const { data: monthly, isLoading: monthlyLoading } = useGetMonthlyTrend();
  const { data: summary, isLoading: summaryLoading } = useGetSummary();

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="p-8 space-y-7">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Spending insights and trends</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "This month", value: summary ? fmt(summary.totalSpentThisMonth) : "—" },
          { label: "Budget", value: summary ? fmt(summary.totalBudget) : "—" },
          { label: "Budget used", value: summary ? `${summary.budgetUsedPercent}%` : "—" },
          { label: "Top category", value: summary?.topCategory ?? "—" },
        ].map(({ label, value }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="pt-4 pb-4">
              {summaryLoading ? <Skeleton className="h-8 w-full" /> : (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-xl font-bold mt-1 text-foreground" data-testid={`analytics-stat-${label.toLowerCase().replace(/ /g, "-")}`}>{value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pie chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Category breakdown — {monthLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            {catLoading ? <Skeleton className="h-64 w-full" /> : !categories || categories.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data this month</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                      {categories.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [fmt(v), "Spent"]} />
                    <Legend formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-2">
                  {categories.map((c, i) => (
                    <div key={c.category} className="flex items-center justify-between text-sm" data-testid={`category-row-${c.category}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <span>{c.category}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-xs">
                        <span>{c.percent}%</span>
                        <span className="font-semibold text-foreground">{fmt(c.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bar chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly spending — last 6 months</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? <Skeleton className="h-64 w-full" /> : !monthly || monthly.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Spent"]} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line chart — trend */}
      {!monthlyLoading && monthly && monthly.length > 1 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Spending trend line</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthly} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v), "Spent"]} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
