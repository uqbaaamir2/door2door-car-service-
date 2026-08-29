import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

import {
  AdminLoginCard,
  AdminShell,
  Customer,
  Field,
  inputBase,
  LoginResponse,
  Modal,
  Panel,
  Table,
  useAdminSession,
} from "@/lib/admin-shared";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({
    meta: [{ title: "MotorMate Customers" }],
  }),
  component: AdminCustomersPage,
});

function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: "", phone_number: "", location: "" });

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

  const customersQuery = useQuery({
    queryKey: ["admin-customers", session.token],
    queryFn: () => apiFetch<Customer[]>("/api/admin/customers", {}, true),
    enabled: Boolean(session.token),
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!editingCustomer) {
        throw new Error("No customer selected");
      }
      return apiFetch<Customer>(
        `/api/admin/customers/${editingCustomer.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: customerForm.name,
            phone_number: customerForm.phone_number,
            location: customerForm.location || null,
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Customer updated");
      setEditingCustomer(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-customers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
    onError: (error) => {
      toast.error(`Unable to update customer: ${error.message}`);
    },
  });

  const deactivateCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      return apiFetch<Customer>(`/api/admin/customers/${customerId}`, { method: "DELETE" }, true);
    },
    onSuccess: async () => {
      toast.success("Customer deactivated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (error) => {
      toast.error(`Unable to deactivate customer: ${error.message}`);
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

  const customers = customersQuery.data ?? [];

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone_number: customer.phone_number,
      location: customer.location ?? "",
    });
  };

  return (
    <AdminShell section="customers" title="Customers" subtitle="Registered customers and contact details." logout={session.logout}>
      <div className="mx-auto max-w-[1500px] space-y-8">
        <Panel title="Customers" actionLabel={`${customers.length} total`}>
          <Table
            headers={["Name", "Phone", "Email", "Location", "Status", "Joined", "Actions"]}
            rows={customers.map((customer) => [
              customer.name,
              customer.phone_number,
              customer.email ?? "-",
              customer.location ?? "-",
              customer.is_active ? "Active" : "Inactive",
              new Date(customer.created_at).toLocaleDateString(),
              <div key={`actions-${customer.id}`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(customer)}
                  aria-label={`Edit ${customer.name}`}
                  title={`Edit ${customer.name}`}
                  className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                >
                  <Pencil className="size-4" />
                </button>
                {customer.is_active && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Deactivate this customer?")) {
                        deactivateCustomerMutation.mutate(customer.id);
                      }
                    }}
                    aria-label={`Deactivate ${customer.name}`}
                    title={`Deactivate ${customer.name}`}
                    disabled={deactivateCustomerMutation.isPending}
                    className="rounded-lg p-2 text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                  >
                    <Ban className="size-4" />
                  </button>
                )}
              </div>,
            ])}
            emptyMessage="No customers yet."
          />
        </Panel>
      </div>

      {editingCustomer && (
        <Modal title={`Edit customer #${editingCustomer.id}`} onClose={() => setEditingCustomer(null)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              updateCustomerMutation.mutate();
            }}
          >
            <Field label="Name">
              <input
                value={customerForm.name}
                onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <Field label="Phone">
              <input
                value={customerForm.phone_number}
                onChange={(event) => setCustomerForm((current) => ({ ...current, phone_number: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <Field label="Location">
              <input
                value={customerForm.location}
                onChange={(event) => setCustomerForm((current) => ({ ...current, location: event.target.value }))}
                className={inputBase}
              />
            </Field>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateCustomerMutation.isPending}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {updateCustomerMutation.isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
