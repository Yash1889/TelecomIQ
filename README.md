# TelecomIQ — Telecom Complaint Intelligence & Automated Resolution Assistant

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/LangGraph-Agentic_Orchestration-6366f1?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Scikit--Learn-TF--IDF_+_LR-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white"/>
  <img src="https://img.shields.io/badge/DistilBERT-Deep_Learning-FF4A00?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Kaggle_Dataset-2204_Records-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white"/>
  <img src="https://img.shields.io/badge/Test_Accuracy-89.12%25-green?style=for-the-badge"/>
</p>

---

## 📌 Overview

**TelecomIQ** is an AI-powered complaint intelligence platform for telecom operators. It automatically classifies complaints, detects customer sentiment, predicts escalation risks, recommends resolutions, and generates ticket summaries — orchestrated end-to-end using a **LangGraph** agentic pipeline.

**Use Case**: Telecom Complaint Intelligence & Automated Resolution Assistant  
**Dataset**: [Kaggle — ravillatejakumar/telecom-complaints-monitoring-system](https://www.kaggle.com/datasets/ravillatejakumar/telecom-complaints-monitoring-system)  
**Type**: NLP / Information Extraction

---

## 👥 Team

| # | Member | Ownership | Main Responsibility |
|---|--------|-----------|---------------------|
| 1 | **Abhyanshu** | Business + Dataset | Problem definition, dataset, EDA, business impact |
| 2 | **Srishti** | NLP Metadata | Keywords, NER, speaker identification, time segmentation |
| 3 | **Yashraj** | ML + Sentiment | Classification (TF-IDF + Logistic Regression), VADER sentiment |
| 4 | **Vibhuti** | RAG | Retrieval, vector similarity, knowledge base |
| 5 | **Vaibhav Raj** | GenAI | LLM prompts, resolution generation, ticket summary |
| 6 | **Veer** | Risk + Compliance | Priority scoring, escalation prediction, PII detection, human-in-loop |
| 7 | **Vishant** | Full Stack + Architecture | React, FastAPI, database, integration, deployment |

---

## 🔄 End-to-End Pipeline

```
Customer Complaint
       ↓
  Input Validation
       ↓
  Text Classification        (TF-IDF + Logistic Regression — 89.12% accuracy)
       ↓
  Sentiment Analysis         (VADER + TextBlob)
       ↓
  Priority + Escalation Risk (Multi-factor scoring → CRITICAL / HIGH / MEDIUM / LOW)
       ↓
  Vector Historical Search   (Cosine similarity over 2,200+ indexed tickets)
       ↓
  RAG Knowledge Base         (TF-IDF over 11 telecom SOP documents)
       ↓
  LangGraph Orchestration    (7-node StateGraph)
       ↓
  GenAI Triage Assistant     (Groq → Gemini → SOP fallback)
       ↓
  Resolution + Ticket Summary
       ↓
  Support Agent / Dashboard
```

---

## 📂 Dataset

| Property | Value |
|----------|-------|
| Source | Kaggle — `ravillatejakumar/telecom-complaints-monitoring-system` |
| Raw records | 2,224 |
| After deduplication | 2,204 |
| Train / Val / Test split | 70% / 15% / 15% |
| Test accuracy | **89.12%** |
| Weighted F1 | **0.8903** |

---

## 🧪 ML Validation Results (Held-Out Test Set — 331 Samples)

| Category | Precision | Recall | F1-Score | Support |
|----------|:---------:|:------:|:--------:|:-------:|
| Billing Dispute | 0.987 | 0.802 | **0.885** | 96 |
| Broadband Performance | 0.902 | 0.974 | **0.937** | 38 |
| Call Drops | 0.667 | 1.000 | **0.800** | 4 |
| Cancellation | 0.750 | 1.000 | **0.857** | 3 |
| Customer Service | 0.889 | 0.889 | **0.889** | 9 |
| Data / Usage Issue | 0.944 | 0.971 | **0.958** | 35 |
| Equipment / Router | 0.500 | 1.000 | **0.667** | 1 |
| Installation | 1.000 | 0.333 | **0.500** | 3 |
| Network Connectivity | 0.000 | 0.000 | 0.000 | 1 |
| Service Outage | 0.539 | 0.778 | **0.636** | 9 |
| Service Request | 0.872 | 0.932 | **0.901** | 132 |
| **Overall** | **0.902** | **0.891** | **0.890** | **331** |

---

## 🛠️ Technical Stack

| Layer | Technology |
|-------|-----------|
| Agentic Orchestration | LangGraph StateGraph (7 nodes) |
| ML Classification | Scikit-learn TF-IDF + Logistic Regression |
| Deep Learning | DistilBERT (offline fallback), BART zero-shot |
| Sentiment Analysis | VADER + TextBlob |
| GenAI | Groq (Qwen/Llama) → Gemini → SOP fallback |
| Vector DB / RAG | TF-IDF cosine similarity over 2,200+ complaints + 11 SOP docs |
| Backend | FastAPI + SQLAlchemy + SQLite/PostgreSQL |
| Frontend | React 19 + Vite |
| Deployment | Vercel (frontend + backend) |

---

## 🚀 Local Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python scripts/train_kaggle_dataset.py   # download dataset, train models, seed DB
python start_backend.py                  # runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                              # runs on http://localhost:5173
```

### Demo Access
- Any email containing `admin` → Admin Dashboard
- Any email containing `agent` → Agent Queue
- Any other email → Subscriber view

---

## 📄 License

MIT License — built for the Cognizant NPN AI & Analytics evaluation.
