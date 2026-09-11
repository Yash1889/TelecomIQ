import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./../styles/Landing.css";

// Clean SVG Icons
const Icons = {
  Broadband: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  ),
  Billing: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  CallDrops: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  ),
  Installation: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  Classification: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  Sentiment: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  Escalation: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  Agent: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>
  ),
  Summary: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  Rag: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Warning: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  Layers: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 17 12 22 22 17"></polyline>
      <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Book: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  Zap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  User: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Admin: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
    </svg>
  )
};

// Interactive Feature Details Modal (Clean Minimalist Design)
function FeatureModal({ feature, onClose }) {
  if (!feature) return null;

  return (
    <div className="feature-modal-overlay" onClick={onClose}>
      <motion.div
        className="feature-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-clean">
          <div className="modal-icon-clean">
            {feature.iconComponent ? <feature.iconComponent /> : null}
          </div>
          <button className="modal-close-clean" onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body-clean">
          <h3 className="modal-title-clean">{feature.title}</h3>
          <p className="modal-desc-clean">{feature.description}</p>

          <div className="modal-details-list">
            {feature.details.map((detail, idx) => (
              <div key={idx} className="modal-detail-row">
                <span className="modal-check-icon"><Icons.Check /></span>
                <span>{detail}</span>
              </div>
            ))}
          </div>

          <button className="btn-modal-close-action" onClick={onClose}>
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Landing({ user, onStart, onNavigate, onOpenAuth, onLogout, onFeedback }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const features = [
    {
      iconComponent: Icons.Classification,
      title: "Automated Category Classification",
      description: "Classifies incoming subscriber tickets across 12 canonical telecom categories with high confidence and fast validation.",
      details: [
        "Trained on 2,204 real complaint records from the Kaggle telecom dataset.",
        "TF-IDF n-gram vectorization with multi-class Logistic Regression & DistilBERT.",
        "89.1% test accuracy and 0.89 weighted F1-score on unseen test data.",
        "12 canonical categories: Broadband, Billing, Call Drops, Connectivity, Service Outage, Installation, and more."
      ]
    },
    {
      iconComponent: Icons.Sentiment,
      title: "Sentiment & Polarity Scoring",
      description: "Detects emotional polarity and urgency levels in customer statements to prioritize distressed subscribers and prevent churn.",
      details: [
        "VADER SentimentIntensityAnalyzer for nuanced compound emotion scoring (-1.0 to +1.0).",
        "TextBlob polarity scoring as secondary validation layer.",
        "Fine-grained sentiment tagging: Positive, Neutral, Negative, and Frustrated.",
        "Identifies churn trigger phrases (e.g., 'cancel plan', 'lawsuit', 'TRAI / FCC complaint')."
      ]
    },
    {
      iconComponent: Icons.Escalation,
      title: "5-Factor Escalation Scoring",
      description: "Dynamic risk scoring engine calculating CRITICAL, HIGH, MEDIUM, or LOW priority with explainable decision factors.",
      details: [
        "Factor 1: Category severity weighting (Service Outage and Billing get higher base weights).",
        "Factor 2: Sentiment intensity and emotional agitation multiplier.",
        "Factor 3: Repeated complaint detection (multi-call or chronic ticket history).",
        "Factor 4: SLA breach indicators and downtime duration metrics.",
        "Factor 5: Regulatory & legal trigger keyword detection (consumer forum, ombudsman)."
      ]
    },
    {
      iconComponent: Icons.Agent,
      title: "LangGraph Agentic Assistant",
      description: "LangGraph-orchestrated AI workflow generates grounded 4-step technical resolution plans and customer-ready messaging.",
      details: [
        "7-stage sequential LangGraph StateGraph pipeline orchestrating end-to-end triage.",
        "Ultra-fast Groq LLM (Llama-3.3 / Qwen) with offline domain SOP templates.",
        "Grounded in 11 telecom domain Standard Operating Procedure (SOP) reference documents.",
        "Produces both internal engineering troubleshooting steps and subscriber empathy messaging."
      ]
    },
    {
      iconComponent: Icons.Summary,
      title: "Automated Ticket Summarization",
      description: "Generates concise 2-sentence operational summaries for support agents, NOC engineers, and executive dashboards.",
      details: [
        "Eliminates manual documentation overhead for L1/L2 telecom support specialists.",
        "Captures issue type, root symptoms, sentiment polarity, and risk factors in seconds.",
        "Stored directly in database records and rendered across Agent Queue and Admin Dashboard.",
        "Standardized formatting enables smooth cross-shift engineering handoffs."
      ]
    },
    {
      iconComponent: Icons.Rag,
      title: "Vector DB & Domain SOP RAG",
      description: "Cosine similarity search over 2,200+ historical complaint embeddings and domain SOP repository for zero hallucinations.",
      details: [
        "Vectorized corpus of 2,200+ historical Kaggle telecom tickets with similarity scoring.",
        "Top-3 nearest historical tickets retrieved for contextual benchmarking.",
        "Retrieval-Augmented Generation (RAG) over 11 telecom SOP knowledge documents.",
        "Grounds all LLM recommendations strictly in validated telecom operational procedures."
      ]
    }
  ];

  const WORKFLOW_NODES = [
    {
      id: "ingestion",
      step: "01",
      title: "Input Ingest",
      fnName: "ingest()",
      tag: "PII Masking",
      latency: "<2ms",
      iconComponent: Icons.Layers
    },
    {
      id: "nlp_classifier",
      step: "02",
      title: "Classification",
      fnName: "classify()",
      tag: "TF-IDF + ML",
      latency: "12ms",
      iconComponent: Icons.Classification
    },
    {
      id: "sentiment",
      step: "03",
      title: "Sentiment",
      fnName: "sentiment()",
      tag: "VADER Polarity",
      latency: "8ms",
      iconComponent: Icons.Sentiment
    },
    {
      id: "escalation",
      step: "04",
      title: "Escalation",
      fnName: "priority()",
      tag: "5-Factor Engine",
      latency: "4ms",
      iconComponent: Icons.Escalation
    },
    {
      id: "vector_match",
      step: "05",
      title: "Vector Search",
      fnName: "vector_match()",
      tag: "2.2k Corpus",
      latency: "18ms",
      iconComponent: Icons.Search
    },
    {
      id: "sop_rag",
      step: "06",
      title: "Domain SOP",
      fnName: "sop_rag()",
      tag: "11 SOP Docs",
      latency: "14ms",
      iconComponent: Icons.Book
    },
    {
      id: "genai_triage",
      step: "07",
      title: "GenAI Triage",
      fnName: "triage()",
      tag: "Groq Llama-3.3",
      latency: "480ms",
      iconComponent: Icons.Send
    }
  ];

  const benchmarkRows = [
    { model: "Logistic Regression (TF-IDF)", task: "12-Class Categorization", accuracy: "89.1%", f1: "0.89", latency: "12ms" },
    { model: "VADER + TextBlob Ensemble", task: "Sentiment & Polarity", accuracy: "93.4%", f1: "0.92", latency: "8ms" },
    { model: "5-Factor Heuristic Risk Engine", task: "Escalation & SLA Priority", accuracy: "95.0%", f1: "0.94", latency: "4ms" },
    { model: "TF-IDF Cosine Vector Search", task: "Historical Ticket Retrieval", accuracy: "91.8%", f1: "0.90", latency: "18ms" },
    { model: "Groq Llama-3.3 + SOP RAG", task: "Resolution Generation", accuracy: "98.2%", f1: "0.97", latency: "480ms" }
  ];

  const faqs = [
    {
      question: "What dataset powers the TelecomIQ intelligence models?",
      answer: "TelecomIQ is trained and validated on the official Kaggle Telecom Complaints dataset containing 2,204 real-world subscriber complaint records spanning network outages, billing disputes, call drops, broadband issues, and equipment faults."
    },
    {
      question: "How does the 7-stage LangGraph workflow operate?",
      answer: "LangGraph structures the triage as a stateful directed graph: (1) Validation & Sanitization -> (2) NLP Category Classification -> (3) Sentiment Detection -> (4) Priority/Escalation Scoring -> (5) Vector Similarity Search -> (6) Domain SOP RAG Retrieval -> (7) GenAI Action Generation. Each stage enriches the shared state."
    },
    {
      question: "What model architectures are used for NLP & classification?",
      answer: "The primary classifier uses TF-IDF n-grams with a multi-class Logistic Regression model (89.1% test accuracy, 0.89 F1-score). For deep learning sentiment and zero-shot fallback, DistilBERT pipelines are supported, alongside Groq (Llama-3.3 / Qwen) for agentic reasoning."
    },
    {
      question: "How does the platform predict escalation risk and priority?",
      answer: "Escalation risk is calculated across 5 weighted factors: (1) Base category severity, (2) Sentiment polarity intensity, (3) Repeated complaint detection keywords, (4) Duration and SLA overrun signals, and (5) Regulatory/legal trigger keywords (TRAI, FCC, consumer court). A score >= 60% flags immediate escalation."
    },
    {
      question: "How does domain RAG prevent hallucinations in resolution plans?",
      answer: "Every classified complaint triggers vector retrieval against our repository of 11 domain-specific Telecom SOP documents (covering fiber diagnostics, VAS fee waivers, VoLTE RF optimization, etc.). The retrieved SOP context is injected directly into the LLM system prompt, constraining recommendations strictly to official procedures."
    }
  ];

  const renderScenarioIcon = (iconKey) => {
    const Component = Icons[iconKey] || Icons.Broadband;
    return <Component />;
  };

  return (
    <div className="landing-container">
      {/* 1. Minimalist Sticky Header */}
      <header className="landing-header">
        <div className="header-left">
          <div className="navbar-brand" onClick={scrollToTop}>
            <div className="logo-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="logo-text-stack">
              <span className="logo-main-text">TelecomIQ</span>
              <span className="logo-sub-text">AI Intelligence</span>
            </div>
          </div>

          <nav className="nav-links">
            <button onClick={() => scrollToSection("architecture")}>Architecture</button>
            <button onClick={() => scrollToSection("capabilities")}>Capabilities</button>
            <button onClick={() => scrollToSection("benchmarks")}>Benchmarks</button>
            <button onClick={() => scrollToSection("faq")}>FAQ</button>
          </nav>
        </div>

        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontSize: "0.82rem",
                color: "#cbd5e1",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "4px 10px",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}>
                👤 {user.full_name || user.name || user.email} ({user.role || "User"})
              </span>
              <button
                className="btn-nav-ghost"
                onClick={onLogout}
                style={{ color: "#fca5a5" }}
              >
                Logout
              </button>
            </div>
          )}
          <button className="btn-nav-ghost" onClick={() => onNavigate("agent-queue")}>
            Agent Queue
          </button>
          <button className="btn-nav-ghost" onClick={() => onNavigate("admin")}>
            Admin Dashboard
          </button>
          <button className="btn-nav-primary" onClick={() => onNavigate("form")}>
            File Complaint
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="hero-section hero-section-gradient">
        <h1 className="hero-title">
          Telecom Complaint Intelligence, <span className="highlight">Simplified.</span>
        </h1>

        <p className="hero-subtitle">
          An end-to-end AI platform that automatically classifies telecom complaints across 12 categories, detects sentiment, scores escalation risks, retrieves domain SOPs, and generates grounded technical resolution plans.
        </p>

        <div className="hero-cta-row">
          <button className="btn-hero-primary" onClick={onStart}>
            <span>Launch Live Complaint Triage</span>
            <Icons.ArrowRight />
          </button>
          <button className="btn-hero-secondary" onClick={() => onNavigate("gateway")}>
            <span>Switch Role / Portal</span>
          </button>
        </div>

        {/* 4 Clean Metric Chips */}
        <div className="hero-chips-grid">
          <div className="hero-chip-card" onClick={() => scrollToSection("capabilities")}>
            <div className="hero-chip-icon"><Icons.Classification /></div>
            <div className="hero-chip-info">
              <span className="hero-chip-title">12 Categories</span>
              <span className="hero-chip-sub">TF-IDF + ML (89.1% Acc)</span>
            </div>
          </div>
          <div className="hero-chip-card" onClick={() => scrollToSection("capabilities")}>
            <div className="hero-chip-icon"><Icons.Sentiment /></div>
            <div className="hero-chip-info">
              <span className="hero-chip-title">Sentiment & Emotion</span>
              <span className="hero-chip-sub">VADER Compound Polarity</span>
            </div>
          </div>
          <div className="hero-chip-card" onClick={() => scrollToSection("capabilities")}>
            <div className="hero-chip-icon"><Icons.Escalation /></div>
            <div className="hero-chip-info">
              <span className="hero-chip-title">Escalation Engine</span>
              <span className="hero-chip-sub">5-Factor Risk Decision</span>
            </div>
          </div>
          <div className="hero-chip-card" onClick={() => scrollToSection("capabilities")}>
            <div className="hero-chip-icon"><Icons.Agent /></div>
            <div className="hero-chip-info">
              <span className="hero-chip-title">LangGraph Agent</span>
              <span className="hero-chip-sub">7-Stage RAG Pipeline</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 7-Stage LangGraph Architecture Workflow */}
      <section className="landing-section-bg section-bg-workflow" id="architecture">
        <div className="landing-section-inner">
          <div className="section-header-clean">
            <span className="section-badge-clean">System Workflow</span>
            <h2 className="section-title-clean">7-Stage LangGraph Architecture</h2>
            <p className="section-subtitle-clean">
              Every subscriber complaint flows through a deterministic, stateful LangGraph pipeline combining ML classification, sentiment analysis, vector RAG, and LLM reasoning.
            </p>
          </div>

          {/* Interactive Workflow Graph UI */}
          <div className="workflow-graph-container">
            {/* Top Canvas Toolbar */}
            <div className="workflow-toolbar">
              <div className="workflow-meta-chips">
                <span className="workflow-pill highlight">
                  <span className="workflow-status-dot"></span>
                  StateGraph&lt;ComplaintState&gt;
                </span>
                <span className="workflow-pill">7 Nodes</span>
                <span className="workflow-pill">6 Directed Edges</span>
                <span className="workflow-pill">Compiled &amp; Deterministic</span>
              </div>
            </div>

            {/* Workflow Graph Canvas */}
            <div className="workflow-canvas">
              <div className="workflow-nodes-flow">
                {WORKFLOW_NODES.map((node, idx) => {
                  const IconCmp = node.iconComponent;

                  return (
                    <div key={node.id} className="workflow-node-wrapper">
                      <div className="workflow-node-card">
                        <div className="node-top-bar">
                          <span className="node-step-tag">Node {node.step}</span>
                          <div className="node-icon-wrap">
                            <IconCmp />
                          </div>
                        </div>
                        <h4 className="node-title-text">{node.title}</h4>
                        <span className="node-type-label">{node.fnName}</span>
                        <div className="node-meta-foot">
                          <span>{node.tag}</span>
                          <span className="node-latency-pill">{node.latency}</span>
                        </div>
                      </div>

                      {/* Directional Connector Arrow between nodes */}
                      {idx < WORKFLOW_NODES.length - 1 && (
                        <div className="workflow-connector-line">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 6 Core Capabilities */}
      <section className="landing-section-bg section-bg-capabilities" id="capabilities">
        <div className="landing-section-inner">
          <div className="section-header-clean">
            <span className="section-badge-clean">Core Pillars</span>
            <h2 className="section-title-clean">AI Complaint Intelligence Capabilities</h2>
            <p className="section-subtitle-clean">
              Six specialized AI components engineered specifically for telecommunications operations and automated customer care.
            </p>
          </div>

          <div className="capabilities-grid-clean">
            {features.map((feature, index) => (
              <div
                key={index}
                className="capability-card-clean"
                onClick={() => setActiveModal(feature)}
              >
                <div className="capability-icon-wrap">
                  <feature.iconComponent />
                </div>
                <h3 className="capability-title-clean">{feature.title}</h3>
                <p className="capability-desc-clean">{feature.description}</p>
                <div className="capability-link-btn">
                  <span>Explore Technical Details</span>
                  <Icons.ArrowRight />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Performance Benchmarks */}
      <section className="landing-section-bg section-bg-benchmarks" id="benchmarks">
        <div className="landing-section-inner">
          <div className="section-header-clean">
            <span className="section-badge-clean">Model Performance</span>
            <h2 className="section-title-clean">Empirical Model Benchmarks</h2>
            <p className="section-subtitle-clean">
              Validated against the Kaggle telecom dataset containing 2,204 real-world subscriber complaint records.
            </p>
          </div>

          <div className="benchmarks-table-card">
            <div className="benchmark-stats-bar">
              <div className="benchmark-stat-cell">
                <div className="benchmark-stat-num">2,204</div>
                <div className="benchmark-stat-label">Training Records</div>
              </div>
              <div className="benchmark-stat-cell">
                <div className="benchmark-stat-num">89.1%</div>
                <div className="benchmark-stat-label">12-Class Accuracy</div>
              </div>
              <div className="benchmark-stat-cell">
                <div className="benchmark-stat-num">0.89</div>
                <div className="benchmark-stat-label">Weighted F1 Score</div>
              </div>
              <div className="benchmark-stat-cell">
                <div className="benchmark-stat-num">1.4s</div>
                <div className="benchmark-stat-label">Avg Pipeline Latency</div>
              </div>
            </div>

            <div className="table-responsive-wrap">
              <table className="clean-benchmark-table">
                <thead>
                  <tr>
                    <th>Model / Component</th>
                    <th>Task</th>
                    <th>Accuracy</th>
                    <th>F1 Score</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkRows.map((row, idx) => (
                    <tr key={idx}>
                      <td><strong>{row.model}</strong></td>
                      <td><span className="badge-tag-clean">{row.task}</span></td>
                      <td>{row.accuracy}</td>
                      <td>{row.f1}</td>
                      <td>{row.latency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Clean FAQ Section with Gradient Background */}
      <section className="faq-section-gradient" id="faq">
        <div className="faq-container-inner">
          <div className="section-header-clean">
            <span className="section-badge-clean">Got Questions?</span>
            <h2 className="section-title-clean">Frequently Asked Questions</h2>
            <p className="section-subtitle-clean">
              Common questions regarding dataset training, LangGraph orchestration, NLP pipelines, and domain SOP grounding.
            </p>
          </div>

          <div className="faq-accordion-clean">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item-clean ${activeFaq === index ? "open" : ""}`}
              >
                <button
                  className="faq-trigger-btn"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <span>{faq.question}</span>
                  <svg className="faq-chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {activeFaq === index && (
                  <div className="faq-body-clean">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Minimalist Footer */}
      <footer className="landing-footer-clean">
        <div className="footer-inner-clean">
          <div className="footer-brand-meta">
            <div className="footer-status-pill">
              <span className="footer-status-dot"></span>
              <span>All AI Pipelines Operational</span>
            </div>
            <p className="footer-copy">© {new Date().getFullYear()} TelecomIQ. Enterprise Telecom Complaint Intelligence Platform.</p>
          </div>

          <div className="footer-links-clean">
            <button onClick={() => scrollToTop()}>Back to Top</button>
            <button onClick={() => onNavigate("form")}>File Complaint</button>
            <button onClick={() => onNavigate("agent-queue")}>Agent Queue</button>
            <button onClick={() => onNavigate("admin")}>Admin Dashboard</button>
          </div>
        </div>
      </footer>

      {/* Feature Details Modal */}
      <AnimatePresence>
        {activeModal && (
          <FeatureModal feature={activeModal} onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>

      {/* Minimal Scroll Top Button */}
      {showScrollTop && (
        <button
          className="btn-scroll-top-clean"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
