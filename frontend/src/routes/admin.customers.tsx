import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { apiFetch } from "@/lib/api";

import { AdminLoginCard, AdminShell, Customer, LoginResponse, Panel, Table, useAdminSession } from "@/lib/admin-shared";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({
    meta: [{ title: "MotorMate Customers" }],
  }),
  component: AdminCustomersPage,
});

function AdminCustomersPage() {
  const session = useAdminSession();

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

  return (
    <AdminShell section="customers" title="Customers" subtitle="Registered customers and contact details." logout={session.logout}>
      <div className="mx-auto max-w-[1500px] space-y-8">
        <Panel title="Customers" actionLabel={`${customers.length} total`}>
          <Table
            headers={["Name", "Phone", "Email", "Location", "Joined"]}
            rows={customers.map((customer) => [
              customer.name,
              customer.phone_number,
              customer.email ?? "-",
              customer.location ?? "-",
              new Date(customer.created_at).toLocaleDateString(),
            ])}
            emptyMessage="No customers yet."
          />
        </Panel>
      </div>
    </AdminShell>
  );
}
