import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { LockKeyhole, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/customer/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
  token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const search = useSearch({
    from: "/customer/reset-password",
  });

  const token = search["token"];

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error("Invalid reset link", {
        description: "The password reset token is missing.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch<{ message: string }>(
        "/api/customer/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({
            token,
            new_password: password,
            confirm_password: confirmPassword,
          }),
        },
      );

      toast.success("Password reset successful", {
        description: response.message,
      });
    } catch (error) {
      toast.error("Password reset failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to reset password.",
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
              Reset Password
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block rounded-xl border border-border bg-secondary/40 px-4 py-3 transition-colors focus-within:border-primary">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <LockKeyhole className="size-4" />
                New Password
              </span>

              <div className="mt-1.5">
                <input
                  required
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="auth-input w-full"
                />
              </div>
            </label>

            <label className="block rounded-xl border border-border bg-secondary/40 px-4 py-3 transition-colors focus-within:border-primary">
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <LockKeyhole className="size-4" />
                Confirm Password
              </span>

              <div className="mt-1.5">
                <input
                  required
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  className="auth-input w-full"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/customer/login"
              className="text-sm font-semibold text-primary hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}