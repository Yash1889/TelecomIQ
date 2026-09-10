import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser, signupUser } from "../api";
import "../styles/AuthModal.css";

export default function AuthModal({ isOpen, onClose, onSuccess, initialRole = null }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(initialRole || "Customer");

  if (!isOpen) return null;

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setError("");
    setLoading(true);
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      const res = await loginUser(demoEmail, demoPassword);
      if (res?.user) {
        onSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Quick login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        const res = await signupUser({
          email,
          password,
          full_name: fullName,
          phone: phone || null,
          role: role || "Customer",
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
            <div className="auth-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="auth-brand-text">
              <h3>TelecomIQ Portal</h3>
              <p>{mode === "login" ? "Sign in to access your workspace" : "Create a new TelecomIQ account"}</p>
            </div>
          </div>
          <button className="auth-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tabs Switcher */}
        <div className="auth-tabs-nav">
          <button
            type="button"
            className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            Create Account
          </button>
        </div>

        {/* Quick Demo Login Preset Bar */}
        {mode === "login" && (
          <div className="auth-demo-presets">
            <div className="auth-demo-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>Instant Evaluator Demo Logins</span>
            </div>
            <div className="auth-demo-grid">
              <button
                type="button"
                className="auth-demo-pill"
                onClick={() => handleQuickLogin("admin@telecomiq.com", "admin123")}
                disabled={loading}
              >
                👑 Admin
                <span>admin123</span>
              </button>
              <button
                type="button"
                className="auth-demo-pill"
                onClick={() => handleQuickLogin("agent@telecomiq.com", "agent123")}
                disabled={loading}
              >
                🛡️ Agent
                <span>agent123</span>
              </button>
              <button
                type="button"
                className="auth-demo-pill"
                onClick={() => handleQuickLogin("customer@telecomiq.com", "customer123")}
                disabled={loading}
              >
                👤 Subscriber
                <span>customer123</span>
              </button>
            </div>
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

          {mode === "signup" && (
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
                <label className="auth-input-label">Role</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <select
                    className="auth-input-field auth-select-field"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Customer">Customer / Subscriber</option>
                    <option value="Support Agent">Support Agent (Operations)</option>
                    <option value="Admin">Administrator (Executive / NOC)</option>
                  </select>
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
                placeholder="name@telecomiq.com"
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

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Complete Registration"}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>

          <div className="auth-footer-text">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => { setMode("signup"); setError(""); }}
                >
                  Sign Up
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
                  Sign In
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
