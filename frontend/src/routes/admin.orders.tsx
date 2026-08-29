import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

import {
  AdminLoginCard,
  AdminShell,
  Banner,
  Field,
  InfoBlock,
  InventoryItem,
  LoginResponse,
  Modal,
  Order,
  OrderFormState,
  Panel,
  ReceiptResponse,
  SummaryChip,
  Table,
  TeamMember,
  inputBase,
  useAdminSession,
} from "@/lib/admin-shared";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [{ title: "MotorMate Orders" }],
  }),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const [receiptOrderId, setReceiptOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    status: "pending",
    assigned_team_member_id: "",
    collected_amount: "0",
    staff_payment_amount: "0",
    notes: "",
    inventory_usage: [],
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

  const ordersQuery = useQuery({
    queryKey: ["admin-orders", session.token],
    queryFn: () => apiFetch<Order[]>("/api/admin/orders", {}, true),
    enabled: Boolean(session.token),
  });

  const teamQuery = useQuery({
    queryKey: ["admin-team", session.token],
    queryFn: () => apiFetch<TeamMember[]>("/api/admin/team-members", {}, true),
    enabled: Boolean(session.token),
  });

  const inventoryQuery = useQuery({
    queryKey: ["admin-inventory", session.token],
    queryFn: () => apiFetch<InventoryItem[]>("/api/admin/inventory", {}, true),
    enabled: Boolean(session.token),
  });

  const receiptQuery = useQuery({
    queryKey: ["admin-receipt", session.token, receiptOrderId],
    queryFn: () => apiFetch<ReceiptResponse>(`/api/admin/orders/${receiptOrderId}/receipt`, {}, true),
    enabled: Boolean(session.token && receiptOrderId),
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) {
        throw new Error("No order selected");
      }

      const cleanedUsage = orderForm.inventory_usage
        .map((usage) => ({
          inventory_item_id: Number(usage.inventory_item_id),
          quantity_used: Number(usage.quantity_used),
        }))
        .filter((usage) => Number.isFinite(usage.inventory_item_id) && Number.isFinite(usage.quantity_used) && usage.quantity_used > 0);

      return apiFetch<Order>(
        `/api/admin/orders/${selectedOrder.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: orderForm.status,
            collected_amount: Number(orderForm.collected_amount || 0),
            staff_payment_amount: Number(orderForm.staff_payment_amount || 0),
            assigned_team_member_id: orderForm.assigned_team_member_id ? Number(orderForm.assigned_team_member_id) : null,
            notes: orderForm.notes || null,
            inventory_usage: cleanedUsage,
          }),
        },
        true,
      );
    },
    onSuccess: async (response) => {
      toast.success("Order updated");
      setOrderModalOpen(false);
      setSelectedOrder(null);
      if (response.status === "completed") {
        setReceiptOrderId(response.id);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
    onError: (error) => {
      toast.error(`Unable to update order: ${error.message}`);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiFetch<void>(`/api/admin/orders/${orderId}`, { method: "DELETE" }, true);
    },
    onSuccess: async () => {
      toast.success("Order deleted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
    onError: (error) => {
      toast.error(`Unable to delete order: ${error.message}`);
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

  const orders = ordersQuery.data ?? [];
  const team = teamQuery.data ?? [];
  const inventory = inventoryQuery.data ?? [];
  const receipt = receiptQuery.data;

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setOrderForm({
      status: order.status,
      assigned_team_member_id: order.assigned_team_member_id ? String(order.assigned_team_member_id) : "",
      collected_amount: String(order.collected_amount ?? 0),
      staff_payment_amount: String(order.staff_payment_amount ?? 0),
      notes: order.notes ?? "",
      inventory_usage:
        order.inventory_usages.length > 0
          ? order.inventory_usages.map((usage) => ({
              inventory_item_id: String(usage.inventory_item_id),
              quantity_used: String(usage.quantity_used),
            }))
          : [{ inventory_item_id: "", quantity_used: "" }],
    });
    setOrderModalOpen(true);
  };

  const addInventoryRow = () => {
    setOrderForm((current) => ({
      ...current,
      inventory_usage: [...current.inventory_usage, { inventory_item_id: "", quantity_used: "" }],
    }));
  };

  const updateInventoryRow = (index: number, field: keyof OrderFormState["inventory_usage"][number], value: string) => {
    setOrderForm((current) => ({
      ...current,
      inventory_usage: current.inventory_usage.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const removeInventoryRow = (index: number) => {
    setOrderForm((current) => {
      const rows = current.inventory_usage.filter((_, rowIndex) => rowIndex !== index);
      return {
        ...current,
        inventory_usage: rows.length > 0 ? rows : [{ inventory_item_id: "", quantity_used: "" }],
      };
    });
  };

  return (
    <AdminShell section="orders" title="Orders" subtitle="Service orders, staff assignment, and receipts." logout={session.logout}>
      <div className="mx-auto max-w-[1500px] space-y-8">
        {(ordersQuery.isError || teamQuery.isError || inventoryQuery.isError) && (
          <Banner
            title="Unable to load order data"
            message={ordersQuery.error?.message ?? teamQuery.error?.message ?? inventoryQuery.error?.message ?? "Unknown error"}
          />
        )}

        <Panel title="Orders" actionLabel={`${orders.length} total`}>
          <Table
            headers={["Customer", "Service", "Status", "Staff", "Collected", "Inventory cost", "Action"]}
            rows={orders.map((order) => [
              order.customer.name,
              order.service_subcategory,
              <span key={`status-${order.id}`}>{order.status}</span>,
              team.find((member) => member.id === order.assigned_team_member_id)?.name ?? "Unassigned",
              `Rs ${Number(order.collected_amount ?? 0).toLocaleString()}`,
              `Rs ${Number(order.inventory_cost_amount ?? 0).toLocaleString()}`,
              <div key={`actions-${order.id}`} className="flex items-center justify-end gap-2">
                <button
                  onClick={() => openOrderModal(order)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Update
                </button>
                <button
                  onClick={() => setReceiptOrderId(order.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700"
                >
                  Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete order #${order.id}?`)) {
                      deleteOrderMutation.mutate(order.id);
                    }
                  }}
                  aria-label={`Delete order #${order.id}`}
                  title={`Delete order #${order.id}`}
                  disabled={deleteOrderMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>,
            ])}
            emptyMessage="No orders yet."
          />
        </Panel>
      </div>

      {orderModalOpen && selectedOrder && (
        <Modal title={`Update Order #${selectedOrder.id}`} onClose={() => setOrderModalOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              orderMutation.mutate();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Status">
                <select
                  value={orderForm.status}
                  onChange={(event) => setOrderForm((current) => ({ ...current, status: event.target.value as Order["status"] }))}
                  className={inputBase}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
              <Field label="Assign staff">
                <select
                  value={orderForm.assigned_team_member_id}
                  onChange={(event) => setOrderForm((current) => ({ ...current, assigned_team_member_id: event.target.value }))}
                  className={inputBase}
                >
                  <option value="">Unassigned</option>
                  {team.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Collected amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderForm.collected_amount}
                  onChange={(event) => setOrderForm((current) => ({ ...current, collected_amount: event.target.value }))}
                  className={inputBase}
                />
              </Field>
              <Field label="Staff payment">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderForm.staff_payment_amount}
                  onChange={(event) => setOrderForm((current) => ({ ...current, staff_payment_amount: event.target.value }))}
                  className={inputBase}
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                rows={3}
                value={orderForm.notes}
                onChange={(event) => setOrderForm((current) => ({ ...current, notes: event.target.value }))}
                className={`${inputBase} resize-none`}
              />
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Inventory used</h3>
                <button type="button" onClick={addInventoryRow} className="text-sm font-semibold text-cyan-700">
                  Add row
                </button>
              </div>

              <div className="space-y-3">
                {orderForm.inventory_usage.map((row, index) => (
                  <div key={index} className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_auto]">
                    <select
                      value={row.inventory_item_id}
                      onChange={(event) => updateInventoryRow(index, "inventory_item_id", event.target.value)}
                      className={inputBase}
                    >
                      <option value="">Select item</option>
                      {inventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.quantity} {item.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Qty used"
                      value={row.quantity_used}
                      onChange={(event) => updateInventoryRow(index, "quantity_used", event.target.value)}
                      className={inputBase}
                    />
                    <button
                      type="button"
                      onClick={() => removeInventoryRow(index)}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={orderMutation.isPending}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {orderMutation.isPending ? "Saving..." : "Save order"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {receipt && receiptOrderId !== null && (
        <Modal title={`Receipt #${receipt.order.id}`} onClose={() => setReceiptOrderId(null)}>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock label="Customer" value={receipt.order.customer.name} />
              <InfoBlock label="Phone" value={receipt.order.customer.phone_number} />
              <InfoBlock label="Service" value={receipt.order.service_subcategory} />
              <InfoBlock label="Location" value={receipt.order.location} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-4 py-3">Inventory</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Unit cost</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.inventory_usages.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={4}>
                        No inventory used.
                      </td>
                    </tr>
                  ) : (
                    receipt.inventory_usages.map((usage) => (
                      <tr key={usage.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">Item #{usage.inventory_item_id}</td>
                        <td className="px-4 py-3">{usage.quantity_used}</td>
                        <td className="px-4 py-3">Rs {usage.unit_cost.toLocaleString()}</td>
                        <td className="px-4 py-3">Rs {usage.total_cost.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <SummaryChip label="Revenue" value={`Rs ${receipt.revenue.toLocaleString()}`} />
              <SummaryChip label="Inventory Cost" value={`Rs ${receipt.inventory_costs.toLocaleString()}`} />
              <SummaryChip label="Staff Payment" value={`Rs ${receipt.staff_payments.toLocaleString()}`} />
              <SummaryChip label="Direct Costs" value={`Rs ${receipt.direct_costs.toLocaleString()}`} />
              <SummaryChip label="Profit" value={`Rs ${receipt.profit.toLocaleString()}`} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Print receipt
              </button>
              <button
                type="button"
                onClick={() => setReceiptOrderId(null)}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
