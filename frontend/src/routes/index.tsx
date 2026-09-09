import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Phone,
  Shield,
  Sparkles,
  Star,
  Wallet,
  Wrench,
} from "lucide-react";
import { useRef } from "react";

import heroImage from "@/assets/hero-mechanic.jpg";
import { BookingPanel } from "@/components/BookingPanel";
import {
  Reveal,
  SectionHeading,
  StaggerGroup,
  fadeLeft,
  fadeUp,
} from "@/components/motion-primitives";
import { services } from "@/data/services";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MotorMate — Doorstep Car Repair & Service Booking" },
      {
        name: "description",
        content:
          "Book expert mechanics at your doorstep. Engine diagnostics, battery, brakes, tyres and AC repair with fast response and transparent pricing.",
      },
      { property: "og:title", content: "MotorMate — Doorstep Car Repair & Service" },
      {
        property: "og:description",
        content:
          "Expert mechanics, fast response, safe service. Book a doorstep car service in under a minute.",
      },
    ],
  }),
  component: HomePage,
});

const benefits = [
  { icon: Clock, title: "30-min response", text: "Nearest verified mechanic dispatched instantly." },
  { icon: Shield, title: "6-month warranty", text: "Every repair and part is covered in writing." },
  { icon: Wallet, title: "Upfront pricing", text: "You approve the quote before any work starts." },
  { icon: BadgeCheck, title: "Verified experts", text: "Background-checked, brand-trained mechanics." },
  { icon: Sparkles, title: "Clean workspace", text: "Mats down, zero mess left on your driveway." },
  { icon: Star, title: "4.9 average rating", text: "Across 12,000+ completed doorstep jobs." },
];

const steps = [
  { title: "Tell us the issue", text: "Pick your service and drop your location in the booking panel." },
  { title: "Get a fixed quote", text: "See parts and labour upfront — approve it with one tap." },
  { title: "Mechanic arrives", text: "Track your mechanic live to your doorstep, tools loaded." },
  { title: "Drive away happy", text: "Digital invoice, warranty and service history saved." },
];

function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section ref={heroRef} className="relative grid-lines">
        <motion.div style={{ opacity: glowOpacity }} className="hero-gradient absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-16 pt-20 md:pt-28 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.14 } } }}>
            <motion.span
              variants={fadeLeft}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent"
            >
              <Wrench className="size-3.5" /> Doorstep mechanics
            </motion.span>
            <motion.h1
              variants={fadeLeft}
              className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl"
            >
              Professional Car Repair at Your{" "}
              <span className="text-gradient">Doorstep</span>
            </motion.h1>
            <motion.p variants={fadeLeft} className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Expert mechanics, fast response, safe service. No workshop queues, no surprise bills —
              just your car fixed where it stands.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-4">
              <motion.a
                href="#book"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              >
                Request Service
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.a>
              <motion.a
                href="tel:+920000000000"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-7 py-4 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent"
              >
                <Phone className="size-4" /> Call Now
              </motion.a>
            </motion.div>

            <motion.dl variants={fadeUp} className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {[
                ["12k+", "Jobs done"],
                ["4.9★", "Avg. rating"],
                ["30 min", "Response"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-bold text-foreground">{v}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{l}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          <motion.div
            style={{ y: imageY }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="float-slow overflow-hidden rounded-4xl border border-border shadow-[var(--shadow-glow)]">
              <img
                src={heroImage}
                alt="Mechanic repairing a car engine at a customer's doorstep"
                width={1280}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="glass-card absolute -bottom-6 left-4 flex items-center gap-3 p-4 sm:left-8"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent">
                <BadgeCheck className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Mechanic on the way</p>
                <p className="text-xs text-muted-foreground">Arriving in 18 minutes</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* BOOKING */}
      <section className="relative px-6 py-16">
        <BookingPanel />
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading
          eyebrow="Our services"
          title={<>Everything a workshop does — <span className="text-gradient">at your gate</span></>}
          subtitle="Genuine parts, trained hands and a fixed price agreed before the first bolt turns."
        />

        <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <motion.article key={s.title} variants={fadeUp} className="glass-card group p-7">
              <span className="relative grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="size-5.5" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              <Link
                to="/services"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
              >
                Learn more
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </motion.article>
          ))}
        </StaggerGroup>
      </section>

      {/* WHY CHOOSE US */}
      <section className="relative grid-lines border-y border-border bg-surface/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Why choose us"
            title="Built on trust, speed and zero surprises"
          />
          <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                whileHover={{ rotate: -1.2, y: -6 }}
                className="glass-card flex gap-4 p-6"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                  <b.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold">{b.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{b.text}</p>
                </div>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20">
        <SectionHeading
          eyebrow="How it works"
          title={<>Four steps, <span className="text-gradient">zero hassle</span></>}
        />
        <div className="relative mt-16">
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute left-0 top-7 hidden h-px w-full origin-left bg-gradient-to-r from-primary via-accent to-transparent lg:block"
          />
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={s.title} variants={fadeUp} className="glass-card relative p-6">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 * i, type: "spring", stiffness: 220, damping: 14 }}
                  className="relative grid size-14 place-items-center rounded-2xl bg-primary font-display text-xl font-bold text-primary-foreground"
                >
                  {i + 1}
                </motion.span>
                <h3 className="mt-5 text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <Reveal className="mx-auto max-w-5xl">
          <div className="hero-gradient glass-card relative overflow-hidden px-8 py-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Your car deserves a house call</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Book in under a minute. Track your mechanic live. Pay only after the job is done.
            </p>
            <motion.a
              href="#book"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              Request Service <ArrowRight className="size-4" />
            </motion.a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
