"use client";

import {
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  style?: CSSProperties;
  intensity?: number;
}

export default function MagneticButton({
  children,
  href,
  onClick,
  style: extraStyle,
  intensity = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setOffset({
        x: (e.clientX - cx) * intensity,
        y: (e.clientY - cy) * intensity,
      });
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transition: isHovered
      ? "transform 0.15s ease-out"
      : "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
    cursor: "pointer",
    ...extraStyle,
  };

  const Tag = href ? "a" : "button";

  return (
    <Tag
      ref={ref as any}
      href={href}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={baseStyle}
    >
      {children}
    </Tag>
  );
}
