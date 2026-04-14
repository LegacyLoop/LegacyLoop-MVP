"use client";

import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react";
import { useTheme } from "@/app/components/ThemeProvider";

interface GlowCardProps {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
  hoverBorderColor?: string;
}

export default function GlowCard({
  children,
  delay = 0,
  style: extraStyle,
  hoverBorderColor,
}: GlowCardProps) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const defaultBorder = isDark
    ? "rgba(0,188,212,0.15)"
    : "rgba(0,188,212,0.12)";
  const activeBorder =
    hoverBorderColor ??
    (isDark ? "rgba(0,188,212,0.5)" : "rgba(0,151,167,0.4)");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    const fallback = setTimeout(() => setVisible(true), 3000);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? activeBorder : defaultBorder}`,
        borderRadius: 16,
        transition: reducedMotion ? "none" : "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        transform: reducedMotion
          ? "none"
          : visible
            ? hovered
              ? "translateY(-4px)"
              : "translateY(0) scale(1)"
            : "translateY(28px) scale(0.97)",
        opacity: reducedMotion ? 1 : visible ? 1 : 0,
        transitionDelay: reducedMotion ? "0ms" : visible ? `${delay}ms` : "0ms",
        boxShadow: hovered
          ? isDark
            ? "0 0 30px rgba(0,188,212,0.12), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 0 24px rgba(0,151,167,0.08), inset 0 1px 0 rgba(255,255,255,0.5)"
          : "none",
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}
