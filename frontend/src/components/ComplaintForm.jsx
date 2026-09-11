import { useState, useEffect } from "react";
import { submitComplaint } from "../api";
import { showNotification } from "./NotificationCenter";
import "../styles/ComplaintForm.css";

export default function ComplaintForm({ onResult, user }) {
  const [formData, setFormData] = useState({
    name: user?.full_name || user?.name || "",
    email: user?.email || "",
    subject: "",
    description: ""
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.full_name || user.name || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([]);
  const [ticketId, setTicketId] = useState("");
  const [copied, setCopied] = useState(false);

  const presets = [
    {
      title: "5G Signal Drop",
      sub: "5G cellular network drops repeatedly in office building",
      desc: "My phone continuously drops from 5G to 2G/No Service every 15 minutes inside my office in Electronic City. Emergency calls only shown on screen."
    },
    {
      title: "Broadband Disconnect",
      sub: "Fiber optic connection disconnects every 30 minutes",
      desc: "Subscribed to 300 Mbps fiber broadband. Optical PON light blinks red every 30 minutes, causing frequent disconnects during remote work."
    },
    {
      title: "Billing Overcharge",
      sub: "Double deduction on monthly fiber broadband bill",
      desc: "Charged twice ₹1,499 on my credit card for the current billing cycle. Unauthorized VAS fee of ₹299 also added to invoice."
    },
    {
      title: "Call Drops",
      sub: "Calls dropping every few minutes in residential area",
      desc: "Every voice call drops within 2-3 minutes of connecting. This has been happening for the past 4 days in my area. VoLTE is enabled but the issue persists."
    },
    {
      title: "Service Outage",
      sub: "Complete network outage in entire building since morning",
      desc: "No mobile signal or internet across our entire apartment complex since 8 AM today. Multiple residents are affected. This is impacting work-from-home connectivity urgently."
    }
  ];

  const applyPreset = (p) => {
    setFormData(prev => ({
      ...prev,
      subject: p.sub,
      desc: undefined,
      description: p.desc
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.description.trim()) {
      setError("All required fields must be completed.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setCopied(false);

    setSteps([
      { name: "Input Validation — checking complaint sufficiency...", status: "active" },
      { name: "ML Classification — TF-IDF + Logistic Regression...", status: "waiting" },
      { name: "Sentiment Analysis — VADER polarity scoring...", status: "waiting" },
      { name: "Priority & Escalation Risk — multi-factor scoring...", status: "waiting" },
      { name: "Vector Search — cosine similarity over 2,200+ tickets...", status: "waiting" },
      { name: "RAG Knowledge Base — telecom SOP retrieval...", status: "waiting" },
      { name: "GenAI Triage — resolution & ticket summary generation...", status: "waiting" }
    ]);

    try {
      const updateStep = (idx) => {
        setSteps(prev => prev.map((s, i) =>
          i === idx ? { ...s, status: 'done' } :
            (i === idx + 1 ? { ...s, status: 'active' } : s)
        ));
      };

      setTimeout(() => updateStep(0), 300);
      setTimeout(() => updateStep(1), 700);
      setTimeout(() => updateStep(2), 1100);
      setTimeout(() => updateStep(3), 1500);

      const res = await submitComplaint(
        formData.name,
        formData.email,
        formData.subject,
        formData.description
      );

      updateStep(4);
      updateStep(5);
      updateStep(6);

      setTicketId(res.ticket_id);
      if (typeof onResult === "function") onResult(res);

      showNotification("success", "Complaint Ingested", `Ticket #${res.ticket_id} logged into TelecomIQ engine.`);

      setFormData({
        name: user?.full_name || user?.name || "",
        email: user?.email || "",
        subject: "",
        description: ""
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Pipeline processing failed. Please try again.");
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const handleCopyTicket = () => {
    if (!ticketId) return;
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    showNotification("info", "Copied", `Ticket #${ticketId} copied to clipboard.`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="complaint-form-container">
      {loading && (
        <div className="ai-processing-overlay">
          <div className="processing-card">
            <div className="processor-header">
              <span className="live-badge">TELECOMIQ ENGINE</span>
            </div>
            <h3>Analyzing Telecom Incident...</h3>
            <div className="steps-list">
              {steps.map((s, i) => (
                <div key={i} className={`step-row ${s.status}`}>
                  <div className="step-indicator">
                    {s.status === 'done' ? '✓' : (s.status === 'active' ? <div className="spinner-small"></div> : '○')}
                  </div>
                  <div className="step-text">{s.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="form-header">
        <h2>Telecom Complaint Intelligence Portal</h2>
        <p>Describe your issue below. The AI pipeline will automatically classify the category, detect sentiment, score escalation risk, and generate a resolution.</p>
      </div>

      {/* Quick Telecom Preset Chips */}
      <div style={{ marginBottom: "1.2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 600, color: "#0F172A" }}>Quick Presets:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(p)}
            className="preset-pill-btn"
          >
            {p.title}
          </button>
        ))}
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <form className="complaint-form" onSubmit={handleSubmit}>
        <div className="form-section-wrapper">
          <div className="form-group">
            <label>Subscriber Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. John Doe"
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label>Subscriber Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. subscriber@telecomiq.com"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '0.8rem' }}>
          <label>Complaint Subject *</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. Fiber broadband disconnect every 30 mins"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Detailed Incident Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Describe network symptoms, locations, router light statuses, or billing amounts..."
            rows="5"
            disabled={loading}
            required
          />
        </div>

        <button type="submit" className="launch-btn btn-submit-complaint" disabled={loading}>
          {loading ? (
            <span>Executing Telecom Pipeline...</span>
          ) : (
            <>
              <span>Ingest &amp; Analyze Complaint</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Ticket Generated Success Card with Copy Button */}
      {ticketId && (
        <div className="ticket-success-banner">
          <div className="ticket-success-left">
            <div className="ticket-success-badge-icon">✓</div>
            <div className="ticket-success-info">
              <span className="ticket-success-label">Your ticket no. is generated:</span>
              <span className="ticket-success-code">#{ticketId}</span>
            </div>
          </div>
          <button
            type="button"
            className="ticket-copy-action-btn"
            onClick={handleCopyTicket}
            title="Copy Ticket ID"
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Ticket ID</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
