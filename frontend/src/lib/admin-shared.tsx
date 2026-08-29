import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Banknote, ClipboardList, HandCoins, LayoutDashboard, LogOut, Receipt, ShieldCheck, Store, Users, Wrench } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { apiFetch, setAdminToken } from "@/lib/api";

export type AdminSection = "dashboard" | "customers" | "orders" | "inventory" | "team" | "expenses" | "borrowings" | "lendings";

export type DashboardSummary = {
  customers: number;
  orders: number;
  pending_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  revenue: number;
  expenses: number;
  inventory_costs: number;
  staff_payments: number;
  direct_costs: number;
  profit: number;
  total_borrowed: number;
  total_repaid: number;
  total_lent: number;
  total_collected: number;
};

export type Customer = {
  id: number;
  name: string;
  phone_number: string;
  email: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
};

export type InventoryItem = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  created_at: string;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
};

export type OrderInventoryUsage = {
  id: number;
  inventory_item_id: number;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
};

export type Order = {
  id: number;
  customer_id: number;
  service_type: string;
  service_subcategory: string;
  location: string;
  preferred_time: string | null;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  collected_amount: number;
  staff_payment_amount: number;
  inventory_cost_amount: number;
  notes: string | null;
  assigned_team_member_id: number | null;
  created_at: string;
  updated_at: string;
  customer: Customer;
  inventory_usages: OrderInventoryUsage[];
};

export type ReceiptResponse = {
  order: Order;
  inventory_usages: OrderInventoryUsage[];
  revenue: number;
  inventory_costs: number;
  staff_payments: number;
  direct_costs: number;
  profit: number;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type InventoryUsageDraft = {
  inventory_item_id: string;
  quantity_used: string;
};

export type OrderFormState = {
  status: Order["status"];
  assigned_team_member_id: string;
  collected_amount: string;
  staff_payment_amount: string;
  notes: string;
  inventory_usage: InventoryUsageDraft[];
};

export type InventoryFormState = {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  cost_per_unit: string;
};

export type TeamFormState = {
  name: string;
  role: string;
  phone_number: string;
  is_active: boolean;
};

export const adminNavItems: Array<{ key: AdminSection; label: string; href: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { key: "customers", label: "Customers", href: "/admin/customers", icon: Users },
  { key: "orders", label: "Orders", href: "/admin/orders", icon: ClipboardList },
  { key: "inventory", label: "Inventory", href: "/admin/inventory", icon: Store },
  { key: "team", label: "Team / Staff", href: "/admin/team", icon: Wrench },
  { key: "expenses", label: "Expenses", href: "/admin/expenses", icon: Receipt },
  { key: "borrowings", label: "Borrowings", href: "/admin/borrowings", icon: Banknote },
  { key: "lendings", label: "Lendings", href: "/admin/lendings", icon: HandCoins },
];

export const inventoryCategories = ["oil", "air-filter", "oil-filter"];
export const teamRoles = ["mechanic", "electrician", "car-wash"];

export function useAdminSession() {
  const [token, setTokenState] = useState<string | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTokenState(window.localStorage.getItem("motormate_admin_token"));
    }
  }, []);

  const login = (accessToken: string) => {
    setAdminToken(accessToken);
    setTokenState(accessToken);
    setPassword("");
    toast.success("Admin session started");
  };

  const logout = () => {
    setAdminToken(null);
    setTokenState(null);
    toast.message("Logged out");
  };

  return {
    token,
    username,
    setUsername,
    password,
    setPassword,
    login,
    logout,
  };
}

