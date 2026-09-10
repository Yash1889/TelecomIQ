import axios from "axios";

// Automatically resolve the backend URL:
// 1. Explicit VITE_API_URL environment variable if valid and not legacy render
// 2. Localhost for local development
// 3. Hosted Vercel backend in production (https://telecom-iq-pi.vercel.app)
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes("onrender.com") && !envUrl.includes("render")) {
    return envUrl;
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8000";
  }
  return "https://telecom-iq-pi.vercel.app";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auto-attach JWT Bearer token if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("telecomiq_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return config;
});

const AUTH_TIMEOUT = 90000;

export const submitComplaint = async (name, email, subject, description, category = null, user_priority = "MEDIUM") => {
  const response = await api.post("/complaint", {
    name,
    email,
    subject,
    description,
    category: category || null,
    user_priority: user_priority || "MEDIUM"
  });
  return response.data;
};

export const getAllComplaints = async (email = "") => {
  const url = email ? `/complaints?email=${encodeURIComponent(email)}` : "/complaints";
  const response = await api.get(url);
  return response.data;
};

export const deleteAllComplaints = async (email = "") => {
  const response = await api.delete("/complaints", {
    params: email ? { email } : {}
  });
  return response.data;
};

export const updateComplaintStatus = async (ticketId, is_resolved, admin_solution = null) => {
  const body = { is_resolved };
  if (admin_solution) {
    body.admin_solution = admin_solution;
  }
  const response = await api.patch(`/complaint/${ticketId}/status`, body);
  return response.data;
};

export const deleteComplaint = async (ticketId) => {
  const response = await api.delete(`/complaint/${ticketId}`);
  return response.data;
};

export const bulkDeleteComplaints = async (ids) => {
  const response = await api.delete("/complaints/bulk", { data: { ids } });
  return response.data;
};

// Agent Module API
export const getAgentQueue = async (agentEmail, params = {}) => {
  const queryParams = new URLSearchParams({ agent_email: agentEmail, ...params }).toString();
  const response = await api.get(`/agent/complaints/queue?${queryParams}`);
  return response.data;
};

export const getComplaintDetail = async (ticketId, agentEmail) => {
  const response = await api.get(`/agent/complaints/${ticketId}?agent_email=${encodeURIComponent(agentEmail)}`);
  return response.data;
};

export const validateSolution = async (agentEmail, ticketId, draftSolution, steps = null) => {
  const response = await api.post("/agent/validate-solution", {
    agent_email: agentEmail,
    ticket_id: ticketId,
    draft_solution: draftSolution,
    steps: steps
  });
  return response.data;
};

export const sendResolution = async (agentEmail, ticketId, finalSolution, steps = null) => {
  const response = await api.post("/agent/send-resolution", {
    agent_email: agentEmail,
    ticket_id: ticketId,
    final_solution: finalSolution,
    steps: steps
  });
  return response.data;
};

export const getAllResolutions = async (agentEmail, params = {}) => {
  const queryParams = new URLSearchParams({ agent_email: agentEmail, ...params }).toString();
  const response = await api.get(`/agent/resolutions?${queryParams}`);
  return response.data;
};

export const getAuditLogs = async (agentEmail, params = {}) => {
  const queryParams = new URLSearchParams({ agent_email: agentEmail, ...params }).toString();
  const response = await api.get(`/agent/audit-logs?${queryParams}`);
  return response.data;
};

// ==========================================
// Authentication APIs (Login, Signup, Me)
// ==========================================

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  if (response.data?.access_token) {
    localStorage.setItem("telecomiq_token", response.data.access_token);
    localStorage.setItem("telecomiq_user", JSON.stringify(response.data.user));
  }
  return response.data;
};

export const signupUser = async (userData) => {
  const response = await api.post("/auth/signup", userData);
  if (response.data?.access_token) {
    localStorage.setItem("telecomiq_token", response.data.access_token);
    localStorage.setItem("telecomiq_user", JSON.stringify(response.data.user));
  }
  return response.data;
};

export const getCurrentUserProfile = async (email = null) => {
  const url = email ? `/auth/me?email=${encodeURIComponent(email)}` : "/auth/me";
  const response = await api.get(url);
  return response.data;
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("telecomiq_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const logoutUser = () => {
  try {
    localStorage.removeItem("telecomiq_token");
    localStorage.removeItem("telecomiq_user");
  } catch (e) {
    // Ignore error
  }
};

export default api;
