import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Stars } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";
import "./../styles/Landing.css";
import CookieConsent from "./CookieConsent";
import ThemeToggle from "./ThemeToggle";

// --- Internal 3D Components (Conditional Dark Mode) ---
function ParticleGlobe() {
  const ref = useRef();
  const [isMobile] = useState(() => window.innerWidth < 768);
  const particleCount = isMobile ? 300 : 800;
  const [sphere] = useState(() => random.inSphere(new Float32Array(particleCount * 3), { radius: 1.5 }));

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 20;
      ref.current.rotation.y -= delta / 25;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#818cf8"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
          blending={1}
        />
      </Points>
    </group>
  );
}

function FloatingGeometry() {
  const group = useRef();
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(time / 4) / 4;
    group.current.rotation.x = Math.cos(time / 4) / 4;
  });

  return (
    <group ref={group}>
      <mesh position={[-1.2, 0.5, -0.5]}>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial color="#6366f1" wireframe transparent opacity={0.15} />
      </mesh>
      <mesh position={[1.2, -0.5, -0.5]}>
        <icosahedronGeometry args={[0.25, 1]} />
        <meshStandardMaterial color="#818cf8" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function HeroBackground() {
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light-theme'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.body.classList.contains('light-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (isLight) return null;

  return (
    <div className="three-bg-overlay-landing">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 1.2] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={80} depth={40} count={isLight ? 300 : 1000} factor={4} saturation={0} fade speed={1} />
        <ParticleGlobe />
        <FloatingGeometry />
      </Canvas>
    </div>
  );
}

