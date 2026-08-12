import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Clock, Shield, Wrench, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Us — MOTORMATE Car Service" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="relative overflow-hidden grid-lines">
      <div className="hero-gradient absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">About us</span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Car care that comes to you.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            MOTORMATE Car Service connects customers with trained mechanics for convenient vehicle repair and maintenance at their doorstep.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {([
            { icon: Wrench, title: "Skilled service", text: "From diagnostics and brakes to tyres, AC and electrical work." },
            { icon: Clock, title: "Fast response", text: "A simple booking process helps customers request service without a workshop queue." },
            { icon: Shield, title: "Transparent approach", text: "Clear service details and booking information keep customers informed." },
            { icon: BadgeCheck, title: "Customer focused", text: "Your booking history and service requests stay organized in one account." },
          ] satisfies Array<{ icon: LucideIcon; title: string; text: string }>).map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass-card p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="size-5" /></span>
              <h2 className="mt-5 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
