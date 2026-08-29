import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PackagePlus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

import {
  AdminLoginCard,
  AdminShell,
  Banner,
  Field,
  InventoryFormState,
  InventoryItem,
  LoginResponse,
  Modal,
  Panel,
  Table,
  inventoryCategories,
  inputBase,
  useAdminSession,
} from "@/lib/admin-shared";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({
    meta: [{ title: "MotorMate Inventory" }],
  }),
  component: AdminInventoryPage,
});

function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [inventoryForm, setInventoryForm] = useState<InventoryFormState>({
    name: "",
    category: "oil",
    quantity: "0",
    unit: "pcs",
    cost_per_unit: "0",
  });

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

  const inventoryQuery = useQuery({
    queryKey: ["admin-inventory", session.token],
    queryFn: () => apiFetch<InventoryItem[]>("/api/admin/inventory", {}, true),
    enabled: Boolean(session.token),
  });

  const inventoryMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<InventoryItem>(
        "/api/admin/inventory",
        {
          method: "POST",
          body: JSON.stringify({
            name: inventoryForm.name,
            category: inventoryForm.category,
            quantity: Number(inventoryForm.quantity || 0),
            unit: inventoryForm.unit,
            cost_per_unit: Number(inventoryForm.cost_per_unit || 0),
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Inventory item added");
      setInventoryModalOpen(false);
      setInventoryForm({ name: "", category: "oil", quantity: "0", unit: "pcs", cost_per_unit: "0" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ itemId, form }: { itemId: number; form: InventoryFormState }) => {
      return apiFetch<InventoryItem>(
        `/api/admin/inventory/${itemId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            category: form.category,
            quantity: Number(form.quantity || 0),
            unit: form.unit,
            cost_per_unit: Number(form.cost_per_unit || 0),
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Inventory item updated");
      setInventoryModalOpen(false);
      setEditingItemId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiFetch<void>(`/api/admin/inventory/${itemId}`, { method: "DELETE" }, true);
    },
    onSuccess: async () => {
      toast.success("Inventory item deleted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
  });

  const resetInventoryForm = () => {
    setInventoryForm({ name: "", category: "oil", quantity: "0", unit: "pcs", cost_per_unit: "0" });
  };

  const closeInventoryModal = () => {
    setInventoryModalOpen(false);
    setEditingItemId(null);
    resetInventoryForm();
  };

  const openAddInventoryModal = () => {
    setEditingItemId(null);
    resetInventoryForm();
    setInventoryModalOpen(true);
  };

  const openEditInventoryModal = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setInventoryForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      cost_per_unit: String(item.cost_per_unit),
    });
    setInventoryModalOpen(true);
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

  const items = inventoryQuery.data ?? [];

  return (
    <AdminShell
      section="inventory"
      title="Inventory"
      subtitle="Stock items, quantities, and per-unit cost management."
      logout={session.logout}
      actions={
        <button
          onClick={openAddInventoryModal}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          <PackagePlus className="size-4" /> Add item
        </button>
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-8">
        {inventoryQuery.isError && <Banner title="Unable to load inventory" message={inventoryQuery.error.message} />}

        <Panel title="Inventory" actionLabel={`${items.length} total`}>
          <Table
            headers={["Item", "Category", "Quantity", "Unit", "Cost/unit", "Updated", "Actions"]}
            rows={items.map((item) => [
              item.name,
              item.category,
              `${item.quantity} ${item.unit}`,
              item.unit,
              `Rs ${Number(item.cost_per_unit ?? 0).toLocaleString()}`,
              new Date(item.created_at).toLocaleDateString(),
              <div className="flex items-center gap-2" key={`actions-${item.id}`}>
                <button
                  type="button"
                  onClick={() => openEditInventoryModal(item)}
                  aria-label={`Edit ${item.name}`}
                  title={`Edit ${item.name}`}
                  className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${item.name}?`)) {
                      deleteInventoryMutation.mutate(item.id);
                    }
                  }}
                  aria-label={`Delete ${item.name}`}
                  title={`Delete ${item.name}`}
                  disabled={deleteInventoryMutation.isPending}
                  className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>,
            ])}
            emptyMessage="No inventory items yet."
          />
        </Panel>
      </div>

      {inventoryModalOpen && (
        <Modal title={editingItemId === null ? "Add inventory item" : "Edit inventory item"} onClose={closeInventoryModal}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (editingItemId === null) {
                inventoryMutation.mutate();
              } else {
                updateInventoryMutation.mutate({ itemId: editingItemId, form: inventoryForm });
              }
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Item name">
                <input
                  value={inventoryForm.name}
                  onChange={(event) => setInventoryForm((current) => ({ ...current, name: event.target.value }))}
                  className={inputBase}
                />
              </Field>
              <Field label="Category">
                <select
                  value={inventoryForm.category}
                  onChange={(event) => setInventoryForm((current) => ({ ...current, category: event.target.value }))}
                  className={inputBase}
                >
                  {inventoryCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inventoryForm.quantity}
                  onChange={(event) => setInventoryForm((current) => ({ ...current, quantity: event.target.value }))}
                  className={inputBase}
                />
              </Field>
              <Field label="Unit">
                <input
                  value={inventoryForm.unit}
                  onChange={(event) => setInventoryForm((current) => ({ ...current, unit: event.target.value }))}
                  className={inputBase}
                />
              </Field>
              <Field label="Cost per unit">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inventoryForm.cost_per_unit}
                  onChange={(event) => setInventoryForm((current) => ({ ...current, cost_per_unit: event.target.value }))}
                  className={inputBase}
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeInventoryModal}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inventoryMutation.isPending || updateInventoryMutation.isPending}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {inventoryMutation.isPending || updateInventoryMutation.isPending
                  ? "Saving..."
                  : editingItemId === null
                    ? "Add inventory"
                    : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
