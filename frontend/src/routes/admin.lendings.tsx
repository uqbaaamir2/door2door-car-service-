import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { HandCoins, Pencil, Plus, Trash2 } from "lucide-react";
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

type Lending = {
  id: number;
  title: string;
  amount: number;
  collected_amount: number;
  category: string | null;
  notes: string | null;
  created_at: string;
};

type LendingFormState = {
  title: string;
  amount: string;
  collected_amount: string;
  category: string;
  notes: string;
};

const emptyLendingForm: LendingFormState = {
  title: "",
  amount: "0",
  collected_amount: "0",
  category: "",
  notes: "",
};

export const Route = createFileRoute("/admin/lendings")({
  head: () => ({
    meta: [{ title: "MotorMate Lendings" }],
  }),
  component: AdminLendingsPage,
});

function AdminLendingsPage() {
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const [lendingModalOpen, setLendingModalOpen] = useState(false);
  const [editingLending, setEditingLending] = useState<Lending | null>(null);
  const [lendingForm, setLendingForm] = useState<LendingFormState>(emptyLendingForm);

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

  const lendingsQuery = useQuery({
    queryKey: ["admin-lendings", session.token],
    queryFn: () => apiFetch<Lending[]>("/api/admin/lendings", {}, true),
    enabled: Boolean(session.token),
  });

  const invalidateLendingQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-lendings"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
    ]);
  };

  const addLendingMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<Lending>(
        "/api/admin/lendings",
        {
          method: "POST",
          body: JSON.stringify({
            title: lendingForm.title,
            amount: Number(lendingForm.amount || 0),
            collected_amount: Number(lendingForm.collected_amount || 0),
            category: lendingForm.category || null,
            notes: lendingForm.notes || null,
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Lending added");
      closeLendingModal();
      await invalidateLendingQueries();
    },
    onError: (error) => {
      toast.error(`Unable to add lending: ${error.message}`);
    },
  });

  const updateLendingMutation = useMutation({
    mutationFn: async () => {
      if (!editingLending) {
        throw new Error("No lending selected");
      }
      return apiFetch<Lending>(
        `/api/admin/lendings/${editingLending.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: lendingForm.title,
            amount: Number(lendingForm.amount || 0),
            collected_amount: Number(lendingForm.collected_amount || 0),
            category: lendingForm.category || null,
            notes: lendingForm.notes || null,
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Lending updated");
      closeLendingModal();
      await invalidateLendingQueries();
    },
    onError: (error) => {
      toast.error(`Unable to update lending: ${error.message}`);
    },
  });

  const deleteLendingMutation = useMutation({
    mutationFn: async (lendingId: number) => {
      return apiFetch<void>(`/api/admin/lendings/${lendingId}`, { method: "DELETE" }, true);
    },
    onSuccess: async () => {
      toast.success("Lending deleted");
      await invalidateLendingQueries();
    },
    onError: (error) => {
      toast.error(`Unable to delete lending: ${error.message}`);
    },
  });

  const resetLendingForm = () => {
    setLendingForm(emptyLendingForm);
  };

  const closeLendingModal = () => {
    setLendingModalOpen(false);
    setEditingLending(null);
    resetLendingForm();
  };

  const openAddLendingModal = () => {
    setEditingLending(null);
    resetLendingForm();
    setLendingModalOpen(true);
  };

  const openEditLendingModal = (lending: Lending) => {
    setEditingLending(lending);
    setLendingForm({
      title: lending.title,
      amount: String(lending.amount),
      collected_amount: String(lending.collected_amount),
      category: lending.category ?? "",
      notes: lending.notes ?? "",
    });
    setLendingModalOpen(true);
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

  const lendings = lendingsQuery.data ?? [];
  const saving = addLendingMutation.isPending || updateLendingMutation.isPending;

  return (
    <AdminShell
      section="lendings"
      title="Lendings"
      subtitle="Lent funds and collected repayment records."
      logout={session.logout}
      actions={
        <button
          onClick={openAddLendingModal}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="size-4" /> Add lending
        </button>
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-8">
        {lendingsQuery.isError && <Banner title="Unable to load lendings" message={lendingsQuery.error.message} />}

        <Panel title="Lendings" actionLabel={`${lendings.length} total`}>
          <Table
            headers={["Title", "Amount", "Collected", "Category", "Notes", "Recorded", "Actions"]}
            rows={lendings.map((lending) => [
              lending.title,
              `Rs ${Number(lending.amount ?? 0).toLocaleString()}`,
              `Rs ${Number(lending.collected_amount ?? 0).toLocaleString()}`,
              lending.category ?? "-",
              lending.notes ?? "-",
              new Date(lending.created_at).toLocaleDateString(),
              <div key={`actions-${lending.id}`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditLendingModal(lending)}
                  aria-label={`Edit ${lending.title}`}
                  title={`Edit ${lending.title}`}
                  className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete lending ${lending.title}?`)) {
                      deleteLendingMutation.mutate(lending.id);
                    }
                  }}
                  aria-label={`Delete ${lending.title}`}
                  title={`Delete ${lending.title}`}
                  disabled={deleteLendingMutation.isPending}
                  className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>,
            ])}
            emptyMessage="No lendings yet."
          />
        </Panel>
      </div>

      {lendingModalOpen && (
        <Modal title={editingLending ? `Edit lending #${editingLending.id}` : "Add lending"} onClose={closeLendingModal}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (editingLending) {
                updateLendingMutation.mutate();
              } else {
                addLendingMutation.mutate();
              }
            }}
          >
            <Field label="Title">
              <input
                value={lendingForm.title}
                onChange={(event) => setLendingForm((current) => ({ ...current, title: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={lendingForm.amount}
                  onChange={(event) => setLendingForm((current) => ({ ...current, amount: event.target.value }))}
                  className={inputBase}
                />
              </Field>
              <Field label="Collected amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={lendingForm.collected_amount}
                  onChange={(event) => setLendingForm((current) => ({ ...current, collected_amount: event.target.value }))}
                  className={inputBase}
                />
              </Field>
            </div>
            <Field label="Category">
              <input
                value={lendingForm.category}
                onChange={(event) => setLendingForm((current) => ({ ...current, category: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <Field label="Notes">
              <textarea
                rows={3}
                value={lendingForm.notes}
                onChange={(event) => setLendingForm((current) => ({ ...current, notes: event.target.value }))}
                className={`${inputBase} resize-none`}
              />
            </Field>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeLendingModal}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : editingLending ? "Save changes" : "Add lending"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
