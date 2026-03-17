"use client";
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: "linear-gradient(135deg, #00bcd4, #009688)",
        border: "none",
        borderRadius: "10px",
        padding: "0.65rem 1.5rem",
        color: "white",
        fontWeight: 700,
        fontSize: "0.85rem",
        cursor: "pointer",
      }}
    >
      Print Certificate
    </button>
  );
}
