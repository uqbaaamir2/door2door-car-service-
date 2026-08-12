import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  ["How do I book a service?", "Use the Book Service section on the homepage, select your service, add your location and preferred time, then submit the request."],
  ["Do I need an account to book?", "Guest booking remains available. Creating an account lets you keep your bookings and service history in one dashboard."],
  ["How can I track my booking?", "After logging in, open Customer Dashboard to view your bookings and their current status."],
  ["What services are available?", "The current system supports engine diagnostics, battery and electrical work, tyre and wheel service, brakes, AC repair and pre-purchase inspection."],
  ["Can staff update my booking status?", "Yes. Authorized staff can manage orders from the existing admin dashboard, and the updated status appears in the customer's dashboard."],
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — MOTORMATE Car Service" }] }),
  component: FAQPage,
});

function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="relative overflow-hidden grid-lines">
      <div className="hero-gradient absolute inset-0 opacity-25" />
      <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">FAQ</span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Frequently asked questions</h1>
          <p className="mt-5 text-muted-foreground">Quick answers about booking and customer accounts.</p>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map(([question, answer], index) => (
            <div key={question} className="glass-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold"
              >
                {question}
                <ChevronDown className={`size-5 transition-transform ${open === index ? "rotate-180" : ""}`} />
              </button>
              {open === index && <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
