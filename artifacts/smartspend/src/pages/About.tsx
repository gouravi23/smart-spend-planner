import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Shield, BarChart2, Target, Users, Smartphone, Globe, Cpu } from "lucide-react";

const FEATURES = [
  { icon: Wallet, title: "Expense Tracking", desc: "Log and categorize every expense with full edit/delete support and smart filtering." },
  { icon: Target, title: "Budget Planning", desc: "Set monthly limits with per-category budgets and real-time progress tracking." },
  { icon: BarChart2, title: "Analytics", desc: "Visualize spending with donut charts, bar charts, and 6-month trend analysis." },
  { icon: Shield, title: "Secure Auth", desc: "JWT-based authentication with bcrypt password hashing for enterprise-grade security." },
];

const FUTURE_FEATURES = [
  {
    icon: Users,
    title: "Shared Budget / Family Mode",
    badge: "Planned",
    desc: "Allow multiple users to share a single budget pool — ideal for families, roommates, or student groups. Each member gets their own spending view while contributing to a shared limit. Includes role-based permissions (Admin, Member, Viewer), real-time sync, and group expense splitting.",
    points: [
      "Invite family members via email",
      "Shared monthly budget with individual sub-limits",
      "Group expense categories (Groceries, Rent, Utilities)",
      "Admin approval for large expenses",
      "Monthly family spending report",
    ],
  },
  {
    icon: Smartphone,
    title: "Mobile App (React Native / Expo)",
    badge: "Planned",
    desc: "A full-featured mobile companion app for Android and iOS built with Expo, offering push notifications for budget alerts, receipt scanning via camera, and offline expense logging.",
    points: [
      "Push notifications for budget warnings",
      "Camera-based receipt scanning (OCR)",
      "Offline expense entry with sync",
      "Biometric authentication",
      "Widget support for quick expense entry",
    ],
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    badge: "Planned",
    desc: "Track expenses in multiple currencies with real-time exchange rate conversion. Ideal for travelers and international students.",
    points: [
      "Auto-convert expenses to home currency",
      "Live exchange rates (via API)",
      "Currency selector per expense",
      "Monthly report in selected base currency",
    ],
  },
  {
    icon: Cpu,
    title: "AI-Powered Smart Predictions",
    badge: "Planned",
    desc: "Move beyond rule-based analytics to a true ML model trained on your spending history. Predicts next month's expenses and suggests optimal budget allocations.",
    points: [
      "Spending prediction for next 30 days",
      "Anomaly detection (unusual expenses)",
      "Auto-categorization of expenses",
      "Personalized saving recommendations",
    ],
  },
];

export default function About() {
  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">About SmartSpend</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
          SmartSpend is a full-stack MERN desktop application designed for students and professionals who want
          complete control over their personal finances. Built as an MCA Final Year Project, it combines modern
          web technologies with thoughtful UX to make budgeting effortless.
        </p>
      </div>

      {/* Stack */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Frontend", value: "React 18 + TypeScript + Vite" },
              { label: "Styling", value: "Tailwind CSS v4 + shadcn/ui" },
              { label: "Backend", value: "Node.js + Express 5" },
              { label: "Database", value: "MongoDB Atlas + Mongoose" },
              { label: "Auth", value: "JWT + bcryptjs" },
              { label: "Charts", value: "Recharts" },
              { label: "State", value: "TanStack Query + React Hook Form" },
              { label: "Routing", value: "Wouter" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-xs font-semibold text-primary w-20 flex-shrink-0">{label}</span>
                <span className="text-xs text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Features */}
      <div>
        <h2 className="text-base font-semibold mb-3">Current Features</h2>
        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border shadow-sm">
              <CardContent className="pt-5 pb-5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Future Enhancements */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold">Future Enhancements</h2>
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">Roadmap</span>
        </div>
        <div className="space-y-4">
          {FUTURE_FEATURES.map(({ icon: Icon, title, badge, desc, points }) => (
            <Card key={title} className="border shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-medium">{badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{desc}</p>
                    <ul className="space-y-1">
                      {points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Project info */}
      <Card className="border shadow-sm bg-muted/30">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            SmartSpend — MCA Final Year Project · Built with the MERN Stack · Desktop Web Application
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
