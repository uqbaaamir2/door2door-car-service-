import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/customer/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await apiFetch<{ message: string }>(
        "/api/customer/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        },
      );

      toast.success("Reset link sent", {
        description: response.message,
      });
    } catch (error) {
      toast.error("Request failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to send reset link.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden grid-lines">
      <div className="hero-gradient absolute inset-0 opacity-50" />

      <div className="relative mx-auto flex max-w-6xl items-center justify-center px-6 py-16">
        <div className="glass-card w-full max-w-lg p-7 sm:p-9">
          <div className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Wrench className="size-5" />
            </span>

            <h1 className="mt-5 text-3xl font-extrabold">
              Forgot Password
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Enter your email address and we will send you a password reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block rounded-xl border border-border bg-secondary/40 px-4 py-3 transition-colors focus-within:border-primary">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Mail className="size-4" />
                Email Address
              </span>

              <div className="mt-1.5">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="auth-input w-full"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              to="/customer/login"
              className="font-semibold text-primary hover:underline"
            >
              Back to Login
            </Link>
          </p>

          <div className="mt-5 text-center">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back to MOTORMATE Car Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}