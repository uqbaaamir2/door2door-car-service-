import { createFileRoute } from "@tanstack/react-router";

import { CustomerAuthCard } from "@/components/CustomerAuthCard";

export const Route = createFileRoute("/customer/register")({
  head: () => ({ meta: [{ title: "Create Customer Account — MOTORMATE Car Service" }] }),
  component: CustomerAuthPage,
});

function CustomerAuthPage() {
  return <CustomerAuthCard mode="register" />;
}
