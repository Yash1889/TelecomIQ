import { motion } from "framer-motion";
import "../styles/Gateway.css";

export default function Gateway({ user, onSelectRole, onExploreLanding, onOpenAuth, onLogout }) {
  return (
    <div className="gateway-page-wrapper">
      {/* Background ambient lighting */}
      <div className="gateway-ambient-glow glow-1"></div>
      <div className="gateway-ambient-glow glow-2"></div>

      <motion.div
        className="gateway-card"
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >


        {/* Transparent Active Session Tag (Shown when user is logged in) */}
        {user && (
          <div className="gateway-active-session-pill">
            <div className="session-user-info">
              <span className="session-online-dot"></span>
              <span className="session-user-label">
                Active: <strong className="session-user-name">{user.full_name || user.name || user.email}</strong>{" "}
                <span className="session-user-role">({user.role || "User"})</span>
              </span>
            </div>

            <div className="session-actions">
              <button
                className="session-action-btn switch-btn"
                onClick={() => onOpenAuth("Customer")}
              >
                Switch Account
              </button>
              <button
                className="session-action-btn logout-btn"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Card Header */}
        <div className="gateway-header">
          <div className="gateway-logo-badge">
            <div className="gateway-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="gateway-brand-title">
              <span className="gateway-brand-main">TelecomIQ</span>
              <span className="gateway-brand-sub">AI Complaint Intelligence</span>
            </div>
          </div>

          <h2 className="gateway-title">Welcome to TelecomIQ</h2>
          <p className="gateway-subtitle">
            Choose your role portal below to log in or register
          </p>
        </div>

        {/* 3 Role Selection Buttons */}
        <div className="gateway-roles-list">
          {/* 1. Customer Role */}
          <motion.button
            className="gateway-role-btn customer-role"
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole("Customer")}
          >
            <div className="role-icon-box customer-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="role-info">
              <div className="role-title-row">
                <span className="role-name">Login / Register as Customer</span>
              </div>
              <span className="role-desc">File complaints, track ticket progress &amp; get instant AI resolutions</span>
            </div>
            <div className="role-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          {/* 2. Support Agent Role */}
          <motion.button
            className="gateway-role-btn agent-role"
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole("Support Agent")}
          >
            <div className="role-icon-box agent-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <line x1="9" y1="1" x2="9" y2="4"></line>
                <line x1="15" y1="1" x2="15" y2="4"></line>
                <line x1="9" y1="20" x2="9" y2="23"></line>
                <line x1="15" y1="20" x2="15" y2="23"></line>
              </svg>
            </div>
            <div className="role-info">
              <div className="role-title-row">
                <span className="role-name">Login as Support Agent</span>
              </div>
              <span className="role-desc">Manage queue, review multi-model consensus &amp; dispatch resolutions</span>
            </div>
            <div className="role-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>

          {/* 3. Administrator Role */}
          <motion.button
            className="gateway-role-btn admin-role"
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole("Admin")}
          >
            <div className="role-icon-box admin-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <div className="role-info">
              <div className="role-title-row">
                <span className="role-name">Login as Administrator</span>
              </div>
              <span className="role-desc">Monitor live SLA metrics, NOC alerts, sentiment trends &amp; audit logs</span>
            </div>
            <div className="role-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </motion.button>
        </div>

        {/* Footer overview link */}
        <div className="gateway-footer">
          <button className="btn-explore-overview" onClick={onExploreLanding}>
            <span>Explore Platform Architecture &amp; Benchmarks</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
