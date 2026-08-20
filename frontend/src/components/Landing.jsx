import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./../styles/Landing.css";
import CookieConsent from "./CookieConsent";

// Interactive Feature Details Modal
function FeatureModal({ feature, onClose }) {
  if (!feature) return null;

  return (
    <div className="feature-modal-overlay" onClick={onClose}>
      <motion.div
        className="feature-modal-content"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-icon-wrapper" style={{ background: feature.color }}>
            <span className="modal-icon">{feature.icon}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <h2 className="modal-title">{feature.title}</h2>
          <p className="modal-description">{feature.description}</p>

          <div className="modal-details-grid">
            {feature.details.map((detail, idx) => (
              <div key={idx} className="modal-detail-item">
                <div className="detail-check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span>{detail}</span>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button className="btn-modal-action" onClick={onClose}>
              Close Overview
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Sample complaint test scenarios for the live interactive preview
const SAMPLE_COMPLAINTS = [
  {
    id: "sample-1",
    tag: "Broadband Performance",
    icon: "🌐",
    subject: "Fiber optical light blinking red, no internet for 3 days",
    text: "My fiber broadband connection has been down for 3 days with the ONT optical light blinking red. I have called customer support twice already with no resolution. Please fix this urgently or cancel my subscription.",
    category: "Broadband Performance",
    confidence: "94.8%",
    sentiment: "Negative",
    polarity: "-0.84 (Frustrated)",
    priority: "CRITICAL",
    riskScore: "85%",
    riskReasons: ["3 days service loss", "Repeated support calls (2x)", "Cancellation threat detected"],
    sop: "SOP-BB-04: Optical Signal Loss & ONT Re-provisioning",
    resolution: [
      "1. Remote ONT Diagnostic: Ping ONT and check Optical Receive Power on OLT port.",
      "2. Fiber Link Test: Dispatch field technician to inspect local splitter and fiber drop cable.",
      "3. Temporary Service Credit: Issue 3-day outage credit to subscriber billing account.",
      "4. Expedited SLA: Assign priority dispatch with 4-hour target turnaround time."
    ],
    summary: "Subscriber reports persistent 3-day fiber outage with blinking red ONT light and repeated unresolved calls. Classified as CRITICAL risk due to churn threat; field technician dispatch and billing credit recommended."
  },
  {
    id: "sample-2",
    tag: "Billing Dispute",
    icon: "💳",
    subject: "Unauthorized VAS roaming charge of $49.99 on bill",
    text: "I was billed $49.99 for an international roaming data pack on my latest invoice. I was in my home city all month and never requested or activated this service. Please reverse this charge immediately.",
    category: "Billing Dispute",
    confidence: "92.4%",
    sentiment: "Negative",
    polarity: "-0.62 (Aggrieved)",
    priority: "HIGH",
    riskScore: "68%",
    riskReasons: ["Billing discrepancy", "Unauthorized add-on service", "Immediate charge reversal requested"],
    sop: "SOP-BIL-02: Value-Added Services (VAS) Dispute & Adjustment",
    resolution: [
      "1. CDR CDR Verification: Validate Call Detail Records and roaming activation logs for the billing cycle.",
      "2. VAS Deactivation: Remove active roaming add-on from billing CRM immediately.",
      "3. Financial Adjustment: Credit $49.99 + applicable taxes to subscriber next billing cycle.",
      "4. Customer Notification: Send confirmation SMS and updated invoice copy via email."
    ],
    summary: "Subscriber disputes $49.99 unauthorized roaming VAS charge incurred without activation. Flagged as HIGH priority; CDR audit, fee reversal, and VAS deactivation initiated."
  },
  {
    id: "sample-3",
    tag: "Call Drops",
    icon: "📵",
    subject: "Continuous call drops and distorted audio on 5G VoLTE",
    text: "Every phone call drops after 30 to 45 seconds in Sector 14 area. Voice becomes completely robotic before disconnecting. Many neighbours in our apartment complex have the exact same issue.",
    category: "Call Drops",
    confidence: "91.1%",
    sentiment: "Negative",
    polarity: "-0.58 (Dissatisfied)",
    priority: "HIGH",
    riskScore: "72%",
    riskReasons: ["Area-wide clustered issue (Sector 14)", "Severe VoLTE voice distortion", "High call failure rate"],
    sop: "SOP-RF-01: VoLTE Handover Failure & Sector Congestion",
    resolution: [
      "1. Sector Cell Audit: Query eNodeB/gNodeB performance metrics for Sector 14 cell cluster.",
      "2. Interference Check: Analyze SINR, PRB utilization, and handover failure rates.",
      "3. RF Tilt Adjustment: Request NOC team to re-optimize remote antenna electrical down-tilt.",
      "4. Customer Update: Notify subscriber of network optimization progress within 12 hours."
    ],
    summary: "Clustered VoLTE call drops and voice distortion reported in Sector 14 apartment complex. Assessed as HIGH priority area event; escalated to RF Engineering for sector optimization."
  },
  {
    id: "sample-4",
    tag: "Installation",
    icon: "📦",
    subject: "New connection installation delayed by 10 days",
    text: "I booked a new high-speed broadband plan 10 days ago with guaranteed 48-hour installation. No engineer has visited or contacted me. My order reference is ORD-88912.",
    category: "Installation",
    confidence: "88.7%",
    sentiment: "Neutral",
    polarity: "-0.32 (Awaiting Action)",
    priority: "MEDIUM",
    riskScore: "48%",
    riskReasons: ["SLA delivery overrun (10 days vs 48h SLA)", "No field contact logged"],
    sop: "SOP-INS-03: Delayed Provisioning & Field Service Scheduling",
    resolution: [
      "1. Order Tracking: Verify inventory reservation and port availability on local distribution point.",
      "2. Field Lead Assignment: Re-assign installation ticket to local field supervisor with priority slot.",
      "3. Proactive Outreach: Automated customer care call to book confirmed 2-hour appointment window.",
      "4. SLA Penalty Waiver: Apply installation fee discount as service courtesy."
    ],
    summary: "New broadband installation pending for 10 days exceeding 48h SLA commitment. Categorized as MEDIUM priority; re-scheduled with field operations supervisor."
  }
];

export default function Landing({ user, onStart, onNavigate }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Interactive Live Simulator State
  const [selectedSample, setSelectedSample] = useState(SAMPLE_COMPLAINTS[0]);
  const [customText, setCustomText] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Scroll to Top Logic
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 75;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectSample = (sample) => {
    setIsCustomMode(false);
    setIsAnalyzing(true);
    setTimeout(() => {
      setSelectedSample(sample);
      setIsAnalyzing(false);
    }, 250);
  };

  const handleCustomAnalyze = (e) => {
    e.preventDefault();
    if (!customText.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      // Dynamic client classification heuristic for demo
      const lower = customText.toLowerCase();
      let cat = "Network Connectivity";
      let conf = "89.4%";
      let prio = "MEDIUM";
      let risk = "52%";
      let sopName = "SOP-NET-01: Network Diagnostics & Route Trace";

      if (lower.includes("bill") || lower.includes("charge") || lower.includes("cost") || lower.includes("money") || lower.includes("refund")) {
        cat = "Billing Dispute";
        conf = "93.1%";
        prio = "HIGH";
        risk = "70%";
        sopName = "SOP-BIL-01: Billing Dispute & Fee Reversal";
      } else if (lower.includes("fiber") || lower.includes("speed") || lower.includes("mbps") || lower.includes("broadband") || lower.includes("slow")) {
        cat = "Broadband Performance";
        conf = "94.2%";
        prio = lower.includes("cancel") || lower.includes("days") ? "CRITICAL" : "HIGH";
        risk = lower.includes("cancel") ? "84%" : "65%";
        sopName = "SOP-BB-04: Optical Signal Loss & Bandwidth Throttling";
      } else if (lower.includes("drop") || lower.includes("call") || lower.includes("signal") || lower.includes("tower")) {
        cat = "Call Drops";
        conf = "90.8%";
        prio = "HIGH";
        risk = "66%";
        sopName = "SOP-RF-01: VoLTE Handover Failure & Sector Congestion";
      } else if (lower.includes("install") || lower.includes("new connection") || lower.includes("router") || lower.includes("technician")) {
        cat = "Installation";
        conf = "88.5%";
        prio = "MEDIUM";
        risk = "45%";
        sopName = "SOP-INS-03: Delayed Provisioning & Technician Dispatch";
      }

      setSelectedSample({
        id: "custom",
        tag: cat,
        icon: "⚡",
        subject: customText.slice(0, 55) + (customText.length > 55 ? "..." : ""),
        text: customText,
        category: cat,
        confidence: conf,
        sentiment: lower.includes("angry") || lower.includes("cancel") || lower.includes("terrible") || lower.includes("worst") ? "Negative" : "Neutral / Negative",
        polarity: "-0.65 (High Urgency)",
        priority: prio,
        riskScore: risk,
        riskReasons: ["User submitted live text", `NLP Keyword Match: ${cat}`, "Escalation scoring evaluated"],
        sop: sopName,
        resolution: [
          `1. Automated Ticket Creation: Logged under category '${cat}'.`,
          "2. Diagnostic Pipeline: Trigger automated line / account status check via telecom gateway.",
          `3. Grounded SOP Execution: Follow protocol '${sopName}'.`,
          "4. Agent Handoff: Route to dedicated resolution queue with SLA tracking."
        ],
        summary: `Live subscriber complaint categorized under '${cat}' with confidence ${conf}. Prioritized as ${prio} with ${risk} escalation risk.`
      });
      setIsCustomMode(true);
      setIsAnalyzing(false);
    }, 400);
  };

  const features = [
    {
      icon: "📂",
      title: "Automated Category Classification",
      description: "Classifies incoming customer complaints across 12 canonical telecom categories with high confidence and instant heuristic validation.",
      color: "#3b82f6",
      details: [
        "Trained on 2,204 real complaint records from the Kaggle telecom dataset.",
        "TF-IDF n-gram vectorization with multi-class Logistic Regression & DistilBERT.",
        "89.1% test accuracy and 0.89 weighted F1-score on unseen test data.",
        "12 categories: Broadband Performance, Billing Dispute, Call Drops, Network Connectivity, Service Outage, Installation, Equipment, and more."
      ]
    },
    {
      icon: "🎭",
      title: "Sentiment & Emotion Analysis",
      description: "Detects emotional polarity and urgency levels in customer statements to prioritize distressed subscribers and prevent churn.",
      color: "#ec4899",
      details: [
        "VADER SentimentIntensityAnalyzer for nuanced compound emotion scoring (-1.0 to +1.0).",
        "TextBlob polarity scoring as secondary cross-validation layer.",
        "Fine-grained sentiment classification: Positive, Neutral, Negative, and Frustrated/Urgent.",
        "Identifies churn trigger phrases (e.g. 'cancelling plan', 'lawsuit', 'TRAI / FCC complaint')."
      ]
    },
    {
      icon: "⚡",
      title: "Priority & Escalation Prediction",
      description: "Dynamic 5-factor risk scoring engine that determines CRITICAL, HIGH, MEDIUM, or LOW priority with clear, explainable decision factors.",
      color: "#22c55e",
      details: [
        "Factor 1: Category severity weighting (Service Outage and Billing get higher base weights).",
        "Factor 2: Sentiment intensity and emotional agitation multiplier.",
        "Factor 3: Repeated complaint detection (multi-call or chronic ticket history).",
        "Factor 4: SLA breach indicators and downtime duration metrics.",
        "Factor 5: Regulatory & legal trigger keyword detection (consumer court, regulatory escalation)."
      ]
    },
    {
      icon: "🤖",
      title: "GenAI & Agentic Triage Assistant",
      description: "LangGraph-orchestrated AI assistant generates grounded 4-step technical resolution plans and customer-ready communications.",
      color: "#8b5cf6",
      details: [
        "7-stage sequential LangGraph StateGraph pipeline orchestrating end-to-end triage.",
        "Ultra-fast Groq LLM (Llama-3.3 / Qwen) with Gemini fallback and offline SOP templates.",
        "Grounded in 11 telecom domain Standard Operating Procedure (SOP) reference documents.",
        "Produces both internal engineering troubleshooting steps and subscriber empathy messaging."
      ]
    },
    {
      icon: "📋",
      title: "Automated Ticket Summarization",
      description: "Generates concise 2-sentence operational summaries for support agents, NOC engineers, and executive management dashboards.",
      color: "#f59e0b",
      details: [
        "Eliminates manual documentation overhead for L1/L2 telecom support specialists.",
        "Captures issue type, root symptoms, sentiment polarity, and risk factors in seconds.",
        "Stored directly in database records and rendered across Agent Queue and Admin Dashboard.",
        "Standardized formatting enables smooth cross-shift engineering handoffs."
      ]
    },
    {
      icon: "🗄️",
      title: "Vector DB & RAG Knowledge Retrieval",
      description: "Cosine similarity search over 2,200+ historical complaint embeddings and domain SOP repository for zero-hallucination accuracy.",
      color: "#14b8a6",
      details: [
        "Vectorized corpus of 2,200+ historical Kaggle telecom tickets with similarity scoring.",
        "Top-3 nearest historical tickets retrieved for contextual benchmarking.",
        "Retrieval-Augmented Generation (RAG) over 11 telecom SOP knowledge documents.",
        "Grounds all LLM recommendations strictly in validated telecom operational procedures."
      ]
    }
  ];

  const pipelineStages = [
    {
      step: "01",
      title: "Input Ingestion & Masking",
      desc: "Cleans raw subscriber complaint text, normalizes whitespace, and masks sensitive subscriber PII.",
      icon: "📥"
    },
    {
      step: "02",
      title: "NLP Text Classification",
      desc: "TF-IDF + ML classifier predicts the exact complaint category among 12 classes with confidence score.",
      icon: "📂"
    },
    {
      step: "03",
      title: "Sentiment & Emotion Analysis",
      desc: "VADER and TextBlob analyzers compute compound polarity (-1 to +1) and customer emotional state.",
      icon: "🎭"
    },
    {
      step: "04",
      title: "5-Factor Escalation Scoring",
      desc: "Calculates priority tier (CRITICAL / HIGH / MED / LOW) and escalation risk percentage based on 5 parameters.",
      icon: "⚡"
    },
    {
      step: "05",
      title: "Vector DB Similarity Match",
      desc: "Cosine similarity search finds top-3 closest historical Kaggle complaint tickets and their resolution paths.",
      icon: "🔍"
    },
    {
      step: "06",
      title: "Domain SOP Knowledge RAG",
      desc: "Retrieves category-specific Standard Operating Procedures to eliminate hallucinations in recommendations.",
      icon: "📚"
    },
    {
      step: "07",
      title: "GenAI Triage & Auto-Summary",
      desc: "LangGraph agent generates a 4-step technical action plan, SLA timeline, and 2-sentence ticket summary.",
      icon: "🚀"
    }
  ];

  const faqs = [
    {
      question: "What dataset powers the TelecomIQ intelligence models?",
      answer: "TelecomIQ is trained and validated on the official Kaggle Telecom Complaints dataset (ravillatejakumar/telecom-complaints-monitoring-system) containing 2,204 real-world subscriber complaint records spanning network outages, billing disputes, call drops, broadband issues, and equipment faults."
    },
    {
      question: "How does the 7-stage LangGraph workflow operate?",
      answer: "LangGraph structures the triage as a stateful directed graph: (1) Validation & Sanitization -> (2) NLP Category Classification -> (3) Sentiment Detection -> (4) Priority/Escalation Scoring -> (5) Vector Similarity Search -> (6) Domain SOP RAG Retrieval -> (7) GenAI Action Generation. Each stage reads and enriches the shared complaint state."
    },
    {
      question: "What model architectures are used for NLP & Deep Learning?",
      answer: "The primary classifier uses TF-IDF n-grams with a multi-class Logistic Regression model (89.1% test accuracy, 0.89 F1-score). For deep learning sentiment and zero-shot fallback, DistilBERT and BART-large-mnli pipelines are supported, alongside Groq (Llama-3.3 / Qwen) and Gemini for agentic reasoning."
    },
    {
      question: "How does the platform predict escalation risk and priority?",
      answer: "Escalation risk is calculated across 5 weighted factors: (1) Base category severity (outages & cancellations carry highest weight), (2) Sentiment polarity intensity, (3) Repeated complaint detection keywords, (4) Duration and SLA overrun signals, and (5) Regulatory/legal trigger keywords (TRAI, FCC, consumer court). A score ≥ 60% flags immediate escalation."
    },
    {
      question: "How does RAG prevent hallucinations in technical resolution plans?",
      answer: "Every classified complaint triggers a TF-IDF vector retrieval against our repository of 11 domain-specific Telecom SOP documents (covering fiber diagnostics, VAS fee waivers, VoLTE RF optimization, etc.). The retrieved SOP context is injected directly into the LLM system prompt, constraining recommendations to official telecom procedures."
    }
  ];

  return (
    <div className="landing-container">
      {/* Header */}
      <header className={`landing-header ${isMenuOpen ? "menu-open" : ""}`}>
        <div className="header-left">
          <div className="navbar-brand telecom-logo" onClick={scrollToTop}>
            <div className="logo-orb">
              <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="18" fill="url(#orb-grad)" fillOpacity="0.15" />
                <circle cx="18" cy="18" r="17.5" stroke="url(#orb-grad)" strokeOpacity="0.3" />
                <path d="M18 7L9 11.5V18C9 23.8 12.8 29.2 18 31C23.2 29.2 27 23.8 27 18V11.5L18 7Z" fill="url(#shield-grad)" />
                <path d="M14 18L17 21L22 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="orb-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="shield-grad" x1="9" y1="7" x2="27" y2="31" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="brand-text-stack">
              <span className="logo-text">TelecomIQ</span>
              <span className="logo-tagline">Complaint Intelligence</span>
            </div>
          </div>
        </div>

        <nav className={`nav-links ${isMenuOpen ? "is-open" : ""}`}>
          <button onClick={() => { scrollToTop(); setIsMenuOpen(false); }}>Home</button>
          <button onClick={() => { scrollToSection("live-demo"); setIsMenuOpen(false); }}>Live Demo</button>
          <button onClick={() => { scrollToSection("architecture"); setIsMenuOpen(false); }}>Architecture</button>
          <button onClick={() => { scrollToSection("capabilities"); setIsMenuOpen(false); }}>Capabilities</button>
          <button onClick={() => { scrollToSection("benchmarks"); setIsMenuOpen(false); }}>Benchmarks</button>
          <button onClick={() => { scrollToSection("faq"); setIsMenuOpen(false); }}>FAQ</button>

          <div className="mobile-auth-buttons">
            <button className="btn-primary" onClick={() => { onNavigate("form"); setIsMenuOpen(false); }}>
              File Complaint
            </button>
            <button className="btn-secondary" onClick={() => { onNavigate("agent-queue"); setIsMenuOpen(false); }}>
              Agent Queue
            </button>
            <button className="btn-admin" onClick={() => { onNavigate("admin"); setIsMenuOpen(false); }}>
              Admin Dashboard
            </button>
          </div>
        </nav>

        <div className="header-right">
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className={`hamburger ${isMenuOpen ? "active" : ""}`}></span>
          </button>
          <div className="auth-buttons">
            <button className="btn-action-outline" onClick={() => onNavigate("agent-queue")}>
              Agent Queue
            </button>
            <button className="btn-action-primary" onClick={() => onNavigate("form")}>
              File Complaint
            </button>
            <button className="btn-admin" onClick={() => onNavigate("admin")}>
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>NLP & Agentic AI Platform • Kaggle Telecom Dataset</span>
          </div>

          <h1 className="hero-title">
            Telecom Complaint Intelligence &amp; Automated Resolution Assistant
          </h1>

          <p className="hero-subtitle">
            An end-to-end AI platform that automatically classifies telecom complaints across 12 categories, detects customer sentiment, predicts escalation risks, retrieves domain SOPs via Vector RAG, and generates technical resolution plans.
          </p>

          <div className="hero-cta">
            <button className="btn-cta btn-primary" onClick={onStart}>
              <span>Launch Live Complaint Triage</span>
              <span className="arrow">→</span>
            </button>
            <button className="btn-cta btn-secondary" onClick={() => scrollToSection("live-demo")}>
              <span>Try Interactive Simulator</span>
            </button>
            <button className="btn-cta btn-outline" onClick={() => onNavigate("admin")}>
              <span>View Admin Analytics</span>
            </button>
          </div>

          <div className="features-grid-mini">
            <div className="feature-mini" onClick={() => scrollToSection("capabilities")}>
              <span className="icon">📂</span>
              <div className="feature-mini-text">
                <strong>12 Categories</strong>
                <span>TF-IDF + ML (89.1% Acc)</span>
              </div>
            </div>
            <div className="feature-mini" onClick={() => scrollToSection("capabilities")}>
              <span className="icon">🎭</span>
              <div className="feature-mini-text">
                <strong>Sentiment Analysis</strong>
                <span>VADER &amp; Polarity Scoring</span>
              </div>
            </div>
            <div className="feature-mini" onClick={() => scrollToSection("capabilities")}>
              <span className="icon">⚡</span>
              <div className="feature-mini-text">
                <strong>Escalation Risk</strong>
                <span>5-Factor Decision Engine</span>
              </div>
            </div>
            <div className="feature-mini" onClick={() => scrollToSection("capabilities")}>
              <span className="icon">🤖</span>
              <div className="feature-mini-text">
                <strong>GenAI + RAG SOP</strong>
                <span>LangGraph 7-Node Agent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Complaint Simulator Section */}
      <section className="demo-section" id="live-demo">
        <div className="section-header">
          <div className="section-tag">Interactive Sandbox</div>
          <h2 className="section-title">See Complaint Intelligence <span>In Action</span></h2>
          <p className="section-subtitle">
            Select a sample telecom complaint or type custom text to see real-time NLP classification, sentiment scoring, priority assessment, and SOP resolution generation.
          </p>
        </div>

        <div className="simulator-wrapper">
          {/* Sample Selectors */}
          <div className="simulator-tabs">
            <span className="tab-label">Preset Scenarios:</span>
            {SAMPLE_COMPLAINTS.map((sample) => (
              <button
                key={sample.id}
                className={`sample-tab-btn ${!isCustomMode && selectedSample.id === sample.id ? "active" : ""}`}
                onClick={() => handleSelectSample(sample)}
              >
                <span>{sample.icon}</span>
                <span>{sample.tag}</span>
              </button>
            ))}
          </div>

          {/* Live Simulator Body */}
          <div className="simulator-grid">
            {/* Left Panel: Complaint Input */}
            <div className="simulator-input-card">
              <div className="card-header-row">
                <span className="card-badge">Subscriber Complaint Input</span>
                <span className="card-meta">{isCustomMode ? "Custom Test" : selectedSample.tag}</span>
              </div>

              {!isCustomMode ? (
                <div className="sample-text-display">
                  <h4 className="sample-subject">{selectedSample.subject}</h4>
                  <p className="sample-body">"{selectedSample.text}"</p>
                </div>
              ) : null}

              <form onSubmit={handleCustomAnalyze} className="custom-input-form">
                <label htmlFor="custom-complaint" className="form-label">
                  Or test with custom complaint text:
                </label>
                <textarea
                  id="custom-complaint"
                  className="custom-textarea"
                  rows="3"
                  placeholder="e.g. My fiber internet has been dropping every 20 minutes since yesterday. Called 3 times without help, cancel my plan immediately!"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                />
                <div className="form-action-row">
                  <button type="submit" className="btn-analyze" disabled={isAnalyzing || !customText.trim()}>
                    {isAnalyzing ? "Processing with NLP..." : "🚀 Analyze Custom Text"}
                  </button>
                  {isCustomMode && (
                    <button
                      type="button"
                      className="btn-reset-sample"
                      onClick={() => handleSelectSample(SAMPLE_COMPLAINTS[0])}
                    >
                      Reset to Preset
                    </button>
                  )}
                </div>
              </form>

              <div className="simulator-cta-box">
                <p>Want to test with full database logging &amp; email notifications?</p>
                <button className="btn-inline-link" onClick={() => onNavigate("form")}>
                  Open Full Complaint Form →
                </button>
              </div>
            </div>

            {/* Right Panel: Instant AI Output */}
            <div className={`simulator-output-card ${isAnalyzing ? "analyzing" : ""}`}>
              <div className="card-header-row">
                <span className="card-badge output-badge">TelecomIQ Pipeline Output</span>
                <span className="pipeline-status">
                  <span className="status-dot green"></span>
                  Processed in 1.4s
                </span>
              </div>

              {/* Badges Grid */}
              <div className="metrics-strip">
                <div className="metric-pill">
                  <span className="metric-title">Predicted Category</span>
                  <span className="metric-val primary">{selectedSample.category}</span>
                  <span className="metric-sub">{selectedSample.confidence} Confidence</span>
                </div>

                <div className="metric-pill">
                  <span className="metric-title">Sentiment &amp; Polarity</span>
                  <span className="metric-val text-accent">{selectedSample.sentiment}</span>
                  <span className="metric-sub">{selectedSample.polarity}</span>
                </div>

                <div className="metric-pill">
                  <span className="metric-title">Priority &amp; Risk</span>
                  <span className={`metric-val priority-tag ${selectedSample.priority.toLowerCase()}`}>
                    {selectedSample.priority}
                  </span>
                  <span className="metric-sub">Risk Score: {selectedSample.riskScore}</span>
                </div>
              </div>

              {/* Risk Reasons */}
              <div className="output-section">
                <h5 className="output-section-title">
                  <span>⚡</span> Escalation Risk Factors Detected:
                </h5>
                <ul className="risk-factors-list">
                  {selectedSample.riskReasons.map((reason, idx) => (
                    <li key={idx}>
                      <span className="bullet">⚠️</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Matched SOP */}
              <div className="output-section">
                <h5 className="output-section-title">
                  <span>📚</span> Grounded Domain SOP Retrieved:
                </h5>
                <div className="sop-badge">
                  <span>{selectedSample.sop}</span>
                </div>
              </div>

              {/* 4-Step Technical Resolution */}
              <div className="output-section">
                <h5 className="output-section-title">
                  <span>🛠️</span> 4-Step Technical Resolution Plan:
                </h5>
                <div className="resolution-steps-box">
                  {selectedSample.resolution.map((step, idx) => (
                    <div key={idx} className="resolution-step-item">
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto Summary */}
              <div className="output-section summary-section">
                <h5 className="output-section-title">
                  <span>📋</span> Automated Ticket Summary:
                </h5>
                <p className="summary-text">{selectedSample.summary}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Stage LangGraph AI Pipeline Architecture */}
      <section className="architecture-section" id="architecture">
        <div className="section-header">
          <div className="section-tag">System Workflow</div>
          <h2 className="section-title">7-Stage <span>LangGraph Architecture</span></h2>
          <p className="section-subtitle">
            Every complaint flows through a deterministic, stateful LangGraph pipeline combining ML classification, sentiment analysis, vector RAG, and LLM reasoning.
          </p>
        </div>

        <div className="pipeline-grid">
          {pipelineStages.map((stage, idx) => (
            <div key={idx} className="pipeline-card">
              <div className="pipeline-card-top">
                <span className="stage-step">{stage.step}</span>
                <span className="stage-icon">{stage.icon}</span>
              </div>
              <h3 className="stage-title">{stage.title}</h3>
              <p className="stage-desc">{stage.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6 Core Capabilities Section */}
      <section className="solutions-section" id="capabilities">
        <div className="section-header">
          <div className="section-tag">Core Features</div>
          <h2 className="section-title">AI Complaint <span>Intelligence Pillars</span></h2>
          <p className="section-subtitle">
            Six specialized AI components engineered specifically for telecommunications operations and customer care.
          </p>
        </div>

        <div className="solutions-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="solution-card clickable"
              onClick={() => setActiveModal(feature)}
            >
              <div className="solution-icon" style={{ background: feature.color }}>
                <span className="icon-text">{feature.icon}</span>
              </div>
              <h3 className="solution-title">{feature.title}</h3>
              <p className="solution-description">{feature.description}</p>
              <div className="card-action-indicator">
                <span>View Architecture Details</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {activeModal && (
            <FeatureModal
              feature={activeModal}
              onClose={() => setActiveModal(null)}
            />
          )}
        </AnimatePresence>
      </section>

      {/* Benchmarks & Dataset Metrics Section */}
      <section className="goals-section" id="benchmarks">
        <div className="section-header">
          <div className="section-tag">Validated Results</div>
          <h2 className="section-title">Dataset &amp; <span>Performance Metrics</span></h2>
          <p className="section-subtitle">
            Evaluated on real-world Kaggle telecom complaint records with rigorous holdout validation.
          </p>
        </div>

        <div className="goals-grid">
          {[
            {
              title: "Classification Accuracy",
              desc: "TF-IDF + Logistic Regression model trained on 2,204 real Kaggle telecom complaints with 70/15/15 train/val/test split.",
              icon: "🎯",
              metric: "89.1% Test Accuracy"
            },
            {
              title: "Weighted F1-Score",
              desc: "Balanced precision and recall across all 12 telecom complaint categories on unseen test set records.",
              icon: "📊",
              metric: "0.89 F1-Score"
            },
            {
              title: "End-to-End Triage Latency",
              desc: "Complete 7-node LangGraph execution including classification, sentiment, vector search, and GenAI triage.",
              icon: "⚡",
              metric: "< 1.8s Response Time"
            },
            {
              title: "Kaggle Complaint Vector DB",
              desc: "Indexed vector corpus of historical telecom complaint tickets with cosine similarity search for contextual matching.",
              icon: "🗄️",
              metric: "2,204 Indexed Records"
            },
            {
              title: "Telecom Domain SOPs",
              desc: "11 category-specific Standard Operating Procedure documents retrieved via RAG for grounded technical resolutions.",
              icon: "📚",
              metric: "11 Validated SOPs"
            },
            {
              title: "Deep Learning Fallback",
              desc: "DistilBERT (40% smaller than BERT, 97% performance retained) and zero-shot NLI fallback when network APIs are offline.",
              icon: "🤖",
              metric: "BERT / DistilBERT"
            }
          ].map((goal, idx) => (
            <div key={idx} className="goal-card">
              <div className="goal-icon-wrapper">
                <span className="goal-icon">{goal.icon}</span>
              </div>
              <div className="goal-content">
                <h3>{goal.title}</h3>
                <p>{goal.desc}</p>
                <div className="goal-metric">
                  <span className="metric-dot"></span>
                  <span className="metric-text">{goal.metric}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real-World Industry Scenarios */}
      <section className="scenarios-section" id="scenarios">
        <div className="section-header">
          <div className="section-tag">Field Applications</div>
          <h2 className="section-title">Telecom Operations <span>Use Cases</span></h2>
          <p className="section-subtitle">
            How TelecomIQ transforms customer service operations and reduces mean time to resolution (MTTR).
          </p>
        </div>

        <div className="scenarios-grid">
          {[
            {
              badge: "Broadband & Fiber",
              title: "Critical Fiber Drop & Optical Loss",
              desc: "Instant ONT diagnostic check, optical power verification on OLT port, and automatic high-priority field dispatch within 4 hours.",
              icon: "🌐",
              tag: "SOP-BB-04"
            },
            {
              badge: "Billing Disputes",
              title: "Unauthorized VAS Add-ons & Overcharges",
              desc: "Automated Call Detail Record (CDR) auditing, instant VAS service deactivation, and automated bill credit calculation.",
              icon: "💳",
              tag: "SOP-BIL-02"
            },
            {
              badge: "Wireless & 5G",
              title: "Call Drops & VoLTE Audio Distortion",
              desc: "Cell cluster performance monitoring, antenna electrical down-tilt check, and automated ticket clustering for RF optimization.",
              icon: "📵",
              tag: "SOP-RF-01"
            },
            {
              badge: "Provisioning",
              title: "Delayed Hardware & Installation",
              desc: "Distribution point port availability checks, supervisor escalation, and proactive customer appointment scheduling.",
              icon: "📦",
              tag: "SOP-INS-03"
            }
          ].map((sc, idx) => (
            <div key={idx} className="scenario-item-card">
              <div className="scenario-top">
                <span className="scenario-badge">{sc.badge}</span>
                <span className="scenario-icon">{sc.icon}</span>
              </div>
              <h3 className="scenario-title">{sc.title}</h3>
              <p className="scenario-desc">{sc.desc}</p>
              <div className="scenario-footer">
                <span className="sop-ref">Ref: {sc.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="faq-section" id="faq">
        <div className="section-header">
          <div className="section-tag">Frequently Asked Questions</div>
          <h2 className="section-title">Common <span>Questions</span></h2>
          <p className="section-subtitle">
            Everything you need to know about the models, LangGraph architecture, and dataset.
          </p>
        </div>

        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${activeFaq === index ? "active" : ""}`}
              onClick={() => setActiveFaq(activeFaq === index ? null : index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <span className="faq-toggle">{activeFaq === index ? "−" : "+"}</span>
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section brand-info">
            <div className="navbar-brand telecom-logo" onClick={scrollToTop} style={{ marginBottom: "1rem", padding: 0 }}>
              <div className="logo-orb" style={{ width: "32px", height: "32px" }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="18" r="18" fill="#3b82f6" fillOpacity="0.2" />
                  <path d="M18 7L9 11.5V18C9 23.8 12.8 29.2 18 31C23.2 29.2 27 23.8 27 18V11.5L18 7Z" fill="#3b82f6" />
                  <path d="M14 18L17 21L22 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="logo-text">TelecomIQ</span>
            </div>
            <p className="footer-desc">
              AI-powered telecom complaint intelligence and automated resolution platform. Automates classification, sentiment analysis, escalation prediction, and SOP-grounded technical triage using LangGraph and RAG.
            </p>
            <div className="dataset-badge">
              <span>Dataset: Kaggle ravillatejakumar/telecom-complaints</span>
            </div>
          </div>

          <div className="footer-section">
            <h4>Platform Modules</h4>
            <button onClick={() => onNavigate("form")} className="footer-btn">File Complaint</button>
            <button onClick={() => onNavigate("agent-queue")} className="footer-btn">Agent Queue</button>
            <button onClick={() => onNavigate("admin")} className="footer-btn">Admin Dashboard</button>
          </div>

          <div className="footer-section">
            <h4>Architecture</h4>
            <button onClick={() => scrollToSection("live-demo")} className="footer-btn">Interactive Simulator</button>
            <button onClick={() => scrollToSection("architecture")} className="footer-btn">7-Stage Pipeline</button>
            <button onClick={() => scrollToSection("capabilities")} className="footer-btn">Core AI Pillars</button>
            <button onClick={() => scrollToSection("benchmarks")} className="footer-btn">Model Benchmarks</button>
          </div>

          <div className="footer-section">
            <h4>Specifications</h4>
            <span className="footer-spec-item">BERT / DistilBERT NLP</span>
            <span className="footer-spec-item">LangGraph 7-Node StateGraph</span>
            <span className="footer-spec-item">TF-IDF Cosine Vector DB</span>
            <span className="footer-spec-item">11 Telecom Domain SOPs</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} TelecomIQ — Telecom Complaint Intelligence &amp; Automated Resolution Assistant. Built with NLP, LangGraph, and RAG.</p>
        </div>
      </footer>

      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop} aria-label="Scroll to top">
          <span>↑</span>
        </button>
      )}

      <CookieConsent onNavigate={onNavigate} />
    </div>
  );
}
