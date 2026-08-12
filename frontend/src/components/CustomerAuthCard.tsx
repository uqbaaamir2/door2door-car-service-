import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, Mail, Phone, User, Wrench } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { apiFetch, setCustomerToken } from "@/lib/api";

type Customer = {
  id: number;
  name: string;
  phone_number: string;
  email?: string | null;
  location?: string | null;
  created_at: string;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  customer: Customer;
};

export function CustomerAuthCard({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isLogin && password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      return apiFetch<AuthResponse>(
        isLogin ? "/api/customer/auth/login" : "/api/customer/auth/register",
        {
          method: "POST",
          body: JSON.stringify(
            isLogin
              ? { email, password }
              : { name, phone_number: phone, email, password },
          ),
        },
      );
    },
    onSuccess: (response) => {
      setCustomerToken(response.access_token);
      toast.success(isLogin ? "Welcome back" : "Account created", {
        description: `Welcome, ${response.customer.name}.`,
      });
      navigate({ to: "/customer/dashboard" });
    },
    onError: (error: Error) => {
      toast.error(isLogin ? "Login failed" : "Registration failed", {
        description: error.message,
      });
    },
  });

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
              {isLogin ? "Customer Login" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isLogin
                ? "Sign in to manage your bookings and service history."
                : "Create an account to track bookings and manage your car service requests."}
            </p>
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            {!isLogin && (
              <>
                <AuthField icon={<User className="size-4" />} label="Full name">
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className="auth-input"
                  />
                </AuthField>
                <AuthField icon={<Phone className="size-4" />} label="Phone number">
                  <input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="03xx-xxxxxxx"
                    className="auth-input"
                  />
                </AuthField>
              </>
            )}

            <AuthField icon={<Mail className="size-4" />} label="Email address">
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="auth-input"
              />
            </AuthField>

            <AuthField icon={<LockKeyhole className="size-4" />} label="Password">
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="auth-input"
              />
            </AuthField>

            {!isLogin && (
              <AuthField icon={<LockKeyhole className="size-4" />} label="Confirm password">
                <input
                  required
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  className="auth-input"
                />
              </AuthField>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mutation.isPending
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                  ? "Login"
                  : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link
              to={isLogin ? "/customer/register" : "/customer/login"}
              className="font-semibold text-primary hover:underline"
            >
              {isLogin ? "Register" : "Login"}
            </Link>
          </p>

          <div className="mt-5 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Back to MOTORMATE Car Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthField({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-xl border border-border bg-secondary/40 px-4 py-3 transition-colors focus-within:border-primary">
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
