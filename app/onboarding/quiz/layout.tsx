import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Your Plan · LegacyLoop",
  description: "Answer 6 quick questions to find your perfect LegacyLoop plan.",
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
