import { useState } from "react";
import "../styles/ComplaintCard.css";

export default function ComplaintCard({ data }) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const {
    ticket_id,
    subject,
    description,
    category = "Network Connectivity",
    confidence = 90.0,
    priority = "MEDIUM",
    sentiment = "Neutral",
    sentiment_score = 0.0,
    escalation_required = false,
    escalation_risk_score = 30.0,
    escalation_reasons = [],
    response,
    solution,
    ticket_summary,
    incident_summary,
    likely_cause,
    alternative_causes = [],
    recommended_actions = [],
    customer_impact,
    customer_response,
    resolution_basis,
    similar_issues = [],
    kb_sources = [],
  } = data || {};

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticket_id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityStyle = (prio) => {
    const p = (prio || "").toUpperCase();
    if (p.includes("CRITICAL") || p.includes("P1") || p === "HIGH") return { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" };
    if (p.includes("HIGH") || p.includes("P2")) return { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" };
    if (p.includes("MEDIUM") || p.includes("P3")) return { bg: "#fef3c7", text: "#b45309", border: "#fde68a" };
    return { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" };
  };

  const prioStyle = getPriorityStyle(priority);

  if (data.is_sufficient === false) {
    return (
      <div className="complaint-card" style={{ borderTop: "4px solid #f59e0b", background: "rgba(245, 158, 11, 0.05)", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, color: "#d97706", fontSize: "1.15rem" }}>Insufficient Complaint Information</h3>
            <p style={{ margin: "0.2rem 0 0 0", opacity: 0.9, fontSize: "0.9rem" }}>Automated AI analysis was paused because the submitted message lacks actionable telecom details.</p>
          </div>
        </div>
        <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "1rem", borderRadius: "8px", fontSize: "0.9rem", lineHeight: 1.5 }}>
          <strong>Required Details to Process Your Request:</strong>
          <ul style={{ margin: "0.5rem 0 0 1.2rem", padding: 0 }}>
            <li>Specific issue description (e.g. broadband disconnected, billing overcharge, dropped calls)</li>
            <li>Affected service type (e.g. Fiber Internet, Mobile Signal, SIM, Router)</li>
            <li>Problem duration (e.g. since yesterday, past 2 hours)</li>
            <li>Location / Area if relevant</li>
          </ul>
        </div>
        <p style={{ marginTop: "1rem", marginBottom: 0, fontSize: "0.9rem", fontStyle: "italic", opacity: 0.85 }}>
          {response}
        </p>
      </div>
    );
  }

  return (
    <div className="complaint-card" style={{ borderTop: `4px solid ${prioStyle.text}` }}>
      {/* Header Bar */}
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1B4DFF" }}>#{ticket_id}</span>
          <button
            onClick={handleCopyTicket}
            style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px", cursor: "pointer", border: "1px solid #e2e8f0", background: "#ffffff" }}
          >
            {copied ? "Copied! ✓" : "Copy ID"}
          </button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span className="category-badge" style={{ padding: "0.25rem 0.75rem", borderRadius: "12px", background: "rgba(27, 77, 255, 0.1)", color: "#1B4DFF", fontWeight: 600, fontSize: "0.85rem" }}>
            {category} ({confidence}% conf)
          </span>
        </div>
      </div>

      {/* Subject & Description */}
      <div className="card-body" style={{ marginTop: "1rem" }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>{subject || "Telecom Incident Report"}</h3>
        <p style={{ margin: 0, opacity: 0.85, fontSize: "0.95rem", lineHeight: 1.5 }}>{description}</p>
      </div>

      {/* TELECOMIQ TRIAGE RESULT HEADER */}
      <div style={{ marginTop: "1.5rem", paddingTop: "1.2rem", borderTop: "2px dashed var(--border-medium, rgba(148, 163, 184, 0.2))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h4 style={{ margin: 0, fontSize: "0.85rem", letterSpacing: "1.2px", textTransform: "uppercase", fontWeight: 800, color: "var(--accent-blue, #3b82f6)" }}>
            TELECOMIQ TRIAGE RESULT
          </h4>
        </div>

        {/* 1. AI INCIDENT SUMMARY */}
        {(incident_summary || ticket_summary) && (
          <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "8px", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.18)" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "#2563eb", letterSpacing: "0.5px", marginBottom: "0.4rem" }}>
              AI INCIDENT SUMMARY
            </div>
            <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.6, color: "var(--text-primary, #0f172a)" }}>
              {incident_summary || ticket_summary}
            </p>
          </div>
        )}

        {/* 2. LIKELY CAUSE */}
        {(likely_cause || (alternative_causes && alternative_causes.length > 0)) && (
          <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "8px", background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.18)" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "#7c3aed", letterSpacing: "0.5px", marginBottom: "0.4rem" }}>
              LIKELY CAUSE
            </div>
            {likely_cause && (
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "0.4rem" }}>
                Primary Hypothesis: <span style={{ color: "#7c3aed" }}>{(likely_cause || "").replace(/^(primary\s+hypothesis:\s*)+/i, "").trim()}</span>
              </div>
            )}
            {alternative_causes && alternative_causes.length > 0 && (
              <div style={{ fontSize: "0.85rem", marginTop: "0.4rem", color: "var(--text-secondary, #334155)" }}>
                <span style={{ fontWeight: 600 }}>Other possibilities to consider/rule out:</span>
                <ul style={{ margin: "0.3rem 0 0 1.2rem", padding: 0, lineHeight: 1.5 }}>
                  {alternative_causes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 3. RECOMMENDED ACTION */}
        {((recommended_actions && recommended_actions.length > 0) || solution) && (
          <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "#059669", letterSpacing: "0.5px" }}>
                RECOMMENDED ACTION
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "4px", background: "rgba(16, 185, 129, 0.15)", color: "#059669" }}>
                Target SLA: {priority === "CRITICAL" ? "2 hours" : priority === "HIGH" ? "6 hours" : priority === "MEDIUM" ? "12 hours" : "24 hours"}
              </span>
            </div>
            {recommended_actions && recommended_actions.length > 0 ? (
              <ol style={{ margin: "0.3rem 0 0 1.2rem", padding: 0, fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-primary, #0f172a)" }}>
                {recommended_actions.map((act, i) => (
                  <li key={i} style={{ marginBottom: "0.3rem" }}>{act}</li>
                ))}
              </ol>
            ) : (
              <div style={{ fontSize: "0.9rem", whiteSpace: "pre-line", lineHeight: 1.5, color: "var(--text-primary, #0f172a)" }}>{solution}</div>
            )}
          </div>
        )}

        {/* 4. CUSTOMER IMPACT */}
        {(customer_impact || priority) && (
          <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", borderRadius: "8px", background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.18)", display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "#d97706", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
              CUSTOMER IMPACT:
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary, #0f172a)" }}>
              {customer_impact || `${priority} Severity impact on subscriber services.`}
            </div>
          </div>
        )}

        {/* 5. CUSTOMER RESPONSE */}
        {(customer_response || response) && (
          <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "8px", background: "rgba(2, 132, 199, 0.05)", border: "1px solid rgba(2, 132, 199, 0.18)" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "#0284c7", letterSpacing: "0.5px", marginBottom: "0.4rem" }}>
              CUSTOMER RESPONSE (AUTOMATED OUTREACH)
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-primary, #0f172a)", fontStyle: "italic" }}>
              "{customer_response || response}"
            </p>
          </div>
        )}

        {/* 6. WHY THIS RECOMMENDATION? */}
        {(resolution_basis || (similar_issues && similar_issues.length > 0)) && (
          <div style={{ marginBottom: "0.5rem", padding: "0.85rem 1rem", borderRadius: "8px", background: "rgba(100, 116, 139, 0.06)", border: "1px solid rgba(100, 116, 139, 0.15)" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "#64748b", letterSpacing: "0.5px", marginBottom: "0.3rem" }}>
              WHY THIS RECOMMENDATION?
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-primary, #334155)", lineHeight: 1.5 }}>
              {resolution_basis || `${similar_issues.length} similar historical complaints matched.`}
            </div>
          </div>
        )}
      </div>

      {/* AI Telemetry Metrics Row (Placed below Triage Results) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", margin: "1.2rem 0" }}>
        <div style={{ padding: "0.75rem", borderRadius: "8px", background: prioStyle.bg, border: `1px solid ${prioStyle.border}`, color: prioStyle.text }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Priority Severity</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, marginTop: "0.2rem" }}>{priority}</div>
          {data.priority_reconciliation_note && (
            <div style={{ fontSize: "0.75rem", marginTop: "0.4rem", fontWeight: 600, color: "#1e3a8a", background: "#dbeafe", padding: "4px 8px", borderRadius: "4px" }}>
              ℹ️ {data.priority_reconciliation_note}
            </div>
          )}
        </div>

        <div style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(100, 116, 139, 0.08)", border: "1px solid rgba(100, 116, 139, 0.15)" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.7 }}>Sentiment & Polarity</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.2rem" }}>
            {sentiment} ({sentiment_score})
          </div>
        </div>

        <div style={{ padding: "0.75rem", borderRadius: "8px", background: escalation_risk_score >= 60 ? "rgba(225, 29, 72, 0.08)" : "rgba(16, 185, 129, 0.08)", border: escalation_risk_score >= 60 ? "1px solid rgba(225, 29, 72, 0.25)" : "1px solid rgba(16, 185, 129, 0.25)" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.8 }}>Escalation Risk Score</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, marginTop: "0.2rem", color: escalation_risk_score >= 60 ? "#e11d48" : "#059669" }}>
            {escalation_risk_score}% {escalation_required ? "(HIGH)" : "(STABLE)"}
          </div>
        </div>
      </div>

      {/* High Escalation Warning & Reasons */}
      {(escalation_required || escalation_risk_score >= 60) && (
        <div style={{ padding: "0.9rem", borderRadius: "8px", background: "rgba(225, 29, 72, 0.06)", border: "1px solid rgba(225, 29, 72, 0.25)", marginBottom: "1.2rem" }}>
          <div style={{ fontWeight: 700, color: "#e11d48", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>HUMAN OPERATOR REVIEW REQUIRED</span>
          </div>
          <div style={{ fontSize: "0.85rem", marginTop: "0.4rem", opacity: 0.9 }}>
            This complaint exceeded the automated escalation risk threshold.
          </div>
          {escalation_reasons && escalation_reasons.length > 0 && (
            <ul style={{ margin: "0.4rem 0 0 1.2rem", padding: 0, fontSize: "0.85rem" }}>
              {escalation_reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Vector RAG — Similar Historical Complaints */}
      {similar_issues && similar_issues.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={{ margin: "0 0 0.6rem 0", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.8 }}>Matched Historical Complaints:</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {similar_issues.map((item, idx) => (
              <div key={idx} style={{ padding: "0.6rem 0.8rem", borderRadius: "6px", background: "rgba(100, 116, 139, 0.06)", border: "1px solid rgba(148, 163, 184, 0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                <div>
                  <strong style={{ color: "#3b82f6" }}>#{item.ticket_id}</strong> — {item.description}
                  <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>Category: {item.category} | Status: <strong>{item.status}</strong></div>
                </div>
                <div style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  {item.similarity_percent}% match
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RAG KB Sources */}
      {kb_sources && kb_sources.length > 0 && (
        <div style={{ marginTop: "1rem", fontSize: "0.8rem", opacity: 0.7, borderTop: "1px dashed rgba(100, 116, 139, 0.2)", paddingTop: "0.5rem" }}>
          Knowledge Base SOP Sources: {kb_sources.join(" | ")}
        </div>
      )}
    </div>
  );
}
