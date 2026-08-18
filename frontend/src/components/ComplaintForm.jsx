import { useState } from "react";
import { submitComplaint, submitReview } from "../api";
import { showNotification } from "./NotificationCenter";
import "../styles/ComplaintForm.css";

export default function ComplaintForm({ onResult, user }) {
  const [formData, setFormData] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    category: "Network Connectivity",
    subject: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ticketId, setTicketId] = useState("");

  const categories = [
    "Network Connectivity",
    "Broadband Performance",
    "Call Drops",
    "Service Outage",
    "Billing Dispute",
    "Data / Usage Issue",
    "Installation",
    "Equipment / Router",
    "Service Request",
    "Cancellation",
    "Customer Service"
  ];

  const presets = [
    {
      title: "5G Signal Drop",
      cat: "Network Connectivity",
      sub: "5G cellular network drops repeatedly in office building",
      desc: "My phone continuously drops from 5G to 2G/No Service every 15 minutes inside my office in Electronic City. Emergency calls only shown on screen."
    },
    {
      title: "Broadband Disconnect",
      cat: "Broadband Performance",
      sub: "Fiber optic connection disconnects every 30 minutes",
      desc: "Subscribed to 300 Mbps fiber broadband. Optical PON light blinks red every 30 minutes, causing frequent disconnects during remote work."
    },
    {
      title: "Billing Overcharge",
      cat: "Billing Dispute",
      sub: "Double deduction on monthly fiber broadband bill",
      desc: "Charged twice ₹1,499 on my credit card for the current billing cycle. Unauthorized VAS fee of ₹299 also added to invoice."
    }
  ];

  const applyPreset = (p) => {
    setFormData(prev => ({
      ...prev,
      category: p.cat,
      subject: p.sub,
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
    setShowReview(false);

    setSteps([
      { name: "Telecom ML Classification & Confidence Evaluation...", status: "active" },
      { name: "Sentiment & Polarity Emotion Analyzer...", status: "waiting" },
      { name: "Multi-Factor Severity & Escalation Risk Scoring...", status: "waiting" },
      { name: "RAG Vector Semantic Search Over Historical Tickets...", status: "waiting" },
      { name: "Grounding Resolution Recommendations & SLA Timeline...", status: "waiting" }
    ]);

    try {
      const updateStep = (idx) => {
        setSteps(prev => prev.map((s, i) =>
          i === idx ? { ...s, status: 'done' } :
            (i === idx + 1 ? { ...s, status: 'active' } : s)
        ));
      };

      setTimeout(() => updateStep(0), 400);
      setTimeout(() => updateStep(1), 900);
      setTimeout(() => updateStep(2), 1500);

      const res = await submitComplaint(formData.name, formData.email, formData.subject, formData.description);

      updateStep(3);
      updateStep(4);

      setTicketId(res.ticket_id);
      if (typeof onResult === "function") onResult(res);
      setShowReview(true);

      showNotification("success", "✅ Complaint Ingested!", `Ticket #${res.ticket_id} logged into TelecomIQ engine.`, "📶");

      setFormData({
        name: user?.full_name || "",
        email: user?.email || "",
        category: "Network Connectivity",
        subject: "",
        description: ""
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Pipeline processing failed. Please try again.");
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const handleReview = async () => {
    if (rating === 0) {
      showNotification("error", "Rating Required", "Please select a star rating", "⚠️");
      return;
    }
    try {
      await submitReview(ticketId, rating, feedback);
      showNotification("success", "Feedback Recorded", "Thank you for evaluating TelecomIQ recommendations!", "⭐");
      setShowReview(false);
      setRating(0);
      setFeedback("");
    } catch (e) {
      console.error(e);
      showNotification("error", "Error", "Failed to submit rating.", "❌");
    }
  };

  return (
    <div className="complaint-form-container">
      {loading && (
        <div className="ai-processing-overlay">
          <div className="processing-card">
            <div className="processor-header">
              <span className="live-badge">TELECOMIQ ENGINE</span>
              <div className="ai-brain-pulse">📡</div>
            </div>
            <h3>Analyzing Telecom Incident...</h3>
            <div className="steps-list">
              {steps.map((s, i) => (
                <div key={i} className={`step-row ${s.status}`}>
                  <div className="step-indicator">
                    {s.status === 'done' ? '✅' : (s.status === 'active' ? <div className="spinner-small"></div> : '○')}
                  </div>
                  <div className="step-text">{s.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="form-header">
        <h2>📶 Telecom Complaint Intelligence Portal</h2>
        <p>Submit network, broadband, billing or operational issues for automated AI resolution.</p>
      </div>

      {/* Quick Telecom Preset Chips */}
      <div style={{ marginBottom: "1.2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 600 }}>Quick Presets:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(p)}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
              borderRadius: "20px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "inherit",
              cursor: "pointer"
            }}
          >
            ⚡ {p.title}
          </button>
        ))}
      </div>

      <form className="complaint-form" onSubmit={handleSubmit}>
        <div className="form-section-wrapper">
          <div className="form-group">
            <label>Subscriber Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" disabled={loading} required />
          </div>
          <div className="form-group">
            <label>Subscriber Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" disabled={loading} required />
          </div>
        </div>

        <div className="form-group">
          <label>Telecom Domain Category *</label>
          <select name="category" value={formData.category} onChange={handleChange} className="form-select" disabled={loading}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Complaint Subject *</label>
          <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="form-input" placeholder="e.g. Fiber broadband disconnect every 30 mins" disabled={loading} required />
        </div>

        <div className="form-group">
          <label>Detailed Incident Description *</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" placeholder="Describe network symptoms, locations, router light statuses, or billing amounts..." rows="5" disabled={loading} required />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button type="submit" className="launch-btn" disabled={loading}>
          {loading ? "Executing Telecom Pipeline..." : "📡 Ingest & Analyze Complaint"}
        </button>
      </form>

      {showReview && (
        <div className="review-block">
          <h3>⭐ Rate TelecomIQ AI Resolution</h3>
          <p>Rate the recommendation accuracy for ticket <strong>#{ticketId}</strong></p>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} className={`star-btn ${rating >= s ? 'active' : ''}`} onClick={() => setRating(s)}>★</button>
            ))}
          </div>
          <textarea
            placeholder="Optional comments regarding AI resolution accuracy..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="review-textarea"
          />
          <button onClick={handleReview} className="submit-review-btn">Submit Rating</button>
        </div>
      )}
    </div>
  );
}
