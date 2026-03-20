import { redirect } from "next/navigation";
import { authAdapter } from "@/lib/adapters/auth";
import ShippingCenterClient from "./ShippingCenterClient";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata = { title: "Shipping Center \u2014 LegacyLoop" };

export default async function ShippingPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Shipping Center" },
      ]} />
      <div style={{ marginBottom: "2.5rem" }}>
        <div className="section-title" style={{ letterSpacing: "0.15em" }}>LOGISTICS COMMAND CENTER</div>
        <h1 className="h1" style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>{"\u{1F69A}"}</span>
          <span>Shipping Center</span>
        </h1>
        <p className="muted" style={{ marginTop: "0.5rem", maxWidth: "640px" }}>
          AI-powered TMS {"\u2014"} carrier intelligence, smart packaging, LTL freight, pickup management, and live tracking.
        </p>
        <div style={{ width: "60%", maxWidth: "400px", height: "2px", background: "linear-gradient(90deg, #00bcd4, transparent)", marginTop: "0.75rem", borderRadius: "1px" }} />
      </div>
      <ShippingCenterClient />
    </div>
  );
}
