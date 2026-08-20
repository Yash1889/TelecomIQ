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
    action,
    similar_issues = [],
    kb_sources = [],
    steps = [],
    compliance_analysis = {}
  } = data;

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

  const getSentimentBadge = (sent) => {
    switch (sent) {
      case "Angry": return "😡 Angry";
      case "Negative": return "🙁 Negative";
      case "Positive": return "😊 Positive";
      default: return "😐 Neutral";
    }
  };

  const prioStyle = getPriorityStyle(priority);

  // ── Compliance helpers ────────────────────────────────────────────────── //
  const getRiskStyle = (level) => {
    switch ((level || "").toUpperCase()) {
      case "CRITICAL": return { bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.35)",  text: "#dc2626", icon: "🚨" };
      case "HIGH":     return { bg: "rgba(234,88,12,0.08)",  border: "rgba(234,88,12,0.35)",  text: "#ea580c", icon: "⚠️" };
      case "MEDIUM":   return { bg: "rgba(202,138,4,0.08)",  border: "rgba(202,138,4,0.35)",  text: "#ca8a04", icon: "🔔" };
      case "LOW":      return { bg: "rgba(37,99,235,0.06)",  border: "rgba(37,99,235,0.25)",  text: "#2563eb", icon: "ℹ️" };
      default:         return { bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.25)", text: "#059669", icon: "✅" };
    }
  };

  const ca = compliance_analysis || {};
  const riskLevel = ca.risk_level || "CLEAR";
  const riskStyle = getRiskStyle(riskLevel);
  const showCompliance = Object.keys(ca).length > 0;

  if (data.is_sufficient === false) {
    return (
      <div className="complaint-card" style={{ borderTop: "4px solid #f59e0b", background: "rgba(245, 158, 11, 0.05)", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.5rem" }}>ℹ️</span>
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
          💬 {response}
        </p>
      </div>
    );
  }

  return (
    <div className="complaint-card" style={{ borderTop: `4px solid ${prioStyle.text}` }}>
      {/* Header Bar */}
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2563eb" }}>#{ticket_id}</span>
          <button
            onClick={handleCopyTicket}
            style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px", cursor: "pointer" }}
          >
            {copied ? "Copied! ✓" : "Copy ID"}
          </button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span className="category-badge" style={{ padding: "0.25rem 0.75rem", borderRadius: "12px", background: "rgba(37, 99, 235, 0.1)", color: "#2563eb", fontWeight: 600, fontSize: "0.85rem" }}>
            📂 {category} ({confidence}% conf)
          </span>
        </div>
      </div>

      {/* Subject & Description */}
      <div className="card-body" style={{ marginTop: "1rem" }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>{subject || "Telecom Incident Report"}</h3>
        <p style={{ margin: 0, opacity: 0.85, fontSize: "0.95rem", lineHeight: 1.5 }}>{description}</p>
      </div>

      {/* AI Telemetry Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", margin: "1.2rem 0" }}>
        <div style={{ padding: "0.75rem", borderRadius: "8px", background: prioStyle.bg, border: `1px solid ${prioStyle.border}`, color: prioStyle.text }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Priority Severity</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, marginTop: "0.2rem" }}>{priority}</div>
        </div>

        <div style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(100, 116, 139, 0.1)", border: "1px solid rgba(100, 116, 139, 0.2)" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.7 }}>Sentiment & Polarity</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.2rem" }}>
            {getSentimentBadge(sentiment)} ({sentiment_score})
          </div>
        </div>

        <div style={{ padding: "0.75rem", borderRadius: "8px", background: escalation_risk_score >= 60 ? "rgba(225, 29, 72, 0.1)" : "rgba(16, 185, 129, 0.1)", border: escalation_risk_score >= 60 ? "1px solid rgba(225, 29, 72, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.8 }}>Escalation Risk Score</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, marginTop: "0.2rem", color: escalation_risk_score >= 60 ? "#e11d48" : "#059669" }}>
            {escalation_risk_score}% {escalation_required ? "⚠️ HIGH" : "✓ STABLE"}
          </div>
        </div>
      </div>

      {/* High Escalation Warning & Reasons */}
      {(escalation_required || escalation_risk_score >= 60) && (
        <div style={{ padding: "0.9rem", borderRadius: "8px", background: "rgba(225, 29, 72, 0.08)", border: "1px solid rgba(225, 29, 72, 0.3)", marginBottom: "1.2rem" }}>
          <div style={{ fontWeight: 700, color: "#e11d48", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚠️</span>
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

      {/* Technical Solution SOP */}
      {solution && (
        <div style={{ marginBottom: "1.2rem", padding: "0.9rem", borderRadius: "8px", background: "rgba(37, 99, 235, 0.05)", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
          <h4 style={{ margin: "0 0 0.4rem 0", color: "#2563eb", fontSize: "0.95rem" }}>🛠️ Recommended Technical SOP Action Plan:</h4>
          <div style={{ fontSize: "0.9rem", whiteSpace: "pre-line", lineHeight: 1.5 }}>{solution}</div>
        </div>
      )}

      {/* Grounded Customer Response */}
      {response && (
        <div style={{ marginBottom: "1.2rem", padding: "0.9rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
          <h4 style={{ margin: "0 0 0.4rem 0", color: "#059669", fontSize: "0.95rem" }}>💬 Grounded Customer Response:</h4>
          <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{response}</div>
        </div>
      )}

      {/* Vector Similar Historical Complaints */}
      {similar_issues && similar_issues.length > 0 && (
        <div style={{ marginTop: "1.2rem" }}>
          <h4 style={{ margin: "0 0 0.6rem 0", fontSize: "0.95rem", opacity: 0.9 }}>🔍 Top Similar Historical Complaints (Vector RAG Match):</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {similar_issues.map((item, idx) => (
              <div key={idx} style={{ padding: "0.6rem 0.8rem", borderRadius: "6px", background: "rgba(100, 116, 139, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                <div>
                  <strong style={{ color: "#2563eb" }}>{item.ticket_id}</strong> - {item.description}
                  <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>Category: {item.category} | Status: <strong>{item.status}</strong></div>
                </div>
                <div style={{ background: "rgba(37, 99, 235, 0.15)", color: "#2563eb", padding: "0.2rem 0.5rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  {item.similarity_percent}% match
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grounded KB Sources */}
      {kb_sources && kb_sources.length > 0 && (
        <div style={{ marginTop: "1rem", fontSize: "0.8rem", opacity: 0.7, borderTop: "1px dashed rgba(100, 116, 139, 0.3)", paddingTop: "0.5rem" }}>
          📚 Grounded Knowledge SOP Sources: {kb_sources.join(" | ")}
        </div>
      )}

      {/* ── Compliance & Privacy Status ────────────────────────────── */}
      {showCompliance && (
        <div style={{
          marginTop: "1.2rem",
          padding: "0.9rem 1rem",
          borderRadius: "8px",
          background: riskStyle.bg,
          border: `1px solid ${riskStyle.border}`,
        }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem", color: riskStyle.text, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {riskStyle.icon} Compliance & Privacy Status
            </h4>
            <span style={{
              padding: "0.2rem 0.65rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.8rem",
              background: riskStyle.border, color: riskStyle.text,
            }}>
              Risk: {riskLevel}
            </span>
          </div>

          {/* 2-col grid of key facts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem", fontSize: "0.82rem", marginBottom: "0.7rem" }}>
            <div>
              <span style={{ opacity: 0.65, textTransform: "uppercase", fontSize: "0.72rem", fontWeight: 700 }}>PII Detected</span>
              <div style={{ fontWeight: 700, color: ca.pii_detected ? "#dc2626" : "#059669" }}>
                {ca.pii_detected ? `Yes — ${(ca.pii_types || []).join(", ")}` : "None"}
              </div>
            </div>
            <div>
              <span style={{ opacity: 0.65, textTransform: "uppercase", fontSize: "0.72rem", fontWeight: 700 }}>Policy Flags</span>
              <div style={{ fontWeight: 700, color: ca.policy_violation ? "#dc2626" : "#059669" }}>
                {ca.policy_violation ? (ca.compliance_flags || []).join(", ") : "None"}
              </div>
            </div>
            <div>
              <span style={{ opacity: 0.65, textTransform: "uppercase", fontSize: "0.72rem", fontWeight: 700 }}>Sensitive Content</span>
              <div style={{ fontWeight: 700, color: ca.sensitive_content ? "#ea580c" : "#059669" }}>
                {ca.sensitive_content ? (ca.compliance_flags || []).join(", ") : "None"}
              </div>
            </div>
            <div>
              <span style={{ opacity: 0.65, textTransform: "uppercase", fontSize: "0.72rem", fontWeight: 700 }}>Recommended Action</span>
              <div style={{ fontWeight: 700, color: riskStyle.text }}>
                {(ca.compliance_action || "NO_ACTION_REQUIRED").replaceAll("_", " ")}
              </div>
            </div>
          </div>

          {/* Recommended actions list */}
          {ca.recommended_actions && ca.recommended_actions.length > 0 && !(ca.recommended_actions[0].includes("No compliance action")) && (
            <ul style={{ margin: "0.4rem 0 0 1.1rem", padding: 0, fontSize: "0.82rem", lineHeight: 1.6 }}>
              {ca.recommended_actions.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
