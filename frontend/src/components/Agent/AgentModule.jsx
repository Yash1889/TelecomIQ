import { useState, useEffect } from "react";
import { getAgentQueue, getComplaintDetail, validateSolution, sendResolution } from "../../api";
import ThemeToggle from "../ThemeToggle";
import ComplaintCard from "../ComplaintCard";
import "../../styles/AgentModule.css";
import { motion, AnimatePresence } from "framer-motion";

export default function AgentModule({ user, onNavigate }) {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "pending",
        priority: "",
        category: "",
        search: ""
    });
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [draftSolution, setDraftSolution] = useState("");
    const [draftSteps, setDraftSteps] = useState([]);
    const [completedStepIndices, setCompletedStepIndices] = useState([]);
    const [stepNotesMap, setStepNotesMap] = useState({});
    const [validationResult, setValidationResult] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        critical: 0,
        avg_confidence: 0
    });

    const getNextBestAction = () => {
        if (!selectedComplaint) return "";
        const total = draftSteps.length;
        const completedCount = completedStepIndices.length;

        if (total === 0) return "Add actionable troubleshooting steps to initiate resolution workflow.";

        const notesValues = Object.values(stepNotesMap);
        const hasAbnormalNote = notesValues.some(n =>
            /abnormal|fault|error|fail|high loss|drop|red|loss|attenuation/i.test(n)
        );

        if (hasAbnormalNote) {
            const isBilling = (selectedComplaint.category || '').includes('Billing');
            if (isBilling) {
                return "Diagnostic finding: Billing discrepancy or unauthorized fee verified. Next Best Action: Initiate transaction reversal workflow & issue billing credit note.";
            }
            return "Diagnostic finding: Optical / PON signal abnormal or out of threshold. Next Best Action: Escalate to NOC / Create Field Engineering Dispatch.";
        }

        if (completedCount === 0) {
            const firstStep = draftSteps[0] || "Initiate initial diagnostic check";
            return `Step 1 Pending: ${firstStep}. Verify current connection state or account ledger before proceeding.`;
        } else if (completedCount < total) {
            const nextIdx = draftSteps.findIndex((_, i) => !completedStepIndices.includes(i));
            const nextStepName = draftSteps[nextIdx] || "Perform next diagnostic task";
            return `Next Step (${nextIdx + 1}/${total}): ${nextStepName}. Proceed with operational verification.`;
        } else {
            return "All diagnostic & troubleshooting steps completed! Next Best Action: Approve resolution plan and send closure notification to subscriber.";
        }
    };

    useEffect(() => {
        if (user) {
            fetchQueue();
        }
    }, [user, filters]);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const data = await getAgentQueue(user?.email || "admin@telecomiq.com", {
                status: filters.status,
                priority: filters.priority,
                category: filters.category,
                search: filters.search
            });
            setQueue(data.complaints || []);

            // Calculate stats for demonstration
            const total = data.total || 0;
            const complaints = data.complaints || [];
            const critical = complaints.filter(c => c.priority === 'CRITICAL' || c.priority === 'P1 - CRITICAL' || c.priority === 'HIGH' || c.priority === 'P2 - HIGH').length;
            const escalated = complaints.filter(c => c.escalation_required || (c.escalation_risk_score && c.escalation_risk_score >= 60.0)).length;
            setStats({
                total,
                pending: filters.status === 'pending' ? total : complaints.filter(c => !c.is_resolved).length,
                critical,
                escalated
            });
        } catch (error) {
            console.error("Failed to fetch queue", error);
        } finally {
            setLoading(false);
        }
    };

    // The AI pipeline stores steps as objects ({step, status}), but the editor below
    // and the resolution email both treat a step as plain text, so flatten on load.
    const normalizeSteps = (steps) => {
        if (!Array.isArray(steps)) return [];
        return steps
            .map((step) => {
                if (typeof step === "string") return step.trim();
                if (step && typeof step === "object") {
                    const label = step.step || step.title || step.name || "";
                    const detail = step.status || step.description || step.detail || "";
                    return [label, detail].filter(Boolean).join(" — ") || JSON.stringify(step);
                }
                return step == null ? "" : String(step);
            })
            .filter(Boolean);
    };

    const handleOpenComplaint = async (complaint) => {
        setDetailLoading(true);
        setCompletedStepIndices([]);
        setStepNotesMap({});
        try {
            const data = await getComplaintDetail(complaint.ticket_id, user.email);
            setSelectedComplaint(data.complaint);
            setDraftSolution(data.agent_resolution?.draft_solution || data.complaint.ai_solution || "");
            setDraftSteps(normalizeSteps(data.agent_resolution?.steps || data.complaint.ai_steps));
            setValidationResult(data.agent_resolution ? {
                confidence_score: data.agent_resolution.confidence_score,
                approval_status: data.agent_resolution.validation_status,
                validation_results: data.agent_resolution.validation_results // This is simplified
            } : null);
        } catch (error) {
            console.error("Failed to fetch complaint detail", error);
        } finally {
            setDetailLoading(false);
        }
    };

    // The API errors carry the reason in detail; without this the agent just
    // sees the spinner stop and has no idea the request failed.
    const describeError = (error, fallback) =>
        error.response?.data?.detail || error.message || fallback;

    const handleValidate = async () => {
        if (!draftSolution.trim()) return;
        setIsValidating(true);
        setValidationResult(null);
        try {
            const result = await validateSolution(user.email, selectedComplaint.ticket_id, draftSolution, draftSteps);
            setValidationResult(result);
        } catch (error) {
            console.error("Validation failed", error);
            alert(`Validation failed: ${describeError(error, "please try again.")}`);
        } finally {
            setIsValidating(false);
        }
    };

    const handleSend = async () => {
        if (!draftSolution.trim()) return;
        setIsSending(true);
        try {
            await sendResolution(user.email, selectedComplaint.ticket_id, draftSolution, draftSteps);
            setSelectedComplaint(null);
            fetchQueue();
            alert("Resolution sent successfully!");
        } catch (error) {
            console.error("Failed to send resolution", error);
            alert(`Failed to send resolution: ${describeError(error, "please try again.")}`);
        } finally {
            setIsSending(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return String(dateString);
        }
    };
    const formatTimestamp = formatDate;

    const getSentimentBadge = (sentiment) => {
        const s = (sentiment || "").toLowerCase();
        if (s === 'negative') return <span className="badge badge-negative">Negative</span>;
        if (s === 'critical') return <span className="badge badge-critical">Critical</span>;
        if (s === 'angry') return <span className="badge badge-angry">Angry</span>;
        return <span className="badge badge-neutral">{sentiment || 'Neutral'}</span>;
    };

    const getPriorityClass = (priority) => {
        const p = (priority || "").toLowerCase();
        return `priority-${p}`;
    };

    return (
        <div className="agent-module">
            {/* Unified Clean Header */}
            <header className="landing-header-clean">
                <div className="header-left">
                    <div className="brand-logo" onClick={() => onNavigate("gateway")}>
                        <div className="brand-logo-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 17 12 22 22 17" />
                                <polyline points="2 12 12 17 22 12" />
                            </svg>
                        </div>
                        <div className="logo-text-stack">
                            <span className="logo-main-text">TelecomIQ</span>
                            <span className="logo-sub-text">Support Agent</span>
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    <button className="btn-nav-ghost" onClick={() => onNavigate("gateway")}>
                        Switch Role
                    </button>
                </div>
            </header>

            <div className="agent-banner">
                <motion.h1
                    className="agent-title"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Agent Resolution Module
                </motion.h1>
                <p className="agent-subtitle">Deep incident analysis & multi-model AI validation triage</p>
            </div>

            <div className="agent-content">
                <div className="agent-stats">
                    <motion.div className="admin-stat-card" whileHover={{ y: -3 }}>
                        <div className="admin-stat-icon total">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                        </div>
                        <div className="admin-stat-info">
                            <p className="admin-stat-label">Queue Size</p>
                            <h3 className="admin-stat-value">{stats.total}</h3>
                        </div>
                    </motion.div>

                    <motion.div className="admin-stat-card" whileHover={{ y: -3 }}>
                        <div className="admin-stat-icon pending">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className="admin-stat-info">
                            <p className="admin-stat-label">Pending Review</p>
                            <h3 className="admin-stat-value">{stats.pending}</h3>
                        </div>
                    </motion.div>

                    <motion.div className="admin-stat-card" whileHover={{ y: -3 }}>
                        <div className="admin-stat-icon high">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <div className="admin-stat-info">
                            <p className="admin-stat-label">Critical Issues</p>
                            <h3 className="admin-stat-value">{stats.critical}</h3>
                        </div>
                    </motion.div>

                    <motion.div className="admin-stat-card" whileHover={{ y: -3 }}>
                        <div className="admin-stat-icon escalated">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div className="admin-stat-info">
                            <p className="admin-stat-label">Escalated Risk</p>
                            <h3 className="admin-stat-value">{stats.escalated}</h3>
                        </div>
                    </motion.div>
                </div>

                <div className="agent-controls">
                    <div className="search-wrapper">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by Ticket ID, User, or Content..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <div className="filter-group">
                        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                            <option value="pending">Pending Review</option>
                            <option value="resolved">Resolved</option>
                            <option value="">All Status</option>
                        </select>
                        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
                            <option value="">All Priority</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                            <option value="">All Categories</option>
                            <option value="Network Connectivity">Network Connectivity</option>
                            <option value="Broadband Performance">Broadband Performance</option>
                            <option value="Call Drops">Call Drops</option>
                            <option value="Service Outage">Service Outage</option>
                            <option value="Billing Dispute">Billing Dispute</option>
                            <option value="Data / Usage Issue">Data / Usage Issue</option>
                            <option value="Installation">Installation</option>
                            <option value="Equipment / Router">Equipment / Router</option>
                            <option value="Service Request">Service Request</option>
                            <option value="Cancellation">Cancellation</option>
                            <option value="Customer Service">Customer Service</option>
                        </select>
                    </div>
                </div>

                <div className="queue-table-container">
                    <table className="queue-table">
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>User Details</th>
                                <th>Category</th>
                                <th>Sentiment</th>
                                <th>Priority</th>
                                <th>Timestamp</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem' }}><div className="loader" style={{ margin: '0 auto' }}></div></td></tr>
                            ) : queue.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem' }}>No complaints found in queue.</td></tr>
                            ) : (
                                queue.map(complaint => (
                                    <tr
                                        key={complaint.id}
                                        className="queue-row"
                                        onClick={() => handleOpenComplaint(complaint)}
                                    >
                                        <td><span className="ticket-id">{complaint.ticket_id}</span></td>
                                        <td>
                                            <div className="user-info">
                                                <span className="user-name">{complaint.user_name}</span>
                                                <span className="user-email">{complaint.user_email}</span>
                                            </div>
                                        </td>
                                        <td>{complaint.category}</td>
                                        <td>{getSentimentBadge(complaint.sentiment)}</td>
                                        <td><span className={getPriorityClass(complaint.priority)}>{complaint.priority}</span></td>
                                        <td><span className="user-email">{new Date(complaint.created_at).toLocaleString()}</span></td>
                                        <td><span className={`status-${complaint.status}`}>{complaint.status.replace('_', ' ')}</span></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedComplaint && (
                    <div className="admin-modal-overlay" onClick={() => setSelectedComplaint(null)}>
                        <motion.div
                            className="admin-modal"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="admin-modal-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                        Ticket {selectedComplaint.ticket_id || `#${selectedComplaint.id}`}
                                    </h2>
                                    <span className={`admin-status ${selectedComplaint.is_resolved ? 'resolved' : 'pending'}`}>
                                        {selectedComplaint.is_resolved ? "Resolved" : "Pending Review"}
                                    </span>
                                </div>
                                <button className="admin-modal-close" onClick={() => setSelectedComplaint(null)} aria-label="Close modal">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <div className="admin-modal-content">
                                {/* Section 1: Customer Information */}
                                <div className="admin-modal-section">
                                    <h3>Customer Information</h3>
                                    <div className="admin-modal-grid">
                                        <div className="admin-modal-field">
                                            <label>Ticket ID</label>
                                            <p>{selectedComplaint.ticket_id || `#${selectedComplaint.id}`}</p>
                                        </div>
                                        <div className="admin-modal-field">
                                            <label>Customer Name</label>
                                            <p>{selectedComplaint.name || selectedComplaint.user_name || "Subscriber"}</p>
                                        </div>
                                        <div className="admin-modal-field">
                                            <label>Email Address</label>
                                            <p>{selectedComplaint.email || selectedComplaint.user_email || "N/A"}</p>
                                        </div>
                                        <div className="admin-modal-field">
                                            <label>Submission Date</label>
                                            <p>{formatTimestamp(selectedComplaint.created_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: AI Triage & Assessment */}
                                <div className="admin-modal-section">
                                    <h3>AI Triage &amp; Risk Assessment</h3>
                                    <div className="admin-modal-grid">
                                        <div className="admin-modal-field">
                                            <label>Category</label>
                                            <span className="category-tag">{selectedComplaint.category || "Network Connectivity"}</span>
                                        </div>
                                        <div className="admin-modal-field">
                                            <label>Priority</label>
                                            <span className={`priority-pill ${(selectedComplaint.priority || 'medium').toLowerCase()}`}>
                                                {selectedComplaint.priority || "Medium"}
                                            </span>
                                        </div>
                                        <div className="admin-modal-field">
                                            <label>Sentiment</label>
                                            <p>{selectedComplaint.sentiment || "Neutral"}</p>
                                        </div>
                                        <div className="admin-modal-field">
                                            <label>Escalation Risk</label>
                                            <span style={{
                                                color: (selectedComplaint.escalation_risk_score >= 60 || selectedComplaint.escalation_required) ? '#ef4444' : '#10b981',
                                                fontWeight: '700'
                                            }}>
                                                ⚠️ {selectedComplaint.escalation_risk_score ? `${selectedComplaint.escalation_risk_score}%` : (selectedComplaint.escalation_required ? "Required" : "Low Risk")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Complaint Content */}
                                <div className="admin-modal-section">
                                    <h3>Subject</h3>
                                    <div className="admin-modal-text" style={{ fontWeight: '700', marginBottom: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                                        {selectedComplaint.subject || "No Subject"}
                                    </div>
                                    <h3>Detailed Description</h3>
                                    <div className="admin-modal-text" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}>
                                        {selectedComplaint.description || selectedComplaint.complaint_text}
                                    </div>
                                </div>

                                {/* Section 4: AI Grounded Recommendation & Full Triage */}
                                <div className="admin-modal-section">
                                    <ComplaintCard data={selectedComplaint} />
                                </div>

                                {/* Section 5: Support Agent Resolution Plan & Dynamic Next-Best-Action Workflow */}
                                <div className="admin-modal-section" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.75rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                ✍️ SUPPORT AGENT RESOLUTION PLAN
                                            </h3>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                                                AI-generated from incident details + historical cases + telecom SOPs
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Diagnosis Focus</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af' }}>{selectedComplaint.likely_cause || "Operational Verification"}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Target SLA</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>12 Hours</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resolution Plan Text Editor */}
                                    <label style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
                                        Official Resolution Response Draft
                                    </label>
                                    <textarea
                                        className="solution-editor"
                                        placeholder="Write or refine the technical resolution message to be delivered to subscriber..."
                                        value={draftSolution}
                                        onChange={(e) => setDraftSolution(e.target.value)}
                                        style={{
                                            width: '100%',
                                            minHeight: '90px',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '0.9rem',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            marginBottom: '1.25rem',
                                            outline: 'none',
                                            background: '#ffffff'
                                        }}
                                    />

                                    {/* Actionable Interactive Steps */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', margin: 0 }}>
                                                Interactive Troubleshooting Steps ({completedStepIndices.length}/{draftSteps.length} Completed)
                                            </h4>
                                            <button
                                                onClick={() => setDraftSteps([...draftSteps, ""])}
                                                style={{
                                                    background: '#eff6ff',
                                                    color: '#1d4ed8',
                                                    border: '1px solid #bfdbfe',
                                                    borderRadius: '6px',
                                                    padding: '4px 10px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                + Add Step
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {draftSteps.map((step, idx) => {
                                                const isCompleted = completedStepIndices.includes(idx);
                                                return (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            background: isCompleted ? '#f0fdf4' : '#ffffff',
                                                            border: isCompleted ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                                                            borderRadius: '8px',
                                                            padding: '10px 14px',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isCompleted) {
                                                                        setCompletedStepIndices(completedStepIndices.filter(i => i !== idx));
                                                                    } else {
                                                                        setCompletedStepIndices([...completedStepIndices, idx]);
                                                                    }
                                                                }}
                                                                style={{
                                                                    background: isCompleted ? '#16a34a' : '#ffffff',
                                                                    color: isCompleted ? '#ffffff' : '#475569',
                                                                    border: isCompleted ? 'none' : '1px solid #cbd5e1',
                                                                    borderRadius: '6px',
                                                                    padding: '4px 10px',
                                                                    fontSize: '0.78rem',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}
                                                            >
                                                                {isCompleted ? '✓ Completed' : 'Mark Complete'}
                                                            </button>

                                                            <input
                                                                type="text"
                                                                value={step}
                                                                onChange={(e) => {
                                                                    const newSteps = [...draftSteps];
                                                                    newSteps[idx] = e.target.value;
                                                                    setDraftSteps(newSteps);
                                                                }}
                                                                placeholder={`Step ${idx + 1}...`}
                                                                style={{
                                                                    flex: 1,
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: 600,
                                                                    color: isCompleted ? '#166534' : '#0f172a',
                                                                    textDecoration: isCompleted ? 'line-through' : 'none',
                                                                    outline: 'none'
                                                                }}
                                                            />

                                                            <button
                                                                onClick={() => setDraftSteps(draftSteps.filter((_, i) => i !== idx))}
                                                                style={{
                                                                    background: 'transparent',
                                                                    color: '#ef4444',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 700,
                                                                    opacity: 0.6
                                                                }}
                                                                title="Remove Step"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>

                                                        {/* Optional Diagnostic Note / Finding Input */}
                                                        <div style={{ marginTop: '8px', paddingLeft: '28px' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Add Diagnostic Finding (e.g. Downstream level -28 dBm abnormal / ledger verified)..."
                                                                value={stepNotesMap[idx] || ""}
                                                                onChange={(e) => setStepNotesMap({ ...stepNotesMap, [idx]: e.target.value })}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '4px 8px',
                                                                    fontSize: '0.8rem',
                                                                    borderRadius: '4px',
                                                                    border: '1px dashed #cbd5e1',
                                                                    background: '#ffffff',
                                                                    color: '#334155'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ⚡ DYNAMIC NEXT BEST ACTION CARD */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                                        color: '#ffffff',
                                        padding: '1.25rem',
                                        borderRadius: '10px',
                                        boxShadow: '0 4px 14px rgba(49, 46, 129, 0.25)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '1rem' }}>⚡</span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', color: '#a5b4fc', textTransform: 'uppercase' }}>
                                                DYNAMIC NEXT BEST ACTION (AI WORKFLOW ENGINE)
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.5, color: '#f8fafc' }}>
                                            {getNextBestAction()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '10px',
                                padding: '1.25rem 2rem',
                                borderTop: '1px solid #e2e8f0',
                                background: '#f8fafc'
                            }}>
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    style={{
                                        padding: '0.6rem 1.25rem',
                                        background: '#ffffff',
                                        color: '#475569',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={isSending || !draftSolution.trim()}
                                    style={{
                                        padding: '0.6rem 1.4rem',
                                        background: draftSolution.trim() ? '#10b981' : '#9ca3af',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.88rem',
                                        cursor: draftSolution.trim() ? 'pointer' : 'not-allowed',
                                        boxShadow: draftSolution.trim() ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none'
                                    }}
                                >
                                    {isSending ? "Delivering Resolution..." : "✅ Approve & Resolve Complaint"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
