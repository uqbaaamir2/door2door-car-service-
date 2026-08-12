import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";
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
          onClick={() => setInventoryModalOpen(true)}
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
            headers={["Item", "Category", "Quantity", "Unit", "Cost/unit", "Updated"]}
            rows={items.map((item) => [
              item.name,
              item.category,
              `${item.quantity} ${item.unit}`,
              item.unit,
              `Rs ${Number(item.cost_per_unit ?? 0).toLocaleString()}`,
              new Date(item.created_at).toLocaleDateString(),
            ])}
            emptyMessage="No inventory items yet."
          />
        </Panel>
      </div>

      {inventoryModalOpen && (
        <Modal title="Add inventory item" onClose={() => setInventoryModalOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              inventoryMutation.mutate();
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
                onClick={() => setInventoryModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inventoryMutation.isPending}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {inventoryMutation.isPending ? "Saving..." : "Add inventory"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
