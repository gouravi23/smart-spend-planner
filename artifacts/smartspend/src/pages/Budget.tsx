import { useState } from "react";
import { useGetBudget, useSetBudget, getGetBudgetQueryKey, getGetSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Food", "Travel", "Bills", "Shopping", "Education", "Health", "Entertainment", "Other"] as const;

const schema = z.object({
  totalLimit: z.coerce.number().min(0, "Must be 0 or more"),
  categoryLimits: z.array(z.object({
    category: z.string().min(1),
    limit: z.coerce.number().min(0),
  })),
});
type FormValues = z.infer<typeof schema>;

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-500",
  Travel: "bg-blue-500",
  Bills: "bg-red-500",
  Shopping: "bg-pink-500",
  Education: "bg-indigo-500",
  Health: "bg-green-500",
  Entertainment: "bg-purple-500",
  Other: "bg-gray-500",
};

export default function Budget() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: budget, isLoading } = useGetBudget();
  const setBudget = useSetBudget();
  const [editing, setEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { totalLimit: 0, categoryLimits: [] },
    values: budget ? { totalLimit: budget.totalLimit, categoryLimits: budget.categoryLimits } : undefined,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "categoryLimits" });

  const onSubmit = (values: FormValues) => {
    setBudget.mutate(
      { data: values },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetBudgetQueryKey() });
          qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          setEditing(false);
          toast({ title: "Budget updated" });
        },
        onError: () => toast({ title: "Failed to update budget", variant: "destructive" }),
      }
    );
  };

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">{monthLabel}</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} data-testid="button-edit-budget">
            Edit Budget
          </Button>
        )}
      </div>

      {/* Overview */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : budget && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Budget", value: fmt(budget.totalLimit), sub: "Monthly limit" },
            { label: "Spent", value: fmt(budget.spent), sub: `${budget.totalLimit > 0 ? Math.round((budget.spent / budget.totalLimit) * 100) : 0}% used` },
            { label: "Remaining", value: fmt(budget.remaining), sub: budget.remaining < 0 ? "Over budget" : "Available", danger: budget.remaining < 0 },
          ].map(({ label, value, sub, danger }) => (
            <Card key={label} className="border shadow-sm">
              <CardContent className="pt-5 pb-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">{label}</p>
                <p className={cn("text-2xl font-bold", danger ? "text-destructive" : "text-foreground")} data-testid={`budget-stat-${label.toLowerCase().replace(/ /g, "-")}`}>{value}</p>
                <p className={cn("text-xs mt-1", danger ? "text-destructive/70" : "text-muted-foreground")}>{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Overall progress bar */}
      {!isLoading && budget && budget.totalLimit > 0 && (
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall budget</span>
              <span className={cn("font-bold", budget.spent > budget.totalLimit ? "text-destructive" : "text-primary")}>
                {Math.round((budget.spent / budget.totalLimit) * 100)}%
              </span>
            </div>
            <Progress
              value={Math.min((budget.spent / budget.totalLimit) * 100, 100)}
              className="h-3"
              data-testid="overall-budget-progress"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{fmt(budget.spent)} spent</span>
              <span>{fmt(budget.totalLimit)} limit</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit form */}
      {editing ? (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Set Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="totalLimit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total monthly limit (₹)</FormLabel>
                    <FormControl>
                      <Input data-testid="input-total-limit" type="number" min={0} placeholder="e.g. 30000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">Category limits</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ category: CATEGORIES[0], limit: 0 })}
                      data-testid="button-add-category-limit"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {fields.map((field, i) => (
                      <div key={field.id} className="flex items-end gap-3">
                        <FormField control={form.control} name={`categoryLimits.${i}.category`} render={({ field: f }) => (
                          <FormItem className="flex-1">
                            {i === 0 && <FormLabel className="text-xs">Category</FormLabel>}
                            <FormControl>
                              <select
                                {...f}
                                data-testid={`select-cat-${i}`}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`categoryLimits.${i}.limit`} render={({ field: f }) => (
                          <FormItem className="flex-1">
                            {i === 0 && <FormLabel className="text-xs">Limit (₹)</FormLabel>}
                            <FormControl>
                              <Input data-testid={`input-cat-limit-${i}`} type="number" min={0} placeholder="0" {...f} />
                            </FormControl>
                          </FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 mb-0 hover:text-destructive" onClick={() => remove(i)} data-testid={`button-remove-cat-${i}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={setBudget.isPending} data-testid="button-save-budget">
                    <Save className="w-3.5 h-3.5 mr-2" />
                    {setBudget.isPending ? "Saving..." : "Save budget"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        /* Category progress display */
        !isLoading && budget && budget.categoryLimits.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Category Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {budget.categoryLimits.map(({ category, limit }) => {
                  const barColor = CATEGORY_COLORS[category] ?? "bg-gray-500";
                  return (
                    <div key={category} data-testid={`category-budget-${category}`}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">{category}</span>
                        <span className="text-muted-foreground text-xs">{fmt(limit)} limit</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={cn("h-2 rounded-full", barColor)} style={{ width: "0%" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )
      )}

      {!isLoading && budget && budget.totalLimit === 0 && !editing && (
        <Card className="border shadow-sm border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No budget set for this month.</p>
            <Button className="mt-4" onClick={() => setEditing(true)} data-testid="button-set-first-budget">
              Set your budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
