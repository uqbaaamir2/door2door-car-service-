import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarClock, CarFront, LogOut, MapPin, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { customerFetch, hasCustomerSession, setCustomerToken } from "@/lib/api";

type Customer = {
  id: number;
  name: string;
  phone_number: string;
  email?: string | null;
  location?: string | null;
  created_at: string;
};

type Order = {
  id: number;
  customer_id: number;
  service_type: string;
  service_subcategory: string;
  location: string;
  preferred_time?: string | null;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export const Route = createFileRoute("/customer/dashboard")({
  head: () => ({
    meta: [
      { title: "Customer Dashboard — MOTORMATE Car Service" },
      { name: "description", content: "Manage your MOTORMATE Car Service bookings." },
    ],
  }),
  component: CustomerDashboardPage,
});

function CustomerDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: "", phone_number: "", location: "" });

  useEffect(() => {
    if (!hasCustomerSession()) {
      navigate({ to: "/customer/login" });
    }
  }, [navigate]);

  const meQuery = useQuery({
    queryKey: ["customer-me"],
    queryFn: () => customerFetch<Customer>("/api/customer/auth/me"),
    enabled: hasCustomerSession(),
  });

  const ordersQuery = useQuery({
    queryKey: ["customer-orders"],
    queryFn: () => customerFetch<Order[]>("/api/customer/orders"),
    enabled: hasCustomerSession(),
  });

  useEffect(() => {
    if (meQuery.data) {
      setProfile({
        name: meQuery.data.name,
        phone_number: meQuery.data.phone_number,
        location: meQuery.data.location ?? "",
      });
    }
  }, [meQuery.data]);

  const updateProfile = useMutation({
    mutationFn: () =>
      customerFetch<Customer>("/api/customer/profile", {
        method: "PATCH",
        body: JSON.stringify(profile),
      }),
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["customer-me"] });
      toast.success("Profile updated");
    },
    onError: (error: Error) => toast.error("Profile update failed", { description: error.message }),
  });

  const logout = () => {
    setCustomerToken(null);
    navigate({ to: "/" });
  };

  const customer = meQuery.data;
  const orders = ordersQuery.data ?? [];

  if (!hasCustomerSession()) return null;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden grid-lines">
      <div className="hero-gradient absolute inset-0 opacity-25" />
      <div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Customer area</span>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Welcome, <span className="text-gradient">{customer?.name ?? "Customer"}</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Manage your profile, bookings and service history.</p>
          </div>
          <div className="flex gap-3">
            <a href="/#book" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Book Service
            </a>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </div>

        {meQuery.isError || ordersQuery.isError ? (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-foreground">
            Your session could not be loaded. Please log in again.
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="glass-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  <UserRound className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold">My Profile</h2>
                  <p className="text-xs text-muted-foreground">Your customer information</p>
                </div>
              </div>
              <button
                onClick={() => setEditing((value) => !value)}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <ProfileField label="Name">
                {editing ? (
                  <input className="auth-input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                ) : (
                  customer?.name
                )}
              </ProfileField>
              <ProfileField label="Email">{customer?.email ?? "—"}</ProfileField>
              <ProfileField label="Phone">
                {editing ? (
                  <input className="auth-input" value={profile.phone_number} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} />
                ) : (
                  customer?.phone_number
                )}
              </ProfileField>
              <ProfileField label="Location">
                {editing ? (
                  <input className="auth-input" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
                ) : (
                  customer?.location || "Not added"
                )}
              </ProfileField>
              {editing && (
                <button
                  onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                >
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">My Bookings</h2>
                <p className="mt-1 text-sm text-muted-foreground">{orders.length} booking{orders.length === 1 ? "" : "s"} in your account.</p>
              </div>
              <CarFront className="size-6 text-primary" />
            </div>

            <div className="mt-6 space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="font-semibold">No bookings yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Book a doorstep mechanic and your booking will appear here.</p>
                  <a href="/#book" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                    Book Service
                  </a>
                </div>
              ) : (
                orders.map((order) => <BookingCard key={order.id} order={order} />)
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ order }: { order: Order }) {
  const label = order.service_subcategory
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const statusClass = {
    pending: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    "in-progress": "bg-primary/15 text-primary border-primary/30",
    completed: "bg-accent/15 text-accent border-accent/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  }[order.status];

  return (
    <article className="rounded-2xl border border-border bg-secondary/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Booking #{order.id}</p>
          <h3 className="mt-1 text-lg font-bold">{label}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {order.status === "in-progress" ? "In Progress" : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <p className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> {order.location}</p>
        <p className="flex items-center gap-2"><CalendarClock className="size-4 text-primary" /> {order.preferred_time ? new Date(order.preferred_time).toLocaleString() : "Time not specified"}</p>
      </div>
      {order.notes && <p className="mt-3 rounded-xl bg-background/50 p-3 text-sm text-muted-foreground">Notes: {order.notes}</p>}
      <div className="mt-5 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-border">
          <div
            className="h-1.5 rounded-full bg-primary transition-all"
            style={{
              width:
                order.status === "pending"
                  ? "25%"
                  : order.status === "in-progress"
                    ? "65%"
                    : order.status === "completed"
                      ? "100%"
                      : "100%",
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground">Service status</span>
      </div>
    </article>
  );
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}