export function AdminShell({
  section,
  title,
  subtitle,
  actions,
  children,
  logout,
}: {
  section: AdminSection;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
  logout: () => void;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-[286px] flex-col border-r border-slate-200 bg-[#0b1630] text-slate-100 lg:flex">
          <div
            onClick={() => navigate({ to: "/" })}
            className="flex cursor-pointer items-center gap-3 border-b border-white/10 px-5 py-5 transition-all duration-200 hover:bg-white/5"
          >
            <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-[#04111c] shadow-lg shadow-cyan-500/20">
              <Wrench className="size-6" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">MotorMate</p>
              <p className="mt-1 text-xs text-slate-300">Service Management</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4">
            {adminNavItems.map((item) => {
              const active = pathname === item.href || (section === item.key && item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.key}
                  to={item.href as "/admin/dashboard" | "/admin/customers" | "/admin/orders" | "/admin/inventory" | "/admin/team" | "/admin/expenses" | "/admin/borrowings" | "/admin/lendings"}
                  className={[
                    "mb-1 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                    active
                      ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                      : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  <item.icon className="size-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-400">v2.0 • MotorMate Operations</div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
                  <LayoutDashboard className="size-3.5" /> MotorMate dashboard
                </div>
                <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{subtitle}</p>
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                {actions}
                <button
                  onClick={logout}
                  className="grid size-10 place-items-center rounded-full border border-slate-200 bg-slate-900 text-white"
                >
                  <LogOut className="size-4" />
                </button>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <div className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white">A</div>
                  <div>
                    <p className="text-sm font-semibold leading-none">Admin</p>
                    <p className="mt-1 text-xs text-slate-500">Manager</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function AdminLoginCard({
  username,
  password,
  setUsername,
  setPassword,
  onSubmit,
  pending,
}: {
  username: string;
  password: string;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(11,22,48,0.16),_transparent_35%),linear-gradient(180deg,_#f5f8fb_0%,_#edf2f7_100%)] px-6 py-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm">
            <ShieldCheck className="size-3.5" /> MotorMate admin console
          </p>
          <h1 className="mt-5 text-balance text-5xl font-extrabold tracking-tight text-slate-950">
            Customers, orders, inventory and staff in one live panel.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            Track order status, assign staff, enter payments, manage inventory stock, and generate receipts without leaving the panel.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-bold text-slate-950">Admin login</h2>
          <p className="mt-2 text-sm text-slate-500">Use your backend admin credentials.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {pending ? "Signing in..." : "Open dashboard"}
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardHero({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description: string;
  actions: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-base text-slate-600">{description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{actions}</div>
      </div>
    </section>
  );
}

export function Panel({
  title,
  actionLabel,
  action,
  children,
}: {
  title: string;
  actionLabel?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          {actionLabel && <p className="mt-1 text-sm text-slate-500">{actionLabel}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function Card({ title, value, onClick }: { title: string; value: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${
        onClick ? "cursor-pointer transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:scale-[1.02]" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

export function MetricChip({ label, value, tone }: { label: string; value: string; tone: "blue" | "amber" }) {
  const toneClasses = tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${toneClasses}`}>
      <span className="text-slate-400">{label}:</span> {value}
    </div>
  );
}

export function QuickAction({ title, subtitle, icon: Icon, onClick }: { title: string; subtitle: string; icon: typeof LayoutDashboard; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex min-w-[180px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 ${
        onClick ? "cursor-pointer transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm" : ""
      }`}
    >
      <div className="grid size-11 place-items-center rounded-2xl bg-white text-cyan-700 shadow-sm">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function Banner({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      <div className="flex items-center gap-2 font-semibold">
        <ShieldCheck className="size-4" /> {title}
      </div>
      <p className="mt-1">{message}</p>
    </div>
  );
}

export function Table({
  headers,
  rows,
  emptyMessage,
}: {
  headers: string[];
  rows: ReactNode[][];
  emptyMessage: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-950 text-white">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-10 text-slate-500" colSpan={headers.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-100">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: Order["status"] }) {
  const classes =
    status === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "in-progress"
        ? "bg-blue-100 text-blue-700"
        : status === "cancelled"
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>{status}</span>;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">{message}</div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <button onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600">
            Close
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export const inputBase =
  "input-field w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm !text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-black/5 focus:ring-1 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-70";