import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

import {
  AdminLoginCard,
  AdminShell,
  Banner,
  Field,
  LoginResponse,
  Modal,
  Panel,
  Table,
  inputBase,
  useAdminSession,
} from "@/lib/admin-shared";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string | null;
  created_at: string;
};

type ExpenseFormState = {
  title: string;
  amount: string;
  category: string;
};

const emptyExpenseForm: ExpenseFormState = { title: "", amount: "0", category: "" };

export const Route = createFileRoute("/admin/expenses")({
  head: () => ({
    meta: [{ title: "MotorMate Expenses" }],
  }),
  component: AdminExpensesPage,
});

function AdminExpensesPage() {
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(emptyExpenseForm);

  const loginMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<LoginResponse>(
        "/api/admin/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ username: session.username, password: session.password }),
        },
        false,
      );
    },
    onSuccess: (response) => {
      session.login(response.access_token);
    },
  });

  const expensesQuery = useQuery({
    queryKey: ["admin-expenses", session.token],
    queryFn: () => apiFetch<Expense[]>("/api/admin/expenses", {}, true),
    enabled: Boolean(session.token),
  });

  const invalidateExpenseQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
    ]);
  };

  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<Expense>(
        "/api/admin/expenses",
        {
          method: "POST",
          body: JSON.stringify({
            title: expenseForm.title,
            amount: Number(expenseForm.amount || 0),
            category: expenseForm.category || null,
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Expense added");
      closeExpenseModal();
      await invalidateExpenseQueries();
    },
    onError: (error) => {
      toast.error(`Unable to add expense: ${error.message}`);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async () => {
      if (!editingExpense) {
        throw new Error("No expense selected");
      }
      return apiFetch<Expense>(
        `/api/admin/expenses/${editingExpense.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: expenseForm.title,
            amount: Number(expenseForm.amount || 0),
            category: expenseForm.category || null,
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Expense updated");
      closeExpenseModal();
      await invalidateExpenseQueries();
    },
    onError: (error) => {
      toast.error(`Unable to update expense: ${error.message}`);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      return apiFetch<void>(`/api/admin/expenses/${expenseId}`, { method: "DELETE" }, true);
    },
    onSuccess: async () => {
      toast.success("Expense deleted");
      await invalidateExpenseQueries();
    },
    onError: (error) => {
      toast.error(`Unable to delete expense: ${error.message}`);
    },
  });

  const resetExpenseForm = () => {
    setExpenseForm(emptyExpenseForm);
  };

  const closeExpenseModal = () => {
    setExpenseModalOpen(false);
    setEditingExpense(null);
    resetExpenseForm();
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    resetExpenseForm();
    setExpenseModalOpen(true);
  };

  const openEditExpenseModal = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category ?? "",
    });
    setExpenseModalOpen(true);
  };

  if (!session.token) {
    return (
      <AdminLoginCard
        username={session.username}
        password={session.password}
        setUsername={session.setUsername}
        setPassword={session.setPassword}
        onSubmit={() => loginMutation.mutate()}
        pending={loginMutation.isPending}
      />
    );
  }

  const expenses = expensesQuery.data ?? [];
  const saving = addExpenseMutation.isPending || updateExpenseMutation.isPending;

  return (
    <AdminShell
      section="expenses"
      title="Expenses"
      subtitle="Business expenses and accounting records."
      logout={session.logout}
      actions={
        <button
          onClick={openAddExpenseModal}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="size-4" /> Add expense
        </button>
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-8">
        {expensesQuery.isError && <Banner title="Unable to load expenses" message={expensesQuery.error.message} />}

        <Panel title="Expenses" actionLabel={`${expenses.length} total`}>
          <Table
            headers={["Title", "Amount", "Category", "Recorded", "Actions"]}
            rows={expenses.map((expense) => [
              expense.title,
              `Rs ${Number(expense.amount ?? 0).toLocaleString()}`,
              expense.category ?? "-",
              new Date(expense.created_at).toLocaleDateString(),
              <div key={`actions-${expense.id}`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditExpenseModal(expense)}
                  aria-label={`Edit ${expense.title}`}
                  title={`Edit ${expense.title}`}
                  className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete expense ${expense.title}?`)) {
                      deleteExpenseMutation.mutate(expense.id);
                    }
                  }}
                  aria-label={`Delete ${expense.title}`}
                  title={`Delete ${expense.title}`}
                  disabled={deleteExpenseMutation.isPending}
                  className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>,
            ])}
            emptyMessage="No expenses yet."
          />
        </Panel>
      </div>

      {expenseModalOpen && (
        <Modal title={editingExpense ? `Edit expense #${editingExpense.id}` : "Add expense"} onClose={closeExpenseModal}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (editingExpense) {
                updateExpenseMutation.mutate();
              } else {
                addExpenseMutation.mutate();
              }
            }}
          >
            <Field label="Title">
              <input
                value={expenseForm.title}
                onChange={(event) => setExpenseForm((current) => ({ ...current, title: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <Field label="Amount">
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <Field label="Category">
              <input
                value={expenseForm.category}
                onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeExpenseModal}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : editingExpense ? "Save changes" : "Add expense"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
