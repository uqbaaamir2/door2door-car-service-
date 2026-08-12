import { createFileRoute } from "@tanstack/react-router";

import { CustomerAuthCard } from "@/components/CustomerAuthCard";

export const Route = createFileRoute("/customer/login")({
  head: () => ({ meta: [{ title: "Customer Login — MOTORMATE Car Service" }] }),
  component: CustomerAuthPage,
});

function CustomerAuthPage() {
  return <CustomerAuthCard mode="login" />;
}
