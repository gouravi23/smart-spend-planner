import { useState } from "react";
import { useGetExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, getGetExpensesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Expense } from "@workspace/api-client-react";
// Expense type from generated schemas: { id, title, amount, category, date, description?, createdAt }

const CATEGORIES = ["Food", "Travel", "Bills", "Shopping", "Education", "Health", "Entertainment", "Other"] as const;
const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-100 text-orange-700",
  Travel: "bg-blue-100 text-blue-700",
  Bills: "bg-red-100 text-red-700",
  Shopping: "bg-pink-100 text-pink-700",
  Education: "bg-indigo-100 text-indigo-700",
  Health: "bg-green-100 text-green-700",
  Entertainment: "bg-purple-100 text-purple-700",
  Other: "bg-gray-100 text-gray-700",
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Expenses() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 15,
    ...(filterCategory && filterCategory !== "all" ? { category: filterCategory } : {}),
    ...(filterStart ? { startDate: filterStart } : {}),
    ...(filterEnd ? { endDate: filterEnd } : {}),
  };

  const { data, isLoading } = useGetExpenses(params, { query: { queryKey: getGetExpensesQueryKey(params) } });
  const createExp = useCreateExpense();
  const updateExp = useUpdateExpense();
  const deleteExp = useDeleteExpense();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetExpensesQueryKey() });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", amount: 0, category: "", date: new Date().toISOString().slice(0, 10), description: "" },
  });

  const openAdd = () => {
    setEditTarget(null);
    form.reset({ title: "", amount: 0, category: "", date: new Date().toISOString().slice(0, 10), description: "" });
    setDialogOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditTarget(e);
    form.reset({
      title: e.title,
      amount: e.amount,
      category: e.category,
      date: e.date.slice(0, 10),
      description: e.description ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    if (editTarget) {
      updateExp.mutate(
        { id: editTarget.id, data: values },
        {
          onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Expense updated" }); },
          onError: () => toast({ title: "Failed to update", variant: "destructive" }),
        }
      );
    } else {
      createExp.mutate(
        { data: values },
        {
          onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Expense added" }); },
          onError: () => toast({ title: "Failed to add", variant: "destructive" }),
        }
      );
    }
  };

  const confirmDelete = (id: string) => setDeleteId(id);
  const doDelete = () => {
    if (!deleteId) return;
    deleteExp.mutate(
      { id: deleteId },
      {
        onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Expense deleted" }); },
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage your spending</p>
        </div>
        <Button onClick={openAdd} data-testid="button-add-expense">
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card className="border shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
              <SelectTrigger className="w-40" data-testid="filter-category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={filterStart} onChange={(e) => { setFilterStart(e.target.value); setPage(1); }} className="w-40" data-testid="filter-start-date" />
            <Input type="date" value={filterEnd} onChange={(e) => { setFilterEnd(e.target.value); setPage(1); }} className="w-40" data-testid="filter-end-date" />
            {(filterCategory || filterStart || filterEnd) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterCategory(""); setFilterStart(""); setFilterEnd(""); setPage(1); }}>
                Clear filters
              </Button>
            )}
            {data && <span className="ml-auto text-xs text-muted-foreground">{data.total} result{data.total !== 1 ? "s" : ""}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-0 pt-4 px-5">
          <CardTitle className="text-sm font-semibold">Expense History</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-5 py-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-5 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        <td className="px-5 py-3" />
                      </tr>
                    ))
                  : data?.expenses.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground text-sm">No expenses found</td>
                    </tr>
                  )
                  : data?.expenses.map((e) => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`expense-row-${e.id}`}>
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-foreground">{e.title}</p>
                          {e.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{e.description}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-xs border-0 font-medium", CATEGORY_COLORS[e.category] ?? "bg-gray-100 text-gray-700")}>
                          {e.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground">{fmt(e.amount)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(e)} data-testid={`button-edit-${e.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-destructive" onClick={() => confirmDelete(e.id)} data-testid={`button-delete-${e.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
              <span className="text-xs text-muted-foreground">Page {data.page} of {data.totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)} data-testid="button-prev-page">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7" disabled={page === data.totalPages} onClick={() => setPage((p) => p + 1)} data-testid="button-next-page">
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input data-testid="input-title" placeholder="e.g. Lunch at Subway" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl><Input data-testid="input-amount" type="number" min={0} step="0.01" placeholder="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input data-testid="input-date" type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl><Textarea data-testid="input-description" placeholder="Add a note..." className="resize-none h-20" {...field} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createExp.isPending || updateExp.isPending} data-testid="button-save-expense">
                  {editTarget ? (updateExp.isPending ? "Saving..." : "Save changes") : (createExp.isPending ? "Adding..." : "Add expense")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete expense?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete} disabled={deleteExp.isPending} data-testid="button-confirm-delete">
              {deleteExp.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