// Declared at module scope so it keeps its identity across Landing's renders
// instead of remounting (and resetting its animation) on every state change.
function FeatureModal({ feature, onClose }) {
  if (!feature) return null;

  return (
    <div className="feature-modal-overlay" onClick={onClose}>
      <motion.div
        className="feature-modal-content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-icon-wrapper" style={{ background: feature.color }}>
            <span className="modal-icon">{feature.icon}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span>{detail}</span>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button className="btn-modal-action" onClick={onClose}>
              Got it, Awesome!
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Landing({ user, onStart, onNavigate }) {
  const [, setHoveredFeature] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Location Permission Request on Site Entry
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => { },
        () => { },
        { timeout: 10000 }
      );
    }
  }, []);

  // AI Voice Introduction - Sequentially English then Hindi
  useEffect(() => {
    const englishText = "Welcome to Quickfix AI! I am your AI assistant. This platform uses high-performance agents to resolve your billing, technical, and security issues with surgical precision. Experience the future of support today.";
    const hindiText = "क्विकफ़िक्स एआई में आपका स्वागत है! मैं आपका एआई सहायक हूँ। यह प्लेटफ़ॉर्म आपकी बिलिंग और तकनीकी समस्याओं को स्मार्ट तरीके से हल करने के लिए आधुनिक एआई एजेंटों का उपयोग करता है। आइए, सुपर-फास्ट सपोर्ट का अनुभव करें।";

    let hasPlayed = false;
    const synth = window.speechSynthesis;
    if (!synth) return;

    const retryTimers = [];
    const events = [
      'click', 'touchstart', 'touchend', 'touchmove',
      'mousedown', 'mousemove', 'mouseup',
      'keydown', 'keyup', 'keypress',
      'scroll', 'wheel',
      'pointerdown', 'pointermove',
      'focus', 'blur'
    ];

    const playVoice = () => {
      if (hasPlayed) return;

      const voices = synth.getVoices();
      // If voices are not loaded yet, wait for them
      if (voices.length === 0) return;

      hasPlayed = true;
      synth.cancel();

      // 1. Setup English Utterance
      const utterEng = new SpeechSynthesisUtterance(englishText);
      utterEng.lang = 'en-US';
      utterEng.rate = 1.0;
      utterEng.pitch = 1.0;

      const engVoice =
        voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Natural'))) ||
        voices.find(v => v.lang === 'en-US' && (v.name.includes('Samantha') || v.name.includes('Siri'))) ||
        voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];

      if (engVoice) {
        utterEng.voice = engVoice;
      }

      // 2. Setup Hindi Utterance
      const utterHindi = new SpeechSynthesisUtterance(hindiText);
      utterHindi.lang = 'hi-IN';
      utterHindi.rate = 1.1; // Slightly faster for natural rhythm
      utterHindi.pitch = 1.0;

      const hindiVoice =
        voices.find(v => v.lang === 'hi-IN' && (v.name.includes('Google') || v.name.includes('Natural'))) ||
        voices.find(v => v.lang === 'hi-IN' && (v.name.includes('Lekha') || v.name.includes('Microsoft'))) ||
        voices.find(v => v.lang.startsWith('hi')) ||
        voices[0];

      if (hindiVoice) {
        utterHindi.voice = hindiVoice;
      }

      utterEng.onend = () => {
        synth.speak(utterHindi);
      };

      utterEng.onstart = () => {
        cleanup();
      };

      try {
        synth.speak(utterEng);
      } catch (err) {
        console.error('Speech error:', err);
      }
    };

    const onInteraction = () => {
      if (hasPlayed) return;
      playVoice();
    };

    const cleanup = () => {
      retryTimers.forEach(timer => clearTimeout(timer));
      events.forEach(evt => {
        document.removeEventListener(evt, onInteraction, true);
        window.removeEventListener(evt, onInteraction, true);
      });
      window.removeEventListener('load', onPageLoad);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('DOMContentLoaded', onDOMReady);
      if (synth) {
        synth.onvoiceschanged = null;
      }
    };

    const onPageLoad = () => {
      if (!hasPlayed) setTimeout(() => playVoice(), 300);
    };

    const onVisibilityChange = () => {
      if (!document.hidden && !hasPlayed) setTimeout(() => playVoice(), 200);
    };

    const onDOMReady = () => {
      if (!hasPlayed) setTimeout(() => playVoice(), 400);
    };

    const onScroll = () => {
      if (!hasPlayed) playVoice();
    };

    // Voice loaded listener
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => {
        if (!hasPlayed) playVoice();
      };
    }

    // Add Listeners
    events.forEach(evt => {
      document.addEventListener(evt, onInteraction, { once: true, capture: true, passive: true });
      window.addEventListener(evt, onInteraction, { once: true, capture: true, passive: true });
    });

    if (document.readyState === 'complete') {
      onPageLoad();
    } else {
      window.addEventListener('load', onPageLoad);
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('scroll', onScroll, { once: true, passive: true });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDOMReady);
    } else {
      onDOMReady();
    }

    retryTimers.push(setTimeout(() => !hasPlayed && playVoice(), 500));
    retryTimers.push(setTimeout(() => !hasPlayed && playVoice(), 1000));
    retryTimers.push(setTimeout(() => !hasPlayed && playVoice(), 2000));
    retryTimers.push(setTimeout(() => !hasPlayed && playVoice(), 3000));

    return () => {
      cleanup();
      if (synth) synth.cancel();
    };
  }, []);


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
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const features = [
    {
      icon: "📂",
      title: "Complaint Classification",
      description: "Automatically classifies telecom complaints into 12 categories: Network Connectivity, Broadband Performance, Call Drops, Billing Dispute, and more.",
      color: "#667eea",
      details: [
        "TF-IDF + Logistic Regression model trained on 2,200+ real Kaggle complaints.",
        "89.1% test accuracy on held-out unseen data.",
        "12 canonical telecom categories with confidence scoring.",
        "Keyword-heuristic fallback when ML confidence is low."
      ]
    },
    {
      icon: "😊",
      title: "Sentiment Analysis",
      description: "Detects customer emotion from complaint text — Positive, Neutral, Negative — using VADER and TextBlob with compound polarity scoring.",
      color: "#ec4899",
      details: [
        "VADER SentimentIntensityAnalyzer for compound score (-1 to +1).",
        "TextBlob polarity as secondary validation layer.",
        "Four output labels: Positive, Neutral, Negative, Angry.",
        "Real-time confidence percentage per prediction."
      ]
    },
    {
      icon: "⚡",
      title: "Priority & Escalation Prediction",
      description: "Scores every complaint across 5 risk factors and assigns CRITICAL / HIGH / MEDIUM / LOW priority with explainable escalation reasons.",
      color: "#22c55e",
      details: [
        "Category impact scoring — outage and cancellation weighted highest.",
        "Sentiment intensity factor — negative sentiment raises risk score.",
        "Repeated complaint and SLA breach keyword detection.",
        "Legal/regulatory indicator detection (TRAI, FCC, consumer court).",
        "Automatic escalation flag when risk score ≥ 60%."
      ]
    },
    {
      icon: "🛠️",
      title: "Resolution Recommendation",
      description: "GenAI triage assistant generates a 4-step technical resolution plan grounded in telecom SOP knowledge for every classified complaint.",
      color: "#3b82f6",
      details: [
        "Groq LLM (primary) → Gemini (fallback) → SOP template (offline fallback).",
        "Resolution grounded in 11 domain SOP documents per category.",
        "SLA target embedded in every resolution (2h–24h based on priority).",
        "Professional customer-facing response generated alongside internal plan."
      ]
    },
    {
      icon: "📋",
      title: "Automatic Ticket Summary",
      description: "Generates a concise 2-sentence internal operational summary of the complaint and its risk level for agent dashboards.",
      color: "#764ba2",
      details: [
        "Summarises category, sentiment, priority, and escalation risk in plain language.",
        "Produced by the same GenAI triage call as the resolution.",
        "Stored in the database and visible to admin and support agents.",
        "Reduces manual ticket documentation effort to zero."
      ]
    },
    {
      icon: "🔍",
      title: "Vector DB + RAG Retrieval",
      description: "Retrieves top-3 similar historical complaints and domain SOP context using TF-IDF cosine similarity before generating any response.",
      color: "#14b8a6",
      details: [
        "Vector index built over 2,200+ historical Kaggle telecom complaints.",
        "Cosine similarity search returns similarity percentage per match.",
        "RAG over 11 telecom SOP documents (one per complaint category).",
        "Retrieved context is injected into the GenAI triage prompt for grounding."
      ]
    }
  ];

  const faqs = [
    {
      question: "What does the LangGraph pipeline do?",
      answer: "LangGraph orchestrates the complaint analysis as a directed StateGraph with 7 sequential nodes: input validation → classification → sentiment → priority/escalation → vector similarity search → RAG knowledge retrieval → GenAI triage. Each node writes its output to a shared state that the next node reads from."
    },
    {
      question: "How accurate is the complaint classifier?",
      answer: "The TF-IDF + Logistic Regression model was trained on 2,204 real telecom complaints from the Kaggle ravillatejakumar dataset with a 70/15/15 train/validation/test split. It achieved 89.1% test accuracy and 0.89 weighted F1-score on the unseen held-out test set."
    },
    {
      question: "What telecom complaint categories are supported?",
      answer: "12 canonical categories: Network Connectivity, Broadband Performance, Call Drops, Service Outage, Billing Dispute, Data/Usage Issue, Installation, Equipment/Router, Service Request, Cancellation, Customer Service, and Other. These match the Kaggle dataset and the official telecom complaint taxonomy."
    },
    {
      question: "How does the GenAI triage assistant work?",
      answer: "After classification, sentiment, and priority are computed, a Groq LLM (Qwen/Llama) generates a 4-step technical resolution plan and ticket summary grounded in the retrieved SOP context. Gemini is used as fallback, and hardcoded SOP templates are the final fallback if all APIs are unavailable."
    }
  ];

  return (
    <div className="landing-container">
      <HeroBackground />
      {/* Background Effects */}

      {/* Header */}
      <header className={`landing-header ${isMenuOpen ? 'menu-open' : ''}`}>
        <div className="header-left">
          <div className="navbar-brand ecohealth-logo" onClick={scrollToTop}>
            <div className="logo-orb">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="18" fill="url(#orb-grad)" fillOpacity="0.15" />
                <circle cx="18" cy="18" r="17.5" stroke="url(#orb-grad)" strokeOpacity="0.2" />
                <path d="M18 8L10 12V18C10 23.41 13.41 28.47 18 30C22.59 28.47 26 23.41 26 18V12L18 8Z" fill="url(#shield-grad)" />
                <path d="M18 13V17M18 21H18.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="orb-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7c9aff" />
                    <stop offset="1" stopColor="#b69eff" />
                  </linearGradient>
                  <linearGradient id="shield-grad" x1="10" y1="8" x2="26" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7c9aff" />
                    <stop offset="1" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="brand-text-stack">
              <span className="logo-text">TelecomIQ</span>
            </div>
          </div>
        </div>

        <nav className={`nav-links ${isMenuOpen ? 'is-open' : ''}`}>
          <button onClick={() => { scrollToTop(); setIsMenuOpen(false); }} className="nav-btn-home">Home</button>
          <button onClick={() => { onNavigate('form'); setIsMenuOpen(false); }}>File Complaint</button>
          <button onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }}>Dashboard</button>
          <button onClick={() => { onNavigate('agent-queue'); setIsMenuOpen(false); }}>Agent Queue</button>
          <button onClick={() => { scrollToSection('mission'); setIsMenuOpen(false); }}>Mission</button>
          <button onClick={() => { scrollToSection('features'); setIsMenuOpen(false); }}>About</button>
        </nav>

        <div className="header-right">
          <div className="header-actions">
            <ThemeToggle className="navbar-theme-toggle" />
            <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}></span>
            </button>
          </div>
          <div className="auth-buttons" style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn-secondary" onClick={() => onNavigate('form')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              ⚡ File Complaint
            </button>
            <button className="btn-admin" onClick={() => onNavigate('admin')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              📊 Admin Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
          <div className="gradient-orb orb-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            <span>AI-Powered Innovation</span>
          </div>

          <h1 className="hero-title">
            TelecomIQ — Telecom Complaint Intelligence & Resolution Assistant
          </h1>

          <p className="hero-subtitle">
            An AI-powered complaint intelligence platform that automatically classifies telecom complaints, detects customer sentiment, predicts escalation risks, and provides recommended resolutions to improve customer experience and operational efficiency.
          </p>

          <div className="hero-cta">
            <button className="btn-cta btn-primary" onClick={onStart}>
              Explore Solutions <span className="arrow">→</span>
            </button>
            <button className="btn-secondary" onClick={() => scrollToSection('features')}>
              Learn More
            </button>
          </div>

          <div className="features-grid-mini">
            <div className="feature-mini">
              <span className="icon">🧠</span>
              <span>BERT / DistilBERT</span>
            </div>
            <div className="feature-mini">
              <span className="icon">🔗</span>
              <span>LangGraph Agents</span>
            </div>
            <div className="feature-mini">
              <span className="icon">📈</span>
              <span>Escalation Prediction</span>
            </div>
            <div className="feature-mini">
              <span className="icon">🗄️</span>
              <span>Vector DB + RAG</span>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="vision-mission-section" id="mission">
        <div className="container">
          <div className="vision-box" data-aos="fade-up">
            <div className="section-tag">Our Vision</div>
            <h2 className="vision-text">
              To redefine the global standard of customer success through autonomous AI intelligence.
            </h2>
          </div>

          <div className="mission-content">
            <div className="mission-card" data-aos="fade-right">
              <div className="section-tag">Our Mission</div>
              <h3 className="mission-title">Empowering Enterprises with Agentic Precision</h3>
              <p className="mission-description">
                Our mission is to bridge the gap between complex technical logic and human-centric service.
                We deploy high-frequency agentic clusters that analyze, classify, and resolve issues with
                surgical precision. By combining emotional intelligence with recursive reasoning, we ensure
                that every customer feels heard, valued, and satisfied in real-time, reducing resolution
                cycles from days to mere seconds.
              </p>
              <div className="mission-stats">
                <div className="stat-item">
                  <span className="stat-value">98%</span>
                  <span className="stat-label">Surgical Accuracy</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">&lt; 2s</span>
                  <span className="stat-label">Response Latency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="solutions-section" id="features">
        <div className="section-header">
          <h2 className="section-title">About <span>TelecomIQ</span></h2>
          <p className="section-subtitle">Six core AI capabilities working together in the complaint intelligence pipeline.</p>
        </div>

        <div className="solutions-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="solution-card clickable"
              onClick={() => setActiveModal(feature)}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
            >
              <div className="card-glow" />
              <div
                className="solution-icon"
                style={{ background: feature.color }}
              >
                <span className="icon-text">{feature.icon}</span>
              </div>
              <h3 className="solution-title">{feature.title}</h3>
              <p className="solution-description">{feature.description}</p>
              <div className="card-action-indicator">
                <span>See Details</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {activeModal && activeModal.title && (
            <FeatureModal
              feature={activeModal}
              onClose={() => setActiveModal(null)}
            />
          )}
        </AnimatePresence>
      </section>

      {/* Strategic Goals Section */}
      <section className="goals-section" id="goals">
        <div className="section-header">
          <h2 className="section-title">Strategic <span>Goals</span></h2>
          <p className="section-subtitle">What the TelecomIQ pipeline delivers — by the numbers.</p>
        </div>
        <div className="goals-grid">
          {[
            {
              title: "Classification Accuracy",
              desc: "TF-IDF + Logistic Regression model trained on 2,204 real telecom complaints, achieving 89.1% test accuracy with 0.89 weighted F1-score.",
              icon: "🎯",
              metric: "89.1% Test Accuracy"
            },
            {
              title: "Real-Time Analysis",
              desc: "LangGraph pipeline processes complaint text through 7 sequential nodes — classification, sentiment, priority, vector search, RAG, and GenAI — in a single request.",
              icon: "⚡",
              metric: "7-Node Pipeline"
            },
            {
              title: "Escalation Intelligence",
              desc: "Multi-factor risk scoring across category severity, sentiment intensity, repeated-complaint signals, outage indicators, and regulatory keywords.",
              icon: "🧠",
              metric: "5-Factor Scoring"
            },
            {
              title: "Vector Retrieval",
              desc: "Cosine similarity search over 2,200+ historical complaint vectors returns top-3 matching tickets with percentage match scores.",
              icon: "🗄️",
              metric: "2,200+ Indexed Tickets"
            },
            {
              title: "RAG Knowledge Base",
              desc: "11 domain-specific SOP documents — one per complaint category — retrieved by TF-IDF similarity and injected into the GenAI prompt for grounded resolutions.",
              icon: "📚",
              metric: "11 Telecom SOPs"
            },
            {
              title: "BERT / DistilBERT",
              desc: "DistilBERT (40% smaller than BERT, 97% performance retained) available as offline sentiment fallback. BART-large-mnli for zero-shot classification fallback.",
              icon: "🤖",
              metric: "Offline DL Fallback"
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
              <div className="goal-card-bg"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Solutions */}
      <section className="demo-section" id="solutions-demo">
        <div className="section-header">
          <h2 className="section-title">Pipeline <span>In Action</span></h2>
          <p className="section-subtitle">How the LangGraph complaint intelligence pipeline handles real telecom scenarios.</p>
        </div>

        <div className="demo-container">
          {[
            {
              title: "Broadband Disconnect",
              case: "Fiber Connection Dropped Every 30 Minutes",
              process: "LangGraph classifies → Broadband Performance detected → Negative sentiment → HIGH priority → RAG retrieves OLT diagnostic SOP → GenAI generates 4-step resolution plan.",
              impact: "Resolution in under 2 seconds",
              icon: "📡",
              color: "rgba(99, 102, 241, 0.15)"
            },
            {
              title: "Billing Dispute",
              case: "Unauthorized VAS Charge on Monthly Bill",
              process: "TF-IDF classifier → Billing Dispute (90% confidence) → VADER detects Negative sentiment → Escalation risk 60% → RAG retrieves VAS deactivation SOP → GenAI drafts refund action plan.",
              impact: "Ticket summary auto-generated",
              icon: "💳",
              color: "rgba(34, 197, 94, 0.15)"
            },
            {
              title: "Service Outage",
              case: "Complete Network Blackout in Residential Area",
              process: "Keyword heuristic → Service Outage → CRITICAL priority (risk 95%) → Escalation required → Vector DB finds 3 similar past outage tickets → NOC escalation plan generated.",
              impact: "Automatic escalation to NOC",
              icon: "🚨",
              color: "rgba(239, 68, 68, 0.15)"
            }
          ].map((demo, idx) => (
            <div key={idx} className="demo-scenario-card" style={{ '--demo-accent': demo.color }}>
              <div className="demo-card-head">
                <span className="demo-type-badge">{demo.title}</span>
                <span className="demo-icon-mini">{demo.icon}</span>
              </div>
              <h4>{demo.case}</h4>
              <div className="demo-process-line">
                <p>{demo.process}</p>
              </div>
              <div className="demo-impact-footer">
                <span className="impact-label">Impact:</span>
                <span className="impact-value">{demo.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="about-section" id="team">
        <div className="section-header">
          <h2 className="section-title">The <span>Architect</span></h2>
          <p className="section-subtitle">Pioneering the intersection of Full-Stack and AI intelligence.</p>
        </div>
        <div className="about-content">
          <div className="solution-card team-card-primary">
            <div className="solution-icon team-avatar-icon">
              <span className="icon-text">👨‍💻</span>
            </div>
            <h3 className="solution-title team-name">Yashraj Gupta</h3>
            <p className="team-role-pill">Competitive Programmer | Software Engineer | AI & ML Enthusiast</p>
            <p className="solution-description team-bio">
              AI & ML | Experienced in React, SQL |
              Passionate about AI, ML, Competitive Programming, and full-stack development.
            </p>
            <div className="social-links-premium1">
              <a href="https://www.linkedin.com/in/yash-raj-gupta001/" target="_blank" rel="noopener noreferrer"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.238 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg></a>
              <a href="https://github.com/Yash1889" target="_blank" rel="noopener noreferrer"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg></a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header">
          <h2 className="section-title">Client <span>Feedback</span></h2>
          <p className="section-subtitle">What industry leaders are saying about Quickfix AI.</p>
        </div>
        <div className="testimonials-grid">
          {[
            {
              name: "S. Johnson",
              role: "Operations Head",
              text: "The AI agent clusters have reduced our resolution cycles from hours to seconds.",
              rating: 5
            },
            {
              name: "M. Chen",
              role: "Support Director",
              text: "Surgical precision in classification. The sentiment-aware routing is game-changing.",
              rating: 5
            },
            {
              name: "E. Rodriguez",
              role: "Tech Lead",
              text: "Seamless API integration and enterprise-grade security. A benchmark system.",
              rating: 5
            }
          ].map((testimonial, idx) => (
            <div key={idx} className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-id-badge">
                  <span>{testimonial.name.charAt(0)}</span>
                </div>
                <div className="testimonial-info">
                  <h4>{testimonial.name}</h4>
                  <p className="testimonial-role">{testimonial.role}</p>
                </div>
              </div>
              <div className="rating-stars">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>
              <p className="testimonial-text">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-header">
          <h2 className="section-title">Common <span>Questions</span></h2>
          <p className="section-subtitle">Everything you need to know about our intelligence.</p>
        </div>
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${activeFaq === index ? 'active' : ''}`}
              onClick={() => setActiveFaq(activeFaq === index ? null : index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <span className="faq-toggle">{activeFaq === index ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer" id="contact">
        <div className="footer-content">
          <div className="footer-section brand-info">
            <div className="navbar-brand ecohealth-logo" onClick={scrollToTop} style={{ marginBottom: '1.5rem', padding: 0 }}>
              <div className="logo-orb" style={{ width: '36px', height: '36px' }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="18" r="18" fill="url(#footer-orb-grad)" fillOpacity="0.15" />
                  <path d="M18 8L10 12V18C10 23.41 13.41 28.47 18 30C22.59 28.47 26 23.41 26 18V12L18 8Z" fill="url(#footer-shield-grad)" />
                  <defs>
                    <linearGradient id="footer-orb-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366f1" />
                      <stop offset="1" stopColor="#818cf8" />
                    </linearGradient>
                    <linearGradient id="footer-shield-grad" x1="10" y1="8" x2="26" y2="30" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366f1" />
                      <stop offset="1" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="logo-text">TelecomIQ</span>
            </div>
            <h3 className="connect-title">Connect With Us</h3>
            <div className="social-links-premium2">
              <a href="https://github.com/Yash1889" target="_blank" rel="noopener noreferrer"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg></a>
              <a href="https://www.linkedin.com/in/yash-raj-gupta001/" target="_blank" rel="noopener noreferrer"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.238 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg></a>
            </div>
          </div>
          <div className="footer-section">
            <h4>Ecosystem</h4>
            <button onClick={() => scrollToSection('features')} className="footer-btn">Neural Grid</button>
            <button onClick={() => scrollToSection('team')} className="footer-btn">The Team</button>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <button onClick={() => setActiveModal('privacy')} className="footer-btn">Privacy Policy</button>
            <button onClick={() => setActiveModal('terms')} className="footer-btn">Terms</button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Quickfix. Powered by Agentic Reasoning Clusters.</p>
        </div>
      </footer>

      {/* Modals */}
      {/* Legal/Placeholder Modals (Only for strings) */}
      {activeModal && typeof activeModal === "string" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModal(null)}>&times;</button>
            <div className="modal-body">
              <h2>{activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h2>
              <p>This is a placeholder for the {activeModal} content. Your data is handled with enterprise-grade security within our neural ecosystem.</p>
              <button className="btn-primary" onClick={() => setActiveModal(null)} style={{ marginTop: '2rem', width: '100%' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          <span>↑</span>
        </button>
      )}

      <CookieConsent onNavigate={onNavigate} />
    </div >
  );
}
