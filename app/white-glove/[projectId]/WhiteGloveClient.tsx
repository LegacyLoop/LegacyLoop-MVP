"use client";

import { useState } from "react";
import Link from "next/link";
import { safeJson } from "@/lib/utils/json";

const PHASE_ICONS: Record<string, string> = {
  "Consultation":        "🤝",
  "Photography":         "📸",
  "AI Analysis":         "🤖",
  "Pricing & Listing":   "💰",
  "Active Selling":      "🏷️",
  "Antique Review":      "🏺",
  "Closeout":            "📦",
  "Donation":            "🤝",
  "Junk Removal":        "🚛",
  "Final Cleanup":       "✨",
};

const TIER_LABELS: Record<string, string> = {
  ESSENTIALS: "Essentials",
  PROFESSIONAL: "Professional",
  LEGACY: "Legacy",
};

const TIER_COLORS: Record<string, { color: string; bg: string }> = {
  ESSENTIALS:   { color: "#92400e", bg: "#fef3c7" },
  PROFESSIONAL: { color: "#1e40af", bg: "#dbeafe" },
  LEGACY:       { color: "#6d28d9", bg: "#ede9fe" },
};

type Phase = {
  id: string;
  phaseNumber: number;
  phaseName: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  tasksJson: string;
  notes: string | null;
};

type Project = {
  id: string;
  tier: string;
  status: string;
  currentPhase: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number | null;
  estimatedItems: number;
  basePrice: number;
  commission: number;
  totalUpfront: number;
  estimatedValue: number | null;
  actualRevenue: number;
  projectManager: string | null;
  teamJson: string;
  consultDate: string | null;
  startDate: string | null;
  completionDate: string | null;
  estimatedWeeks: number | null;
  includedServicesJson: string;
  notes: string | null;
  createdAt: string;
  phases: Phase[];
};

type Item = {
  id: string;
  title: string;
  status: string;
  condition: string | null;
  estimatedValue: number | null;
  isAntique: boolean;
  photo: string | null;
};

