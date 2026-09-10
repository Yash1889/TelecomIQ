import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { loginUser, signupUser } from "../api";
import "../styles/AuthModal.css";

export default function AuthModal({ isOpen, onClose, onSuccess, initialRole = "Customer" }) {
  const [roleTarget, setRoleTarget] = useState(initialRole || "Customer");
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (initialRole) {
      setRoleTarget(initialRole);
      // For Agent and Admin, always default to login mode
      if (initialRole !== "Customer") {
        setMode("login");
      }
    }
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const isCustomer = roleTarget === "Customer";
  const isAgent = roleTarget === "Support Agent" || roleTarget === "agent-queue";
  const isAdmin = roleTarget === "Admin" || roleTarget === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await loginUser(email, password);
        if (res?.user) {
          onSuccess(res.user);
          onClose();
        }
      } else {
        // Customer registration only
        const res = await signupUser({
          email,
          password,
          full_name: fullName,
          phone: phone || null,
          role: "Customer",
        });
        if (res?.user) {
          onSuccess(res.user);
          onClose();
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Authentication failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <motion.div
        className="auth-modal-container"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <div className={`auth-brand-icon ${isAgent ? "agent-icon" : isAdmin ? "admin-icon" : "customer-icon"}`}>
              {isCustomer && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
              {isAgent && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                  <rect x="9" y="9" width="6" height="6"></rect>
                  <line x1="9" y1="1" x2="9" y2="4"></line>
                  <line x1="15" y1="1" x2="15" y2="4"></line>
                </svg>
              )}
              {isAdmin && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              )}
            </div>
            <div className="auth-brand-text">
              <h3>
                {isCustomer && "Customer / Subscriber Portal"}
                {isAgent && "Support Agent Workspace"}
                {isAdmin && "Administrator & NOC Portal"}
              </h3>
              <p>
                {isCustomer && (mode === "login" ? "Sign in to report and track issues" : "Register a new subscriber account")}
                {isAgent && "Sign in with operational credentials"}
                {isAdmin && "Sign in with executive administrative clearance"}
              </p>
            </div>
          </div>
          <button className="auth-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tabs Switcher: Only available for Customers */}
        {isCustomer && (
          <div className="auth-tabs-nav">
            <button
              type="button"
              className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Customer Log In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === "signup" ? "active" : ""}`}
              onClick={() => { setMode("signup"); setError(""); }}
            >
              New Customer Sign Up
            </button>
          </div>
        )}

        {/* Form Body */}
        <form className="auth-form-body" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {isCustomer && mode === "signup" && (
            <>
              <div className="auth-input-group">
                <label className="auth-input-label">Full Name</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Srishti Verma"
                    className="auth-input-field"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Phone Number (Optional)</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="auth-input-field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="auth-input-group">
            <label className="auth-input-label">Email Address</label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <input
                type="email"
                required
                placeholder={isCustomer ? "subscriber@domain.com" : isAgent ? "agent@telecomiq.com" : "admin@telecomiq.com"}
                className="auth-input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Password</label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="auth-input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`auth-submit-btn ${isAgent ? "agent-btn" : isAdmin ? "admin-btn" : "customer-btn"}`}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {mode === "login" ? `Log In as ${isCustomer ? "Customer" : isAgent ? "Support Agent" : "Administrator"}` : "Create Customer Account"}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>

          {isCustomer && (
            <div className="auth-footer-text">
              {mode === "login" ? (
                <>
                  New subscriber?{" "}
                  <button
                    type="button"
                    className="auth-toggle-link"
                    onClick={() => { setMode("signup"); setError(""); }}
                  >
                    Create Customer Account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    className="auth-toggle-link"
                    onClick={() => { setMode("login"); setError(""); }}
                  >
                    Customer Sign In
                  </button>
                </>
              )}
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
