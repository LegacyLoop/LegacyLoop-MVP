"use client";

import { useState } from "react";
import { safeJson } from "@/lib/utils/json";

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  JUNK_REMOVAL:  { label: "Junk Removal",  icon: "🚛", color: "#92400e", bg: "#fef3c7" },
  CLEANING:      { label: "Cleaning",      icon: "✨", color: "#1e40af", bg: "#dbeafe" },
  STAGING:       { label: "Staging",       icon: "🛋️", color: "#6d28d9", bg: "#ede9fe" },
  DONATION:      { label: "Donation",      icon: "🤝", color: "#15803d", bg: "#dcfce7" },
  PHOTOGRAPHY:   { label: "Photography",   icon: "📸", color: "#0f766e", bg: "#ccfbf1" },
  APPRAISAL:     { label: "Appraisal",     icon: "🔍", color: "#b45309", bg: "#fef9c3" },
};

// ── Demo contractors seeded in UI if DB is empty ──────────────────────────
const DEMO_CONTRACTORS = [
  { id: "d1", type: "JUNK_REMOVAL", company: "Casco Bay Hauling", contactName: "Jim Hartley", phone: "(207) 555-0201", email: "jim@cascobay.com", serviceArea: "Southern Maine", ratesJson: '{"baseRate":150,"perHour":75,"unit":"load"}', rating: 4.9, reviewCount: 47, available: true, notes: "Same-day availability most days. Licensed and insured." },
  { id: "d2", type: "CLEANING",    company: "Coastal Clean Crew", contactName: "Maria Santos",  phone: "(207) 555-0202", email: "maria@coastalclean.com", serviceArea: "Portland metro area", ratesJson: '{"baseRate":200,"perHour":45,"unit":"hour"}', rating: 4.8, reviewCount: 31, available: true, notes: "Specializes in post-estate deep cleans. Eco-friendly products." },
  { id: "d3", type: "PHOTOGRAPHY", company: "Harbor Light Studios", contactName: "Tom Wentworth", phone: "(207) 555-0203", email: "tom@harborlight.com", serviceArea: "All of Maine", ratesJson: '{"baseRate":250,"perHour":85,"unit":"session"}', rating: 5.0, reviewCount: 22, available: true, notes: "Specializes in estate and antique photography. RAW files included." },
  { id: "d4", type: "APPRAISAL",   company: "Maine Antique Appraisers", contactName: "Dr. Ellen Ross",    phone: "(207) 555-0204", email: "ellen@maineappraisers.com", serviceArea: "New England",  ratesJson: '{"baseRate":300,"perHour":150,"unit":"hour"}', rating: 4.9, reviewCount: 58, available: false, notes: "Certified ASA appraiser. 25 years experience. 3-week booking lead time." },
  { id: "d5", type: "DONATION",    company: "Goodwill of Maine", contactName: "Pickup Desk",   phone: "(207) 555-0205", email: "pickup@goodwillme.org", serviceArea: "Statewide", ratesJson: '{"baseRate":0,"perHour":0,"unit":"free"}', rating: 4.7, reviewCount: 112, available: true, notes: "Free pickup for qualifying donations. Tax receipts provided same-day." },
  { id: "d6", type: "STAGING",     company: "Portland Home Staging", contactName: "Lisa Chen",       phone: "(207) 555-0206", email: "lisa@portlandhomestaging.com", serviceArea: "Greater Portland",  ratesJson: '{"baseRate":400,"perHour":95,"unit":"day"}', rating: 4.6, reviewCount: 19, available: true, notes: "Full staging for estate sale days. Furniture placement, signage, and flow." },
  { id: "d7", type: "JUNK_REMOVAL", company: "Green Dream Removal",   contactName: "Paul Ouellette", phone: "(207) 555-0207", email: "paul@greendream.com", serviceArea: "Mid-coast Maine", ratesJson: '{"baseRate":120,"perHour":60,"unit":"load"}', rating: 4.7, reviewCount: 33, available: true, notes: "Eco-conscious — donates or recycles before landfill. Veteran-owned." },
  { id: "d8", type: "CLEANING",     company: "Sunrise Estate Services", contactName: "Debra Roy",   phone: "(207) 555-0208", email: "debra@sunrisemaine.com", serviceArea: "All of Maine", ratesJson: '{"baseRate":175,"perHour":40,"unit":"hour"}', rating: 4.5, reviewCount: 28, available: false, notes: "Full estate clearing + cleaning packages. Family business since 1998." },
];