export default function WhiteGloveClient({ project, items }: { project: Project; items: Item[] }) {
  const [tab, setTab] = useState<"overview" | "phases" | "inventory" | "team">("overview");
  const tier = TIER_COLORS[project.tier] ?? TIER_COLORS.ESSENTIALS;
  const team = safeJson(project.teamJson) ?? {};
  const includedServices: string[] = safeJson(project.includedServicesJson) ?? [];

  const completedPhases = project.phases.filter((p) => p.status === "COMPLETED").length;
  const totalPhases = project.phases.length;
  const phasePct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  const soldItems = items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status));
  const activeItems = items.filter((i) => ["LISTED", "INTERESTED", "READY", "ANALYZED"].includes(i.status));
  const antiqueItems = items.filter((i) => i.isAntique);

  const totalEstimated = items.reduce((sum, i) => sum + (i.estimatedValue ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <Link href="/white-glove" className="text-sm text-teal-700 hover:underline mb-2 inline-block">
            ← White-Glove Projects
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span style={{ padding: "0.15rem 0.6rem", borderRadius: "999px", background: tier.bg, color: tier.color, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {TIER_LABELS[project.tier] || project.tier}
            </span>
            <span style={{ padding: "0.15rem 0.6rem", borderRadius: "999px", background: "#f3f4f6", color: "#374151", fontSize: "0.72rem", fontWeight: 700 }}>
              {project.status.replace(/_/g, " ")}
            </span>
          </div>
          <h1 className="h2">{project.address}, {project.city}</h1>
          <p className="muted mt-1">
            {project.bedrooms ? `${project.bedrooms} bedroom · ` : ""}
            ~{project.estimatedItems} estimated items
            {project.projectManager ? ` · PM: ${project.projectManager}` : ""}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f766e" }}>
            ${project.totalUpfront.toLocaleString()}
          </div>
          <div className="muted text-xs">upfront + {Math.round(project.commission * 100)}% commission</div>
          {project.estimatedValue && (
            <div style={{ fontSize: "0.85rem", color: "#374151", marginTop: "0.2rem" }}>
              Est. value: ${project.estimatedValue.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalPhases > 0 && (
        <div className="card p-5 mb-6">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontWeight: 600 }}>Project Progress</span>
            <span style={{ color: "#0f766e", fontWeight: 700 }}>{phasePct}% complete</span>
          </div>
          <div style={{ height: "10px", background: "#f5f5f4", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${phasePct}%`, background: "linear-gradient(90deg, #0f766e, #14b8a6)", borderRadius: "9999px", transition: "width 0.6s ease" }} />
          </div>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "1.5rem", fontSize: "0.82rem", color: "#6b7280" }}>
            <span>✅ {completedPhases} phases done</span>
            <span>🔄 {project.phases.filter((p) => p.status === "IN_PROGRESS").length} in progress</span>
            <span>⏳ {project.phases.filter((p) => p.status === "PENDING").length} pending</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["overview", "phases", "inventory", "team"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "999px",
              border: "1.5px solid",
              borderColor: tab === t ? "#0f766e" : "#e7e5e4",
              background: tab === t ? "#f0fdfa" : "#fff",
              color: tab === t ? "#0f766e" : "#78716c",
              fontWeight: tab === t ? 700 : 400,
              cursor: "pointer",
              fontSize: "0.85rem",
              textTransform: "capitalize",
            }}
          >
            {t === "overview" ? "📋 Overview" : t === "phases" ? "📅 Phases" : t === "inventory" ? `📦 Inventory (${items.length})` : "👥 Team"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Key numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
            {[
              { label: "Items Listed", value: activeItems.length.toString(), icon: "🏷️" },
              { label: "Items Sold", value: soldItems.length.toString(), icon: "✅" },
              { label: "Antiques Found", value: antiqueItems.length.toString(), icon: "🏺" },
              { label: "Est. Portfolio", value: `$${Math.round(totalEstimated).toLocaleString()}`, icon: "💰" },
              { label: "Revenue So Far", value: `$${Math.round(project.actualRevenue).toLocaleString()}`, icon: "📈" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="card p-4 text-center">
                <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{icon}</div>
                <div style={{ fontWeight: 800, fontSize: "1.3rem" }}>{value}</div>
                <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <div className="section-title mb-4">Project Timeline</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { label: "Consultation", date: project.consultDate, icon: "🤝" },
                { label: "Start Date",   date: project.startDate,   icon: "🚀" },
                { label: "Target Done",  date: project.completionDate, icon: "🎯" },
              ].map(({ label, date, icon }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem" }}>{icon}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.82rem", marginTop: "0.25rem" }}>{label}</div>
                  <div style={{ color: "#0f766e", fontWeight: 700, fontSize: "0.85rem" }}>
                    {date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}
                  </div>
                </div>
              ))}
            </div>
            {project.estimatedWeeks && (
              <div style={{ textAlign: "center", marginTop: "0.75rem", color: "#6b7280", fontSize: "0.82rem" }}>
                Estimated duration: {project.estimatedWeeks} weeks
              </div>
            )}
          </div>

          {/* Included services */}
          {includedServices.length > 0 && (
            <div className="card p-6">
              <div className="section-title mb-3">Included Services</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                {includedServices.map((s: string) => (
                  <div key={s} style={{ display: "flex", gap: "0.4rem", fontSize: "0.85rem" }}>
                    <span style={{ color: "#0f766e" }}>✓</span> {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div className="card p-5">
              <div className="section-title mb-2">Notes</div>
              <p style={{ fontSize: "0.88rem", color: "#374151" }}>{project.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Phases Tab */}
      {tab === "phases" && (
        <div className="card p-6">
          <div className="section-title mb-4">Project Phases</div>
          {project.phases.length === 0 ? (
            <p className="muted text-sm">No phases have been set up for this project yet.</p>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Vertical connector */}
              <div style={{ position: "absolute", left: "23px", top: "32px", bottom: "32px", width: "2px", background: "#e7e5e4" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {project.phases.map((phase, idx) => {
                  const tasks: { label: string; done: boolean }[] = safeJson(phase.tasksJson) ?? [];
                  const doneTasks = tasks.filter((t) => t.done).length;
                  const icon = PHASE_ICONS[phase.phaseName] ?? "📋";
                  const statusColors = {
                    COMPLETED:   { bg: "#dcfce7", border: "#86efac", text: "#15803d" },
                    IN_PROGRESS: { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
                    PENDING:     { bg: "#f3f4f6", border: "#e5e7eb", text: "#9ca3af" },
                  };
                  const sc = statusColors[phase.status as keyof typeof statusColors] ?? statusColors.PENDING;

                  return (
                    <div key={phase.id} style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", position: "relative" }}>
                      {/* Phase circle */}
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: sc.bg,
                        border: `2px solid ${sc.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        flexShrink: 0,
                        zIndex: 1,
                        position: "relative",
                      }}>
                        {phase.status === "COMPLETED" ? "✅" : icon}
                      </div>

                      <div style={{ flex: 1, paddingTop: "0.35rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700 }}>Phase {phase.phaseNumber}: {phase.phaseName}</span>
                          <span style={{ padding: "0.1rem 0.5rem", borderRadius: "999px", background: sc.bg, color: sc.text, fontSize: "0.7rem", fontWeight: 700 }}>
                            {phase.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        {phase.startedAt && (
                          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.15rem" }}>
                            Started {new Date(phase.startedAt).toLocaleDateString()}
                            {phase.completedAt ? ` · Done ${new Date(phase.completedAt).toLocaleDateString()}` : ""}
                          </div>
                        )}

                        {/* Task checklist */}
                        {tasks.length > 0 && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <div style={{ fontSize: "0.72rem", color: "#6b7280", marginBottom: "0.3rem" }}>
                              {doneTasks}/{tasks.length} tasks complete
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                              {tasks.map((task, ti) => (
                                <div key={ti} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem" }}>
                                  <span style={{ color: task.done ? "#15803d" : "#d1d5db", fontSize: "0.8rem" }}>
                                    {task.done ? "☑" : "☐"}
                                  </span>
                                  <span style={{ color: task.done ? "#374151" : "#9ca3af", textDecoration: task.done ? "line-through" : "none" }}>
                                    {task.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {phase.notes && (
                          <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#6b7280", fontStyle: "italic" }}>
                            Note: {phase.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {tab === "inventory" && (
        <div>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {[
              { label: "All Items", count: items.length, key: "all" },
              { label: "Active Listings", count: activeItems.length, key: "active" },
              { label: "Sold", count: soldItems.length, key: "sold" },
              { label: "Antiques", count: antiqueItems.length, key: "antique" },
            ].map(({ label, count }) => (
              <div key={label} style={{ padding: "0.4rem 0.875rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.625rem", fontSize: "0.82rem", fontWeight: 600 }}>
                {label}: <span style={{ color: "#0f766e" }}>{count}</span>
              </div>
            ))}
          </div>

          {items.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="muted">No items in your inventory yet.</p>
              <Link href="/items/new" className="btn-primary mt-4 inline-flex">Add your first item →</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
              {items.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`} className="card card-hover p-4 block">
                  {item.photo && (
                    <img src={item.photo} alt={item.title} style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "0.75rem", marginBottom: "0.5rem" }} />
                  )}
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", wordBreak: "break-word" }}>{item.title}</div>
                  <div style={{ marginTop: "0.3rem", display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: "999px", background: "#f3f4f6", color: "#6b7280" }}>
                      {item.status}
                    </span>
                  </div>
                  {item.estimatedValue && (
                    <div style={{ fontSize: "0.8rem", color: "#0f766e", fontWeight: 700, marginTop: "0.25rem" }}>
                      ~${Math.round(item.estimatedValue).toLocaleString()}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team Tab */}
      {tab === "team" && (
        <div className="card p-6">
          <div className="section-title mb-4">Project Team</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {[
              { role: "Project Manager",  value: project.projectManager, icon: "👔", key: "pm" },
              { role: "Photographer",     value: team.photographer,      icon: "📸", key: "photo" },
              { role: "Appraiser",        value: team.appraiser,         icon: "🔍", key: "appraise" },
              { role: "Coordinator",      value: team.coordinator,       icon: "📋", key: "coord" },
              { role: "Cleaning Crew",    value: team.cleaner,           icon: "✨", key: "clean" },
              { role: "Junk Removal",     value: team.junkRemoval,       icon: "🚛", key: "junk" },
            ].map(({ role, value, icon }) => (
              <div
                key={role}
                style={{
                  padding: "1rem",
                  border: "1.5px solid",
                  borderColor: value ? "#e7e5e4" : "#f5f5f4",
                  borderRadius: "0.875rem",
                  background: value ? "#fff" : "#fafafa",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>{icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#374151" }}>{role}</div>
                <div style={{ fontSize: "0.88rem", marginTop: "0.15rem", color: value ? "#0f766e" : "#9ca3af", fontWeight: value ? 600 : 400 }}>
                  {value || "Not assigned"}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: "0.875rem" }}>
            <div style={{ fontWeight: 600, color: "#0f766e", marginBottom: "0.25rem" }}>Need to add or change team members?</div>
            <div style={{ fontSize: "0.82rem", color: "#374151" }}>
              Contact your project manager or call (207) 555-0127 to update the team for this project.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
