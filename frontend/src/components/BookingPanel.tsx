import { motion } from "framer-motion";
import { CalendarClock, ChevronRight, MapPin, Wrench } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch, customerFetch, hasCustomerSession } from "@/lib/api";
import { services } from "@/data/services";

const bookingServices = services;

export function BookingPanel() {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [serviceSubcategory, setServiceSubcategory] = useState(bookingServices[0]?.subcategory ?? "");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");

  const createBooking = useMutation({
    mutationFn: async () => {
      const request = {
        method: "POST",
        body: JSON.stringify({
          customer_name: customerName,
          phone_number: phoneNumber,
          email: email || undefined,
          service_type: "home",
          service_subcategory: serviceSubcategory,
          location,
          preferred_time: when ? new Date(when).toISOString() : undefined,
          notes: notes || undefined,
        }),
      };

      return hasCustomerSession()
        ? customerFetch<{ id: number }>("/api/customer/orders", request)
        : apiFetch<{ id: number }>("/api/public/orders", request);
    },
    onSuccess: (booking) => {
      toast.success("Booking sent successfully", {
        description: `Booking #${booking.id} has been created with status Pending.`,
      });
      setCustomerName("");
      setPhoneNumber("");
      setEmail("");
      setLocation("");
      setServiceSubcategory(bookingServices[0]?.subcategory ?? "");
      setWhen("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast.error("Booking failed", { description: error.message });
    },
  });

  return (
    <motion.div
      id="book"
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card mx-auto max-w-5xl scroll-mt-28 p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Book a doorstep mechanic</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Average response time under 30 minutes in your area.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">
          <span className="relative grid size-2 place-items-center rounded-full bg-accent pulse-ring" />
          12 mechanics online
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createBooking.mutate();
        }}
        className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      >
        <Field icon={<Wrench className="size-4" />} label="Customer name">
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your full name"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field icon={<Wrench className="size-4" />} label="Phone number">
          <input
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="03xx-xxxxxxx"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field icon={<Wrench className="size-4" />} label="Email address">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field icon={<MapPin className="size-4" />} label="Location">
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Street, area or city"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field icon={<Wrench className="size-4" />} label="Service">
          <select
            required
            value={serviceSubcategory}
            onChange={(e) => setServiceSubcategory(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none [&>option]:bg-surface"
          >
            {bookingServices.map((service) => (
              <option key={service.subcategory} value={service.subcategory}>
                {service.title}
              </option>
            ))}
          </select>
        </Field>

        <Field icon={<CalendarClock className="size-4" />} label="Date & time">
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Field>

        <Field icon={<Wrench className="size-4" />} label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the issue"
            rows={2}
            className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </Field>

        <motion.button
          type="submit"
          disabled={createBooking.isPending}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="absolute inset-0 -translate-x-full bg-accent/40 transition-transform duration-500 group-hover:translate-x-0" />
          <span className="relative">{createBooking.isPending ? "Booking..." : "Book Now"}</span>
          <ChevronRight className="relative size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </motion.button>
      </form>
    </motion.div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="group rounded-xl border border-border bg-secondary/40 px-4 py-3 transition-colors focus-within:border-primary focus-within:bg-secondary/70">
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors group-focus-within:text-primary">
        {icon}
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
