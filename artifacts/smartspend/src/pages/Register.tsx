import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  const register = useRegister();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (values: FormValues) => {
    register.mutate(
      { data: values },
      {
        onSuccess: (res) => {
          setToken(res.token);
          setLocation("/");
        },
        onError: (err: unknown) => {
          let message = "Registration failed";

          try {
            const parsed =
              typeof err === "object" && err && "message" in err
                ? JSON.parse((err as Error).message)
                : null;

            message = parsed?.error ?? message;
          } catch {
            // fallback already set
          }

          toast({
            title: "Registration failed",
            description: message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">SmartSpend</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-snug">
            Start taking control<br />of your finances.
          </h2>
          <p className="mt-4 text-sidebar-foreground/60 text-base">
            Create a free account and start tracking your expenses, planning budgets, and understanding your spending patterns today.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            "Add expenses with categories",
            "Set monthly budget limits",
            "Visualize spending with charts",
            "Secure JWT authentication",
          ].map((f) => (
            <div
              key={f}
              className="flex items-center gap-3 text-sidebar-foreground/70 text-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Free forever, no credit card required
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
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
                      <Input type="password" placeholder="Min 6 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={register.isPending}
              >
                {register.isPending ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}