type Contractor = {
  id: string;
  type: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  serviceArea: string;
  ratesJson: string;
  rating: number;
  reviewCount: number;
  available: boolean;
  notes: string | null;
};

type Job = {
  id: string;
  contractorId: string;
  projectId: string;
  jobType: string;
  scheduledDate: string;
  completedDate: string | null;
  cost: number;
  paid: boolean;
  notes: string | null;
};

type Props = { contractors: Contractor[]; jobs: Job[] };

export default function ContractorsClient({ contractors, jobs }: Props) {
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showAvailOnly, setShowAvailOnly] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  // Use demo data if DB is empty
  const displayContractors: Contractor[] = contractors.length > 0 ? contractors : (DEMO_CONTRACTORS as Contractor[]);

  const types = ["ALL", ...Object.keys(TYPE_META)];
  const filtered = displayContractors.filter((c) => {
    if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
    if (showAvailOnly && !c.available) return false;
    return true;
  });

  const availableCount = displayContractors.filter((c) => c.available).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="section-title">Contractor Network</div>
      <h1 className="h2 mt-2 mb-2">Trusted Service Providers</h1>
      <p className="muted mb-6">
        Pre-vetted contractors for every phase of your estate project — junk removal, cleaning, photography, appraisal, and more.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Total Providers", value: displayContractors.length, color: "#0f766e" },
          { label: "Available Now", value: availableCount, color: "#15803d" },
          { label: "Service Types", value: Object.keys(TYPE_META).length, color: "#1e40af" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: "0.625rem 1.25rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.875rem" }}>
            <span style={{ fontWeight: 800, fontSize: "1.25rem", color }}>{value}</span>
            <span style={{ marginLeft: "0.4rem", fontSize: "0.82rem", color: "#6b7280" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        {types.map((t) => {
          const meta = TYPE_META[t];
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: "0.35rem 0.875rem",
                borderRadius: "999px",
                border: "1.5px solid",
                borderColor: typeFilter === t ? "#0f766e" : "#e7e5e4",
                background: typeFilter === t ? "#f0fdfa" : "#fff",
                color: typeFilter === t ? "#0f766e" : "#78716c",
                fontWeight: typeFilter === t ? 700 : 400,
                cursor: "pointer",
                fontSize: "0.82rem",
              }}
            >
              {meta ? `${meta.icon} ${meta.label}` : "All Types"}
            </button>
          );
        })}
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginLeft: "auto", fontSize: "0.82rem", cursor: "pointer" }}>
          <input type="checkbox" checked={showAvailOnly} onChange={(e) => setShowAvailOnly(e.target.checked)} />
          Available now only
        </label>
      </div>

      {/* Contractor grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.875rem" }}>
        {filtered.map((c) => {
          const meta = TYPE_META[c.type] ?? { label: c.type, icon: "🔧", color: "#374151", bg: "#f3f4f6" };
          const rates = safeJson(c.ratesJson) ?? {};

          return (
            <div
              key={c.id}
              className="card"
              style={{ padding: "1.25rem", cursor: "pointer", transition: "box-shadow 0.15s" }}
              onClick={() => setSelectedContractor(c)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div>
                  <span style={{ padding: "0.12rem 0.5rem", borderRadius: "999px", background: meta.bg, color: meta.color, fontSize: "0.68rem", fontWeight: 700, marginBottom: "0.3rem", display: "inline-block" }}>
                    {meta.icon} {meta.label}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{c.company}</div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{c.contactName}</div>
                </div>
                <span style={{ padding: "0.15rem 0.5rem", borderRadius: "999px", background: c.available ? "#dcfce7" : "#f3f4f6", color: c.available ? "#15803d" : "#9ca3af", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>
                  {c.available ? "✅ Available" : "⏳ Booked"}
                </span>
              </div>

              {/* Rating */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "#f59e0b", fontSize: "0.9rem" }}>{"★".repeat(Math.round(c.rating))}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{c.rating.toFixed(1)}</span>
                <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>({c.reviewCount} reviews)</span>
              </div>

              <div style={{ fontSize: "0.78rem", color: "#374151", marginBottom: "0.5rem" }}>
                📍 {c.serviceArea}
              </div>

              {rates.baseRate > 0 && (
                <div style={{ fontSize: "0.82rem", color: "#0f766e", fontWeight: 600 }}>
                  From ${rates.baseRate} per {rates.unit}
                </div>
              )}
              {rates.baseRate === 0 && (
                <div style={{ fontSize: "0.82rem", color: "#15803d", fontWeight: 600 }}>Free service</div>
              )}

              <div style={{ marginTop: "0.875rem", display: "flex", gap: "0.4rem" }}>
                <a href={`tel:${c.phone}`} className="btn-ghost" style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}>
                  📞 Call
                </a>
                <a href={`mailto:${c.email}`} className="btn-ghost" style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}>
                  ✉️ Email
                </a>
                <button className="btn-primary" style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                  onClick={(e) => { e.stopPropagation(); setSelectedContractor(c); }}>
                  Book
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
          <p>No contractors match your filters. Try changing the type or availability filter.</p>
        </div>
      )}

      {/* Contractor detail modal */}
      {selectedContractor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setSelectedContractor(null)}>
          <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            {(() => {
              const c = selectedContractor;
              const meta = TYPE_META[c.type] ?? { label: c.type, icon: "🔧", color: "#374151", bg: "#f3f4f6" };
              const rates = safeJson(c.ratesJson) ?? {};
              return (
                <>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ padding: "0.12rem 0.5rem", borderRadius: "999px", background: meta.bg, color: meta.color, fontSize: "0.68rem", fontWeight: 700 }}>
                        {meta.icon} {meta.label}
                      </span>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "0.35rem" }}>{c.company}</h2>
                    </div>
                    <button onClick={() => setSelectedContractor(null)} style={{ fontSize: "1.25rem", color: "#6b7280", cursor: "pointer", background: "none", border: "none" }}>✕</button>
                  </div>

                  <div style={{ margin: "1rem 0", padding: "0.875rem 1rem", background: "#f8fafc", borderRadius: "0.875rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                      <div><span style={{ color: "#6b7280" }}>Contact:</span> <strong>{c.contactName}</strong></div>
                      <div><span style={{ color: "#6b7280" }}>Rating:</span> <strong>⭐ {c.rating.toFixed(1)} ({c.reviewCount})</strong></div>
                      <div><span style={{ color: "#6b7280" }}>Phone:</span> <a href={`tel:${c.phone}`} style={{ color: "#0f766e", fontWeight: 600 }}>{c.phone}</a></div>
                      <div><span style={{ color: "#6b7280" }}>Area:</span> <strong>{c.serviceArea}</strong></div>
                      <div style={{ gridColumn: "1/-1" }}><span style={{ color: "#6b7280" }}>Email:</span> <a href={`mailto:${c.email}`} style={{ color: "#0f766e" }}>{c.email}</a></div>
                    </div>
                  </div>

                  {rates.baseRate !== undefined && (
                    <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: "0.875rem" }}>
                      <div style={{ fontWeight: 600, color: "#0f766e" }}>
                        {rates.baseRate === 0 ? "Free service" : `From $${rates.baseRate} per ${rates.unit}`}
                      </div>
                      {rates.perHour > 0 && <div style={{ fontSize: "0.78rem", color: "#374151" }}>${rates.perHour}/hour after base</div>}
                    </div>
                  )}

                  {c.notes && (
                    <p style={{ fontSize: "0.85rem", color: "#374151", marginBottom: "1.25rem", lineHeight: 1.5 }}>{c.notes}</p>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a href={`tel:${c.phone}`} className="btn-primary" style={{ flex: 1, textAlign: "center" }}>📞 Call Now</a>
                    <a href={`mailto:${c.email}`} className="btn-ghost" style={{ flex: 1, textAlign: "center" }}>✉️ Email</a>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
