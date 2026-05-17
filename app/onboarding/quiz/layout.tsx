import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Your Plan · Legacy-Loop",
  description: "Answer 6 quick questions to find your perfect Legacy-Loop plan.",
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
