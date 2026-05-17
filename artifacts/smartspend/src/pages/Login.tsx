import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  const login = useLogin();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: FormValues) => {
    login.mutate(
      { data: values },
      {
        onSuccess: (res) => {
          setToken(res.token);
          setLocation("/");
        },
        onError: (err: unknown) => {
          const message = (err as { data?: { error?: string } })?.data?.error ?? "Invalid credentials";
          toast({ title: "Login failed", description: message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">SmartSpend</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug">
            Track every rupee.<br />Plan every month.
          </h2>
          <p className="mt-4 text-sidebar-foreground/60 text-base leading-relaxed">
            A clean, powerful expense tracker and budget planner built for students and professionals who want real control over their finances.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Expense categories", value: "8+" },
            { label: "Budget tracking", value: "Real-time" },
            { label: "Monthly analytics", value: "6 months" },
            { label: "Secure auth", value: "JWT" },
          ].map((item) => (
            <div key={item.label} className="bg-sidebar-accent rounded-lg px-4 py-3">
              <div className="text-lg font-bold text-white">{item.value}</div>
              <div className="text-xs text-sidebar-foreground/50 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold">SmartSpend</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign in to your account</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input data-testid="input-email" type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input data-testid="input-password" type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button data-testid="button-login" type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline" data-testid="link-register">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
