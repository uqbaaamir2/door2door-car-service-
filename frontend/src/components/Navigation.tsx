import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Wrench, X } from "lucide-react";
import { useState } from "react";

import { hasCustomerSession, setCustomerToken } from "@/lib/api";
const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const customerLoggedIn = hasCustomerSession();

  const logoutCustomer = () => {
    setCustomerToken(null);
    navigate({ to: "/" });
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="relative grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Wrench className="size-4.5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            MOTORMATE <span className="text-gradient">Car Service</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={pathname === l.to ? "nav-link nav-link-active" : "nav-link"}
            >
              {l.label}
            </Link>
          ))}
          <a href="#how-it-works" className="nav-link">
            How it works
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="hidden rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:inline-block"
          >
            Staff Login
          </Link>
          {customerLoggedIn ? (
            <>
              <Link
                to="/customer/dashboard"
                className="hidden rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:inline-block"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logoutCustomer}
                className="hidden rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-block"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/customer/login"
              className="hidden rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:inline-block"
            >
              Customer Login
            </Link>
          )}
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            href="#book"
            className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] sm:inline-block"
          >
            Book Service
          </motion.a>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-xl border border-border text-foreground md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
              {customerLoggedIn ? (
                <>
                  <Link
                    to="/customer/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-2 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Customer Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logoutCustomer();
                    }}
                    className="rounded-lg px-2 py-3 text-left text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/customer/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Customer Login
                </Link>
              )}
              <a
                href="#book"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Book Service
              </a>
            </div>
                </motion.div>
    )}
  </AnimatePresence>
</motion.header>
);
}