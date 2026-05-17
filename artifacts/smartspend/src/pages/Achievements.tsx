import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Flame, Star, Target, Shield, Zap, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface GamificationData {
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  weeklyChallenge: {
    weekStart: string;
    targetAmount: number;
    currentAmount: number;
    completed: boolean;
  };
  healthScore: number;
  totalBadgesAvailable: number;
}

const BADGE_INFO: Record<string, { icon: React.ElementType; color: string; bg: string; desc: string }> = {
  "Finance Rookie":   { icon: Star,    color: "text-yellow-500", bg: "bg-yellow-500/10", desc: "Logged your first expense" },
  "Expense Controller": { icon: Shield,  color: "text-blue-500",   bg: "bg-blue-500/10",   desc: "Recorded 10+ expenses" },
  "Smart Saver":      { icon: Zap,     color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Spent under 80% of budget" },
  "Budget Master":    { icon: Trophy,  color: "text-purple-500",  bg: "bg-purple-500/10",  desc: "7-day streak + under 60% budget" },
};

const ALL_BADGES = Object.keys(BADGE_INFO);

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function HealthRing({ score }: { score: number }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Excellent" : score >= 40 ? "Good" : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

export default function Achievements() {
  const token = localStorage.getItem("token");
  const { data, isLoading } = useQuery<GamificationData>({
    queryKey: ["gamification"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/gamification`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<GamificationData>;
    },
    staleTime: 30_000,
  });

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-muted-foreground text-sm mt-1">{monthLabel} · Gamified savings tracker</p>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Health Score */}
        <Card className="border shadow-sm col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Financial Health
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-2">
            {isLoading ? <Skeleton className="w-36 h-36 rounded-full" /> : <HealthRing score={data?.healthScore ?? 0} />}
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Savings Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div className="text-center">
                  <div className="text-5xl font-bold text-orange-500">{data?.currentStreak ?? 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">day streak</div>
                </div>
                <div className="flex justify-center gap-1.5">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                        i < (data?.currentStreak ?? 0)
                          ? "bg-orange-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i < (data?.currentStreak ?? 0) ? <Flame className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-center text-muted-foreground">Longest: {data?.longestStreak ?? 0} days</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Weekly Challenge */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Weekly Challenge
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : data?.weeklyChallenge ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    data.weeklyChallenge.completed
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-orange-500/10 text-orange-500"
                  )}>
                    {data.weeklyChallenge.completed ? "Completed!" : "In Progress"}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Spent this week</span>
                    <span className="font-medium text-foreground">
                      {fmt(data.weeklyChallenge.currentAmount)} / {fmt(data.weeklyChallenge.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={cn("h-2 rounded-full transition-all", data.weeklyChallenge.completed ? "bg-emerald-500" : "bg-primary")}
                      style={{ width: `${Math.min((data.weeklyChallenge.currentAmount / data.weeklyChallenge.targetAmount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.weeklyChallenge.completed
                    ? "You stayed within your weekly target!"
                    : `${fmt(Math.max(0, data.weeklyChallenge.targetAmount - data.weeklyChallenge.currentAmount))} remaining to complete`}
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" /> Badge Collection
            {data && (
              <span className="ml-auto text-xs text-muted-foreground font-normal">
                {data.badges.length} / {data.totalBadgesAvailable} earned
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {ALL_BADGES.map((badge) => {
              const earned = data?.badges.includes(badge) ?? false;
              const info = BADGE_INFO[badge]!;
              const Icon = info.icon;
              return (
                <div
                  key={badge}
                  className={cn(
                    "flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all",
                    earned
                      ? `${info.bg} border-transparent`
                      : "border-border opacity-40 grayscale"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", earned ? info.bg : "bg-muted")}>
                    <Icon className={cn("w-6 h-6", earned ? info.color : "text-muted-foreground")} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{badge}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>
                  </div>
                  {earned && (
                    <span className="text-xs font-medium text-emerald-500">Earned</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Motivational */}
      <Card className="border shadow-sm bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardContent className="py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {(data?.currentStreak ?? 0) >= 7
                ? "Outstanding! You're on a 7-day streak. Keep it going!"
                : (data?.currentStreak ?? 0) >= 3
                ? "Great momentum! Stay under your daily budget to grow your streak."
                : "Start today! Stay within your daily budget to begin your savings streak."}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every day you stay under budget counts toward your streak and badges.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
