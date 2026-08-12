import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Us — MOTORMATE Car Service" }] }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="relative overflow-hidden grid-lines">
      <div className="hero-gradient absolute inset-0 opacity-25" />
      <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Contact us</span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">We are here to help.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Need help with a booking or want to ask about a service? Reach out through any of the options below.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <ContactCard icon={Phone} title="Call" value="0800 000 000" href="tel:+920000000000" />
          <ContactCard icon={Mail} title="Email" value="support@door2door.example" href="mailto:support@door2door.example" />
          <ContactCard icon={MapPin} title="Service area" value="Lahore and surrounding areas" />
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon: Icon, title, value, href }: { icon: typeof Phone; title: string; value: string; href?: string }) {
  const content = (
    <div className="glass-card h-full p-6">
      <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="size-5" /></span>
      <h2 className="mt-5 font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{value}</p>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}
