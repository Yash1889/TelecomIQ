import { useState, useCallback, useEffect } from "react";
import Gateway from "./components/Gateway";
import Landing from "./components/Landing";
import ComplaintForm from "./components/ComplaintForm";
import ComplaintCard from "./components/ComplaintCard";
import SideChatBot from "./components/SideChatBot";
import NotificationCenter from "./components/NotificationCenter";
import AdminDashboard from "./components/AdminDashboard";
import AgentModule from "./components/Agent/AgentModule";
import AuthModal from "./components/AuthModal";
import { getStoredUser, logoutUser } from "./api";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import "./styles/ButtonReset.css";

export default function App() {
  const [page, setPage] = useState("gateway");
  const [user, setUser] = useState(() => {
    return getStoredUser() || null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState("Customer");
  const [result, setResult] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const navigateTo = useCallback((newPage) => {
    setPage(newPage);
    if (newPage === "landing" || newPage === "gateway") {
      setResult(null);
    }
  }, []);

  const handleOpenAuth = (role = "Customer") => {
    setAuthInitialRole(role);
    setAuthModalOpen(true);
  };

  const handleRoleSelection = (selectedRole) => {
    if (selectedRole === "Customer" || selectedRole === "form") {
      if (user && user.role === "Customer") {
        navigateTo("form");
      } else {
        handleOpenAuth("Customer");
      }
    } else if (selectedRole === "Support Agent" || selectedRole === "agent-queue") {
      if (user && (user.role === "Support Agent" || user.is_agent)) {
        navigateTo("agent-queue");
      } else {
        handleOpenAuth("Support Agent");
      }
    } else if (selectedRole === "Admin" || selectedRole === "admin") {
      if (user && user.role === "Admin") {
        navigateTo("admin");
      } else {
        handleOpenAuth("Admin");
      }
    } else {
      navigateTo(selectedRole);
    }
  };

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setAuthModalOpen(false);

    // Smart role-based redirection
    if (authenticatedUser.role === "Admin") {
      navigateTo("admin");
    } else if (authenticatedUser.role === "Support Agent" || authenticatedUser.is_agent) {
      navigateTo("agent-queue");
    } else {
      navigateTo("form");
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    navigateTo("gateway");
  };

  const handleComplaintSubmit = async (data) => {
    setResult(data);
  };

  const renderPage = () => {
    if (page === "gateway") {
      return (
        <Gateway
          user={user}
          onSelectRole={handleRoleSelection}
          onExploreLanding={() => navigateTo("landing")}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />
      );
    }

    if (page === "landing") {
      return (
        <Landing
          user={user}
          onStart={() => handleRoleSelection("Customer")}
          onNavigate={handleRoleSelection}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />
      );
    }

    if (page === "admin") {
      return (
        <AdminDashboard
          user={user || { name: "Admin", email: "admin@telecomiq.com", role: "Admin" }}
          onNavigate={navigateTo}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />
      );
    }

    if (page === "agent-queue") {
      return (
        <AgentModule
          user={user || { name: "Agent", email: "agent@telecomiq.com", role: "Support Agent" }}
          onNavigate={navigateTo}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />
      );
    }

    // Default: "form" (File Complaint page)
    return (
      <div className="landing-page-clean">
        <header className="landing-header-clean">
          <div className="header-left">
            <div className="brand-logo" onClick={() => navigateTo("gateway")}>
              <div className="brand-logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <div className="logo-text-stack">
                <span className="logo-main-text">TelecomIQ</span>
                <span className="logo-sub-text">Customer Portal</span>
              </div>
            </div>
          </div>

          <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user ? (
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
                  onClick={handleLogout}
                  style={{ color: "#fca5a5" }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button className="btn-nav-primary" onClick={() => handleOpenAuth("Customer")}>
                Sign In / Sign Up
              </button>
            )}

            <button className="btn-nav-ghost" onClick={() => navigateTo("gateway")}>
              Switch Portal
            </button>
          </div>
        </header>

        <main className="form-content-wrapper" style={{ padding: "40px 20px 80px", maxWidth: "1200px", margin: "0 auto" }}>
          <ComplaintForm onResult={handleComplaintSubmit} user={user} />
          
          {/* Analysis Result Popup Modal */}
          <AnimatePresence>
            {result && (
              <div className="analysis-popup-overlay" onClick={() => setResult(null)}>
                <motion.div
                  className="analysis-popup-modal"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="analysis-popup-header">
                    <div className="popup-title-group">
                      <span className="popup-badge">TELECOMIQ TRIAGE RESULT</span>
                      <h3 className="popup-title">Incident Analysis &amp; Resolution</h3>
                    </div>
                    <button className="popup-close-btn" onClick={() => setResult(null)} aria-label="Close modal">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  <div className="analysis-popup-body">
                    <ComplaintCard data={result} />
                  </div>

                  <div className="analysis-popup-footer">
                    <button className="btn-nav-primary" onClick={() => setResult(null)}>
                      Done / Close Analysis
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  };

  return (
    <>
      <NotificationCenter />

      {renderPage()}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
        initialRole={authInitialRole}
      />

      <motion.button
        className="chatbot-toggle"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowChatbot(!showChatbot)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        aria-label="Open AI Assistant"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span className="chatbot-badge"></span>
      </motion.button>
      <SideChatBot open={showChatbot} onClose={() => setShowChatbot(false)} />
    </>
  );
}
