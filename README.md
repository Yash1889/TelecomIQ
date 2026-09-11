# TelecomIQ — Enterprise Telecom Complaint Intelligence & Autonomous Triage Platform

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/LangGraph-Agentic_Orchestration-6366f1?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Groq_LLM-Llama_3.3_70B-f97316?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Scikit--Learn-TF--IDF_+_LR-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white"/>
  <img src="https://img.shields.io/badge/Kaggle_Dataset-2204_Records-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white"/>
  <img src="https://img.shields.io/badge/Test_Accuracy-89.12%25-green?style=for-the-badge"/>
</p>

---

## 📌 Executive Overview

**TelecomIQ** is a state-of-the-art AI-powered complaint intelligence and automated resolution platform built for enterprise telecom operators. It streamlines subscriber ticket intake, classifies complaints across 12 telecom domain categories, computes sentiment polarity, scores escalation risks, retrieves verified operational SOPs via RAG, and produces grounded technical resolution summaries using an autonomous multi-agent pipeline.

* **Use Case**: Telecom Complaint Intelligence, Incident Triage & Automated Resolution
* **Dataset**: [Kaggle — ravillatejakumar/telecom-complaints-monitoring-system](https://www.kaggle.com/datasets/ravillatejakumar/telecom-complaints-monitoring-system) (2,204 validated records)
* **Core Architecture**: Multi-Agent StateGraph Orchestration + RAG + TF-IDF ML + Groq LLaMA-3.3-70B

---

## 👥 Project Team & Ownership

| # | Member | Ownership | Core Responsibilities |
|---|--------|-----------|------------------------|
| 1 | **Abhyanshu** | Business Strategy & Dataset | Problem definition, dataset curation, exploratory data analysis (EDA), KPI formulation |
| 2 | **Srishti** | NLP & Data Pipeline | Keyword extraction, NER, PII masking, language detection & multi-lingual translation |
| 3 | **Yashraj** | ML & Sentiment Analysis | Classification (TF-IDF + Logistic Regression), VADER sentiment polarity scoring |
| 4 | **Vibhuti** | RAG & Vector Retrieval | Knowledge base index, vector cosine similarity search over 2,200+ historical tickets |
| 5 | **Vaibhav Raj** | Generative AI & Prompting | LLM prompt engineering, grounded resolution generation, executive ticket summaries |
| 6 | **Veer** | Risk, Compliance & SLA | Dynamic priority scoring, escalation risk prediction (0–100%), human-in-the-loop triggers |
| 7 | **Vishant** | Full Stack & Cloud Architecture | React 19 SPA, FastAPI REST services, SQLite/Vercel persistence, auth system |

---

## 🎭 Role-Dedicated Portals & User Journeys

TelecomIQ provides tailored workspaces for each operational persona:

```
                           ┌────────────────────────┐
                           │   TelecomIQ Gateway    │
                           │     (Role Picker)      │
                           └───────────┬────────────┘
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│ Customer Portal  │         │   Support Agent  │         │  Administrator   │
│  (Public Access) │         │     Workspace    │         │  & NOC Dashboard │
└────────┬─────────┘         └────────┬─────────┘         └────────┬─────────┘
         │                            │                            │
         ▼                            ▼                            ▼
• Self-Registration/Login    • Live Ticket Queue          • NOC Command Center
• Preset Complaint Demos     • SLA Risk Tracking          • SLA Breach Analytics
• Live Triage Step Tracker   • 1-Click Status Update      • Volume & Category Mix
• Instant Resolution Popup   • AI Canned Responses        • Resolution Velocity
• Floating AI Assistant      • Customer Email Dispatch    • Raw Ticket Export
```

### 1. 👤 Customer / Subscriber Portal
* **Sign Up & Sign In**: Dedicated self-registration for telecom subscribers.
* **Smart Intake Form**: Pre-populated scenarios (5G signal drops, billing double-deductions, broadband PON disconnects, fiber outages) with custom inputs.
* **Live Step-by-Step Triage**: Real-time interactive pipeline progression animation.
* **Resolution Modal**: Instant structured triage summary with category badge, sentiment indicator, risk score, matched SOP checklist, and step-by-step action plan.
* **Floating AI Assistant**: 24/7 side chatbot for instant billing and network guidance.

### 2. 🛡️ Support Agent Workspace
* **Real-time Queue**: Active ticket feed filterable by priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `ESCALATED`), and category.
* **Incident Inspection**: Complete audit trace, historical vector match benchmarks, and customer sentiment polarity.
* **Operational Actions**: 1-click status transitions, AI-generated resolution draft injection, and direct email response dispatch.

### 3. 👑 Administrator & NOC Command Center
* **Operational Metrics**: Total ticket volume, open issue rates, average escalation risk score, and real-time SLA breach monitoring.
* **Visual Analytics**: Interactive category distribution charts, sentiment trends, and priority matrices.
* **Data Management**: Full ticket database inspection with instant CSV/data export.

---

## 🔄 Autonomous 7-Stage AI Pipeline

```
[ Customer Input ] 
       │
       ▼
┌─────────────────────────┐
│ 1. Ingestion & PII Mask │  → Regex masking of phone numbers, accounts & IPs (<2ms)
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│ 2. Language Detection   │  → Multi-lingual & Hinglish normalization to English (<5ms)
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│ 3. ML Classification    │  → TF-IDF + Logistic Regression over 12 categories (12ms)
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│ 4. Sentiment Analysis   │  → VADER lexicon polarity compound scoring (-1.0 to +1.0)
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│ 5. Priority & SLA Risk  │  → Multi-factor scoring → CRITICAL / HIGH / MEDIUM / LOW (0–100%)
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│ 6. RAG & Vector Search  │  → Cosine similarity over 2,200+ historical tickets + SOP KB (8ms)
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│ 7. GenAI Triage LLM     │  → Groq LLaMA-3.3-70B generates grounded technical plan (280ms)
└──────────┬──────────────┘
           │
           ▼
[ Structured Triage Result ]
```

