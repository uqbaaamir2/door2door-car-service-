import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock, Shield, Star, Wallet } from "lucide-react";

import { BookingPanel } from "@/components/BookingPanel";
import { SectionHeading, StaggerGroup, fadeUp } from "@/components/motion-primitives";
import { services } from "@/data/services";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Car Services & Pricing — MotorMate Doorstep Mechanics" },
      {
        name: "description",
        content:
          "Engine diagnostics, battery, brakes, tyres, AC repair and pre-purchase inspection at your doorstep with fixed, upfront pricing.",
      },
      { property: "og:title", content: "Car Services & Pricing — MotorMate" },
      {
        property: "og:description",
        content:
          "Six doorstep car services with genuine parts, trained mechanics and a 6-month warranty.",
      },
    ],
  }),
  component: ServicesPage,
});

const reasons = [
  { icon: Shield, title: "6-month warranty", text: "Parts and labour covered on every job." },
  { icon: Clock, title: "Same-day slots", text: "Morning, evening and weekend availability." },
  { icon: Wallet, title: "No hidden charges", text: "Quote approved by you before work begins." },
  { icon: Star, title: "Rated 4.9/5", text: "12,000+ doorstep services completed." },
];

function ServicesPage() {
  return (
    <div className="overflow-hidden">
      <section className="hero-gradient grid-lines relative px-6 pb-14 pt-32 md:pt-40">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl"
          >
            Services built around <span className="text-gradient">your driveway</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
          >
            Pick what your car needs. A verified mechanic arrives with tools, parts and a fixed price.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <StaggerGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <motion.article
              key={s.title}
              variants={fadeUp}
              className="glass-card group flex flex-col p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="size-5.5" />
                </span>
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  {s.price}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-bold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              <ul className="mt-5 space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="size-4 text-accent" /> {p}
                  </li>
                ))}
              </ul>
              <motion.a
                href="#book"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 py-3 text-sm font-semibold transition-colors group-hover:border-primary group-hover:text-primary"
              >
                Book this service <ArrowRight className="size-4" />
              </motion.a>
            </motion.article>
          ))}
        </StaggerGroup>
      </section>

      <section className="grid-lines border-y border-border bg-surface/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Why choose us" title="Workshop quality, without the workshop" />
          <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r) => (
              <motion.div
                key={r.title}
                variants={fadeUp}
                whileHover={{ rotate: 1.2, y: -6 }}
                className="glass-card p-6"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-accent/15 text-accent">
                  <r.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{r.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.text}</p>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section className="px-6 py-20">
        <BookingPanel />
      </section>
    </div>
  );
}
