import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neighborhood Bundle · LegacyLoop",
  description: "Save up to 40% when families in your neighborhood sell together. Community-powered estate sales with AI pricing and shared logistics.",
};

export default function NeighborhoodBundleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
