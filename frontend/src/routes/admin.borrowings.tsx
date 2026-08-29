import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Pencil, Plus, Trash2 } from "lucide-react";
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

type Borrowing = {
  id: number;
  title: string;
  amount: number;
  repaid_amount: number;
  category: string | null;
  notes: string | null;
  created_at: string;
};

type BorrowingFormState = {
  title: string;
  amount: string;
  repaid_amount: string;
  category: string;
  notes: string;
};

const emptyBorrowingForm: BorrowingFormState = {
  title: "",
  amount: "0",
  repaid_amount: "0",
  category: "",
  notes: "",
};

export const Route = createFileRoute("/admin/borrowings")({
  head: () => ({
    meta: [{ title: "MotorMate Borrowings" }],
  }),
  component: AdminBorrowingsPage,
});

function AdminBorrowingsPage() {
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const [borrowingModalOpen, setBorrowingModalOpen] = useState(false);
  const [editingBorrowing, setEditingBorrowing] = useState<Borrowing | null>(null);
  const [borrowingForm, setBorrowingForm] = useState<BorrowingFormState>(emptyBorrowingForm);

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

  const borrowingsQuery = useQuery({
    queryKey: ["admin-borrowings", session.token],
    queryFn: () => apiFetch<Borrowing[]>("/api/admin/borrowings", {}, true),
    enabled: Boolean(session.token),
  });

  const invalidateBorrowingQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-borrowings"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
    ]);
  };

  const addBorrowingMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<Borrowing>(
        "/api/admin/borrowings",
        {
          method: "POST",
          body: JSON.stringify({
            title: borrowingForm.title,
            amount: Number(borrowingForm.amount || 0),
            repaid_amount: Number(borrowingForm.repaid_amount || 0),
            category: borrowingForm.category || null,
            notes: borrowingForm.notes || null,
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Borrowing added");
      closeBorrowingModal();
      await invalidateBorrowingQueries();
    },
    onError: (error) => {
      toast.error(`Unable to add borrowing: ${error.message}`);
    },
  });

  const updateBorrowingMutation = useMutation({
    mutationFn: async () => {
      if (!editingBorrowing) {
        throw new Error("No borrowing selected");
      }
      return apiFetch<Borrowing>(
        `/api/admin/borrowings/${editingBorrowing.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: borrowingForm.title,
            amount: Number(borrowingForm.amount || 0),
            repaid_amount: Number(borrowingForm.repaid_amount || 0),
            category: borrowingForm.category || null,
            notes: borrowingForm.notes || null,
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Borrowing updated");
      closeBorrowingModal();
      await invalidateBorrowingQueries();
    },
    onError: (error) => {
      toast.error(`Unable to update borrowing: ${error.message}`);
    },
  });

  const deleteBorrowingMutation = useMutation({
    mutationFn: async (borrowingId: number) => {
      return apiFetch<void>(`/api/admin/borrowings/${borrowingId}`, { method: "DELETE" }, true);
    },
    onSuccess: async () => {
      toast.success("Borrowing deleted");
      await invalidateBorrowingQueries();
    },
    onError: (error) => {
      toast.error(`Unable to delete borrowing: ${error.message}`);
    },
  });

  const resetBorrowingForm = () => {
    setBorrowingForm(emptyBorrowingForm);
  };

  const closeBorrowingModal = () => {
    setBorrowingModalOpen(false);
    setEditingBorrowing(null);
    resetBorrowingForm();
  };

  const openAddBorrowingModal = () => {
    setEditingBorrowing(null);
    resetBorrowingForm();
    setBorrowingModalOpen(true);
  };

  const openEditBorrowingModal = (borrowing: Borrowing) => {
    setEditingBorrowing(borrowing);
    setBorrowingForm({
      title: borrowing.title,
      amount: String(borrowing.amount),
      repaid_amount: String(borrowing.repaid_amount),
      category: borrowing.category ?? "",
      notes: borrowing.notes ?? "",
    });
    setBorrowingModalOpen(true);
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

  const borrowings = borrowingsQuery.data ?? [];
  const saving = addBorrowingMutation.isPending || updateBorrowingMutation.isPending;

  return (
    <AdminShell
      section="borrowings"
      title="Borrowings"
      subtitle="Borrowed funds and repayment records."
      logout={session.logout}
      actions={
        <button
          onClick={openAddBorrowingModal}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="size-4" /> Add borrowing
        </button>
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-8">
        {borrowingsQuery.isError && <Banner title="Unable to load borrowings" message={borrowingsQuery.error.message} />}

        <Panel title="Borrowings" actionLabel={`${borrowings.length} total`}>
          <Table
            headers={["Title", "Amount", "Repaid", "Category", "Notes", "Recorded", "Actions"]}
            rows={borrowings.map((borrowing) => [
              borrowing.title,
              `Rs ${Number(borrowing.amount ?? 0).toLocaleString()}`,
              `Rs ${Number(borrowing.repaid_amount ?? 0).toLocaleString()}`,
              borrowing.category ?? "-",
              borrowing.notes ?? "-",
              new Date(borrowing.created_at).toLocaleDateString(),
              <div key={`actions-${borrowing.id}`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditBorrowingModal(borrowing)}
                  aria-label={`Edit ${borrowing.title}`}
                  title={`Edit ${borrowing.title}`}
                  className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete borrowing ${borrowing.title}?`)) {
                      deleteBorrowingMutation.mutate(borrowing.id);
                    }
                  }}
                  aria-label={`Delete ${borrowing.title}`}
                  title={`Delete ${borrowing.title}`}
                  disabled={deleteBorrowingMutation.isPending}
                  className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>,
            ])}
            emptyMessage="No borrowings yet."
          />
        </Panel>
      </div>

      {borrowingModalOpen && (
        <Modal title={editingBorrowing ? `Edit borrowing #${editingBorrowing.id}` : "Add borrowing"} onClose={closeBorrowingModal}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (editingBorrowing) {
                updateBorrowingMutation.mutate();
              } else {
                addBorrowingMutation.mutate();
              }
            }}
          >
            <Field label="Title">
              <input
                value={borrowingForm.title}
                onChange={(event) => setBorrowingForm((current) => ({ ...current, title: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={borrowingForm.amount}
                  onChange={(event) => setBorrowingForm((current) => ({ ...current, amount: event.target.value }))}
                  className={inputBase}
                />
              </Field>
              <Field label="Repaid amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={borrowingForm.repaid_amount}
                  onChange={(event) => setBorrowingForm((current) => ({ ...current, repaid_amount: event.target.value }))}
                  className={inputBase}
                />
              </Field>
            </div>
            <Field label="Category">
              <input
                value={borrowingForm.category}
                onChange={(event) => setBorrowingForm((current) => ({ ...current, category: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <Field label="Notes">
              <textarea
                rows={3}
                value={borrowingForm.notes}
                onChange={(event) => setBorrowingForm((current) => ({ ...current, notes: event.target.value }))}
                className={`${inputBase} resize-none`}
              />
            </Field>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeBorrowingModal}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : editingBorrowing ? "Save changes" : "Add borrowing"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
