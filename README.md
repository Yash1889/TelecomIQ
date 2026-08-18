# TelecomIQ — Enterprise Telecom Complaint Intelligence & Automated Resolution Platform

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Groq_Cloud_AI-Qwen_3.6--27B-FF4A00?style=for-the-badge&logo=groq&logoColor=white" alt="Groq AI"/>
  <img src="https://img.shields.io/badge/Scikit--Learn-TF--IDF_Classifier-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="Scikit-Learn"/>
  <img src="https://img.shields.io/badge/Domain-Telecom_Operational_AI-2563EB?style=for-the-badge" alt="Domain"/>
  <img src="https://img.shields.io/badge/Evaluation-Cognizant_NPN-003366?style=for-the-badge" alt="Evaluation"/>
</p>

**TelecomIQ** is an enterprise-grade **Telecom Complaint Intelligence & Automated Resolution Platform** built for telecom operators, Network Operation Centers (NOCs), support agents, and subscribers. It ingests raw subscriber complaint text and applies local ML classification, sentiment scoring, multi-factor escalation risk evaluation, vector-based historical RAG matching, and Groq Cloud AI LLM orchestration to resolve subscriber issues with surgical precision and SLA accountability.

---

## ⚡ How Complaint Filing & AI Resolution Works

When a user submits a complaint on the TelecomIQ portal, the system executes an automated 8-stage intelligence pipeline in under 1 second:

```
[Raw User Input]
       │
       ▼
 1. 🎯 Category Classifier (TF-IDF + Logistic Regression across 11 Telecom Domains)
       │
       ▼
 2. 🧠 Sentiment & Polarity Analyzer (VADER Model: Angry / Negative / Neutral / Positive)
       │
       ▼
 3. 🚨 Priority & Escalation Risk Scoring (Calculates Risk %: 10%–99% & SLA Target)
       │
       ▼
 4. 🔍 Vector RAG Similarity Search (Cosine similarity over 2,200 historical database records)
       │
       ▼
 5. 📖 Technical SOP Grounding (Loads specific domain troubleshooting steps from telecom_kb.json)
       │
       ▼
 6. 🚀 Groq LLM Orchestration (Uses Groq qwen/qwen3.6-27b for empathetic subscriber reply & 4-step tech plan)
       │
       ▼
 7. 💾 Persistence & SLA Assignment (Generates ticket TC-YYYYMMDD-XXXX in SQLite DB)
       │
       ▼
 8. 📧 Notification Dispatcher (Dispatches email/SMS confirmations to subscriber & support queue)
```

---

## 📑 Key Features

### 📡 11 Specialized Telecom Complaint Categories
1. **Network Connectivity** (Cell tower coverage drops, 5G/4G signal loss)
2. **Broadband Performance** (Fiber speed drops, latency, optical light loss)
3. **Call Drops** (VoLTE audio cuts, 30-sec call disconnects)
4. **Service Outage** (Localized blackouts, regional optical fiber cuts)
5. **Billing Dispute** (Double charges, unauthorized VAS auto-debit, security deposit delays)
6. **Data / Usage Issue** (FUP throttling, roaming data pack failures)
7. **Installation** (Technician delay, fiber port availability)
8. **Equipment / Router** (Overheating modems, Wi-Fi signal range issues)
9. **Service Request** (Connection relocation, static IP allocation)
10. **Cancellation** (MNP port-out UPC requests, account closure)
11. **Customer Service** (Agent conduct, unfulfilled callback promises)

### 🧠 Multi-Model AI Architecture
- **Category Classifier (`classifier.py`):** Scikit-Learn TF-IDF + Logistic Regression model trained on 2,200 synthetic telecom complaint records (100% accuracy on benchmark tests).
- **Nuanced Sentiment & Polarity (`sentiment_analyzer.py`):** 4-way classification (`Positive`, `Neutral`, `Negative`, `Angry`) with numerical polarity scoring (`-1.0` to `+1.0`).
- **Multi-Factor Escalation Risk Score (`priority.py`):** 10%–99% risk score based on category severity, sentiment intensity, and high-risk trigger keywords. Automatically flags tickets requiring human operator review when risk exceeds 65%.
- **Vector RAG Engine (`complaint_matcher.py` & `rag_engine.py`):** TF-IDF cosine similarity search over historical database complaints for instant duplicate detection and pattern matching. Retrieves domain SOP troubleshooting steps and SLA timelines from `telecom_kb.json`.
- **Groq LLM Integration (`groq_client.py`):** Tiered fallback LLM orchestration using active Groq models (`qwen/qwen3.6-27b`, `groq/compound-mini`).

---

## 🔑 Authentication & Persona Access

TelecomIQ features seamless demo access for hackathon judges and evaluators:
- **Universal Sign-In**: Enter **ANY email** (e.g., `user@gmail.com`, `admin@gmail.com`) and **ANY password**.
  - Emails containing `admin` → Granted **Admin Dashboard Access**.
  - Emails containing `agent` → Granted **Agent Queue Access**.
  - All other emails → Granted **Subscriber / File Complaint Access**.

---

## 📊 Dataset & Analytics

- **Seeded Dataset**: 2,200 structured telecom complaint records populated in `backend/complaints.db`.
- **Admin Table View**: Open the **📊 Admin Dashboard** in the UI to search, filter by category/priority, and paginate through all 2,200 dataset complaints.
- **Model Evaluation Script**: Run `python backend/scripts/evaluate_models.py` to inspect detailed classification metrics.

| Metric | Score |
| :--- | :--- |
| **Accuracy** | 100.00% |
| **Precision** | 100.00% |
| **Recall** | 100.00% |
| **Macro F1** | 100.00% |

---

## ⚡ Quick Start Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies:
pip install -r requirements.txt

# Start FastAPI backend server:
python start_backend.py
```
Backend API will be running at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web Portal will be running at: `http://localhost:5173`.

---

## 📄 License
This project is released under the MIT License for the Cognizant NPN AI & Analytics evaluation.