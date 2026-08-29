import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardList, PackagePlus, Receipt, Users } from "lucide-react";

import { apiFetch } from "@/lib/api";

import {
  AdminDashboardHero,
  AdminLoginCard,
  AdminShell,
  Banner,
  Card,
  DashboardSummary,
  LoginResponse,
  MetricChip,
  Order,
  QuickAction,
  StatusBadge,
  useAdminSession,
} from "@/lib/admin-shared";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "MotorMate Admin Dashboard" },
      {
        name: "description",
        content: "MotorMate admin dashboard for customers, orders, inventory, and staff operations.",
      },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const session = useAdminSession();
  const navigate = useNavigate();

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

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", session.token],
    queryFn: () => apiFetch<DashboardSummary>("/api/admin/dashboard", {}, true),
    enabled: Boolean(session.token),
  });

  const ordersQuery = useQuery({
    queryKey: ["admin-orders", session.token],
    queryFn: () => apiFetch<Order[]>("/api/admin/orders", {}, true),
    enabled: Boolean(session.token),
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

  const dashboard = dashboardQuery.data;
  const recentOrders = (ordersQuery.data ?? []).slice(0, 5);

  return (
    <AdminShell
      section="dashboard"
      title="Executive Dashboard"
      subtitle="Order status, staff assignment, inventory consumption and accounting in one working system."
      logout={session.logout}
      actions={
        <>
          <MetricChip tone="blue" label="Pending" value={String(dashboard?.pending_orders ?? 0)} />
          <MetricChip tone="amber" label="In Progress" value={String(dashboard?.in_progress_orders ?? 0)} />
        </>
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-8">
        {dashboardQuery.isError && <Banner title="Unable to load dashboard data" message={dashboardQuery.error.message} />}

        <AdminDashboardHero
          title={<>MotorMate dashboard</>}
          description="Live service operations, quick actions, and business numbers in one place."
          actions={
            <>
              <QuickAction title="New Order" subtitle="Create booking" icon={ClipboardList} onClick={() => navigate({ to: "/admin/orders" })} />
              <QuickAction title="Inventory" subtitle="Add stock" icon={PackagePlus} onClick={() => navigate({ to: "/admin/inventory" })} />
              <QuickAction title="Team" subtitle="Add staff" icon={Users} onClick={() => navigate({ to: "/admin/team" })} />
              <QuickAction title="Receipt" subtitle="Print bill" icon={Receipt} onClick={() => navigate({ to: "/admin/orders" })} />
            </>
          }
        />

        <section className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <Card
            title="Revenue"
            value={dashboard ? `Rs ${dashboard.revenue.toLocaleString()}` : "Rs 0.00"}
            onClick={() => navigate({ to: "/admin/orders" })}
          />
          <Card
            title="Inventory Cost"
            value={dashboard ? `Rs ${dashboard.inventory_costs.toLocaleString()}` : "Rs 0.00"}
            onClick={() => navigate({ to: "/admin/inventory" })}
          />
          <Card
            title="Staff Payments"
            value={dashboard ? `Rs ${dashboard.staff_payments.toLocaleString()}` : "Rs 0.00"}
            onClick={() => navigate({ to: "/admin/team" })}
          />
          <Card
            title="Expenses"
            value={dashboard ? `Rs ${dashboard.expenses.toLocaleString()}` : "Rs 0.00"}
            onClick={() => navigate({ to: "/admin/expenses" })}
          />
          <Card
            title="Profit"
            value={dashboard ? `Rs ${dashboard.profit.toLocaleString()}` : "Rs 0.00"}
            onClick={() => navigate({ to: "/admin/dashboard" })}
          />
          <Card
            title="Direct Costs"
            value={dashboard ? `Rs ${dashboard.direct_costs.toLocaleString()}` : "Rs 0.00"}
            onClick={() => navigate({ to: "/admin/expenses" })}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section
            onClick={() => navigate({ to: "/admin/orders" })}
            className="cursor-pointer rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Recent Orders</h2>
                <p className="mt-1 text-sm text-slate-500">Latest service activity</p>
              </div>
            </div>
            <div className="space-y-3 p-6">
              {recentOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No recent orders yet.
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{order.customer.name}</p>
                      <p className="text-sm text-slate-500">{order.service_subcategory}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="cursor-pointer rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div
              onClick={() => navigate({ to: "/admin/dashboard" })}
              className="border-b border-slate-200 px-6 py-5"
            >
              <h2 className="text-lg font-bold text-slate-950">Business Snapshot</h2>
              <p className="mt-1 text-sm text-slate-500">Live operational totals</p>
            </div>
            <div className="space-y-3 p-6 text-sm text-slate-600">
              <p>Customers: {dashboard?.customers ?? 0}</p>
              <p>Orders: {dashboard?.orders ?? 0}</p>
              <p>Completed orders: {dashboard?.completed_orders ?? 0}</p>
              <p>Pending jobs: {dashboard?.pending_orders ?? 0}</p>
              <p>In-progress jobs: {dashboard?.in_progress_orders ?? 0}</p>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