---

## 🧪 Model Performance & Benchmarks

Evaluated on the held-out test split (331 samples) of the Kaggle Telecom Complaints dataset:

| Category | Precision | Recall | F1-Score | Test Samples |
|:---|:---:|:---:|:---:|:---:|
| **Billing Dispute** | 0.987 | 0.802 | **0.885** | 96 |
| **Broadband Performance** | 0.902 | 0.974 | **0.937** | 38 |
| **Call Drops** | 0.667 | 1.000 | **0.800** | 4 |
| **Cancellation** | 0.750 | 1.000 | **0.857** | 3 |
| **Customer Service** | 0.889 | 0.889 | **0.889** | 9 |
| **Data / Usage Issue** | 0.944 | 0.971 | **0.958** | 35 |
| **Equipment / Router** | 0.500 | 1.000 | **0.667** | 1 |
| **Installation** | 1.000 | 0.333 | **0.500** | 3 |
| **Service Outage** | 0.539 | 0.778 | **0.636** | 9 |
| **Service Request** | 0.872 | 0.932 | **0.901** | 132 |
| **Weighted Average / Overall** | **0.902** | **0.891** | **0.890** | **331** |

* **Overall Classification Accuracy**: **89.12%**
* **Inference Latency**: Sub-350ms end-to-end (ML + RAG + Groq Cloud LPU)

---

## 🛠️ Technology Stack

| Layer | Component | Description |
|---|---|---|
| **Frontend** | React 19, Vite, Framer Motion | Modern dark-mode SPA with glassmorphism design system & micro-animations |
| **Styling** | Vanilla CSS (Component-scoped) | Fast, responsive, fluid layouts with zero heavy CSS framework bloat |
| **Backend** | FastAPI (Python 3.11+) | High-performance asynchronous REST API framework |
| **ML & NLP** | Scikit-learn, VADER, TextBlob | TF-IDF n-gram vectorization, Logistic Regression, sentiment polarity scoring |
| **Generative AI** | Groq SDK (`llama-3.3-70b-versatile`) | Ultra-low latency LPU inference with grounded SOP fallbacks |
| **RAG & Vector Search** | Scikit-learn Cosine Similarity | Vector retrieval over 2,200+ historical tickets & 11 telecom SOP procedures |
| **Database** | SQLAlchemy + SQLite | Lightweight, portable ACID storage with serverless `/tmp` compatibility |
| **Deployment** | Vercel Serverless & Static CDN | Production-ready multi-target deployment |

---

## 🚀 Getting Started Locally

### Prerequisites
* Python 3.10 or higher
* Node.js 18+ & npm
* *(Optional)* `GROQ_API_KEY` for live LLaMA-3.3 LLM generation (fallback SOP engine active by default)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Retrain ML models and seed historical database
python scripts/train_kaggle_dataset.py

# Start the FastAPI server (auto-binds to port 8000)
python start_backend.py
```
* Backend API will be live at: `http://localhost:8000`
* Interactive OpenAPI Swagger docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start the Vite development server
npm run dev
```
* Open your browser and navigate to: `http://localhost:5173`

---

### 3. Pre-Configured Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Customer** | *Register any new account* | *Any secure password* | Public Subscriber Portal |
| **Support Agent** | `agent@telecomiq.com` | `agent123` | Support Agent Workspace & Queue |
| **Administrator** | `admin@telecomiq.com` | `admin123` | Administrator & NOC Command Center |

---

## 📁 Repository Structure

```
TelecomIQ/
├── backend/
│   ├── app/
│   │   ├── agents/             # Autonomous AI agents (Classifier, Sentiment, Priority, Groq, etc.)
│   │   ├── api/                # Core REST API endpoints (routes.py, chat.py)
│   │   ├── db/                 # Database config, SQLAlchemy models & seed script
│   │   ├── knowledge_base/     # Telecom SOPs (telecom_kb.json, policies.json)
│   │   ├── routes/             # Authentication & Support Agent module routes
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── services/           # RAG retrieval engine, autonomous validator & auto-resolver
│   │   └── main.py             # FastAPI app initialization
│   ├── data/                   # Processed datasets (train/val/test splits)
│   ├── models/                 # Saved model weights & TF-IDF vectorizer artifacts
│   ├── scripts/                # Training, evaluation and benchmark audit scripts
│   ├── requirements.txt        # Python library dependencies
│   └── start_backend.py        # Local backend launch script
├── frontend/
│   ├── src/
│   │   ├── components/         # Gateway, Landing, ComplaintForm, AdminDashboard, AgentModule, etc.
│   │   ├── styles/             # Modular CSS stylesheets
│   │   ├── api.js              # Centralized Axios API client
│   │   ├── App.jsx             # Main controller & page router
│   │   └── main.jsx            # React root mount
│   ├── package.json            # Node.js dependencies
│   └── vite.config.js          # Vite bundler configuration
├── complaints.db               # SQLite database file
├── README.md                   # Project documentation
└── vercel.json                 # Vercel deployment configuration
```

---

## 📄 License

This project is licensed under the MIT License — created for enterprise telecom incident triage and AI evaluation benchmarks.
