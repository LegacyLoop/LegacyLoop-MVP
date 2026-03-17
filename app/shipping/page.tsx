import { redirect } from "next/navigation";
import { authAdapter } from "@/lib/adapters/auth";
import ShippingCenterClient from "./ShippingCenterClient";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata = { title: "Shipping Center — LegacyLoop" };

export default async function ShippingPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Shipping Center" },
      ]} />
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-title">Logistics</div>
        <h1 className="h1" style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>Shipping Center</span>
        </h1>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          Manage shipping estimates, labels, and tracking for all your items.
        </p>
      </div>
      <ShippingCenterClient />
    </div>
  );
}
