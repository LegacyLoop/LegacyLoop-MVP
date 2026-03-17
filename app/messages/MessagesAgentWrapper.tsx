"use client";
import { useState, useEffect } from "react";
import InboxCommandCenter from "@/app/components/messaging/InboxCommandCenter";
import AgentSettings from "@/app/components/messaging/AgentSettings";
import WeeklyReportCard from "@/app/components/messaging/WeeklyReportCard";

export default function MessagesAgentWrapper({ children }: { children: React.ReactNode }) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [agentResult, setAgentResult] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Listen for conversation selection events from MessagesClient
  useEffect(() => {
    function handleConvSelect(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.conversationId) setSelectedConvId(detail.conversationId);
    }
    window.addEventListener("conversation-selected", handleConvSelect);
    return () => window.removeEventListener("conversation-selected", handleConvSelect);
  }, []);

  // Listen for agent fill message events
  useEffect(() => {
    function handleFill(e: Event) {
      // This event is dispatched by agent components
      // The existing MessagesClient can optionally listen for it
    }
    window.addEventListener("agent-fill-message", handleFill);
    return () => window.removeEventListener("agent-fill-message", handleFill);
  }, []);

  // Listen for agent settings toggle from InboxCommandCenter
  useEffect(() => {
    const handler = () => setShowSettings(prev => !prev);
    window.addEventListener("agent-settings-toggle", handler);
    return () => window.removeEventListener("agent-settings-toggle", handler);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <WeeklyReportCard />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <InboxCommandCenter selectedConversationId={selectedConvId}>
          {children}
        </InboxCommandCenter>
      </div>
      {showSettings && <AgentSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
