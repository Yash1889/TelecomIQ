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
    steps = []
  } = data;

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticket_id);
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
    </div>
  );
}
