"use client";
import { useState, useEffect } from "react";
import TradeProposalModal from "@/app/components/TradeProposalModal";

export default function TradeButton({ itemId, itemTitle }: { itemId: string; itemTitle: string }) {
  const [enabled, setEnabled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${itemId}/trade-settings`).then(r => r.json()).then(d => {
      setEnabled(d.tradeEnabled === true);
    }).catch(() => {});
  }, [itemId]);

  if (!enabled) return null;

  return (
    <>
      <button onClick={() => setShowModal(true)} style={{ width: "100%", height: 48, background: "transparent", border: "1px solid #00bcd4", color: "#00bcd4", fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: "pointer", marginTop: 8 }}>
        🔄 Propose a Trade
      </button>
      {showModal && <TradeProposalModal itemId={itemId} itemTitle={itemTitle} onClose={() => setShowModal(false)} />}
    </>
  );
}
