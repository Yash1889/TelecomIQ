# TelecomIQ — Enterprise Telecom Complaint Intelligence & Automated Resolution Platform

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Groq_Cloud_AI-Qwen_3.6--27B-FF4A00?style=for-the-badge&logo=groq&logoColor=white" alt="Groq AI"/>
  <img src="https://img.shields.io/badge/Scikit--Learn-TF--IDF_Classifier-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="Scikit-Learn"/>
  <img src="https://img.shields.io/badge/Kaggle_Dataset-2224_Records-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white" alt="Kaggle Dataset"/>
  <img src="https://img.shields.io/badge/Model_Accuracy-96.00%25-green?style=for-the-badge" alt="Accuracy"/>
  <img src="https://img.shields.io/badge/Developer-Yashraj_Gupta-blue?style=for-the-badge" alt="Developer"/>
</p>

---

## 📌 Executive Overview

**TelecomIQ** is an enterprise-grade **AI-Powered Telecom Complaint Intelligence & Automated Resolution System** built for telecom operators, support agents, Network Operation Centers (NOCs), and subscribers. 

The platform ingests raw subscriber complaint text and executes an automated multi-model pipeline: **ML Domain Classification**, **VADER Sentiment Analysis**, **Multi-Factor Escalation Risk Scoring**, **TF-IDF Vector RAG Matching**, and **Groq Cloud LLM Orchestration** to generate precise, SLA-backed complaint resolutions in real-time.

---

## 📂 Dataset & Training Data

### 📊 Dataset Used: Kaggle Telecom Complaints Monitoring System
This platform is trained and evaluated on the official Kaggle dataset:
👉 **[`ravillatejakumar/telecom-complaints-monitoring-system`](https://www.kaggle.com/datasets/ravillatejakumar/telecom-complaints-monitoring-system)** (`Comcast_telecom_complaints_data.csv`).

### 🔍 What is in the Dataset?
- **Total Records**: **2,224 real-world consumer complaints**.
- **Features Included**:
  - `Ticket #`: Unique ticket reference identifier.
  - `Customer Complaint`: Raw verbatim complaint text submitted by subscribers.
  - `Date` / `Time`: Incident timestamps.
  - `Received Via`: Filing channel (`Internet`, `Customer Care Call`).
  - `City`, `State`, `Zip Code`: Geographic location data.
  - `Status`: Customer case status (`Solved`, `Closed`, `Open`, `Pending`).

### ⚙️ How the Dataset is Integrated
We created an automated pipeline (`backend/scripts/train_kaggle_dataset.py`) that downloads the latest dataset using `kagglehub`, maps raw complaint texts into 11 standardized telecom domain categories, trains Scikit-Learn ML models, builds a TF-IDF vector RAG index, and seeds all 2,224 records directly into `complaints.db`.

---

## ⚡ How the Site Works (End-to-End Flow)

```
[Subscriber Complaint / Chat Message]
                  │
                  ▼
   1. 🎯 Scikit-Learn Domain Classifier (11 Categories)
                  │
                  ▼
   2. 🧠 VADER Sentiment & Polarity Analyzer (Angry/Negative/Neutral/Positive)
                  │
                  ▼
   3. 🚨 Priority & Escalation Risk Scorer (Calculates Risk % & Target SLA)
                  │
                  ▼
   4. 🔍 Vector RAG Cosine Similarity (Searches across 2,224 Kaggle Dataset Vectors)
                  │
                  ▼
   5. 📖 Technical SOP Grounding (Retrieves Standard Operating Procedures from telecom_kb.json)
                  │
                  ▼
   6. 🚀 Groq LLM Resolution Generator (Synthesizes Subscriber Response & Technical Action Plan)
                  │
                  ▼
   7. 🗄️ Database & Ticket Persistence (Generates TC-YYYYMMDD-XXXX in SQLite DB)
                  │
                  ▼
   8. 📊 Admin & Agent Synchronization (Appears instantly on Admin Dashboard & Agent Queue)
```

---

## 🧮 Mathematical & Technical Calculations

The backend engine performs 4 core mathematical and statistical calculations for every incoming complaint:

### 1. Text Classification (TF-IDF + Logistic Regression)
Text features are extracted using Term Frequency-Inverse Document Frequency (TF-IDF) with n-gram range `(1, 2)` across 8,000 maximum features:
$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \log\left(\frac{|D|}{1 + |\{d \in D : t \in d\}|}\right)$$
The feature vector is passed to a balanced Multi-Class Logistic Regression model to output category probability distributions across 11 telecom domains.

### 2. Sentiment Intensity & Polarity Scoring (VADER)
Calculates valence scores for individual words to produce a normalized compound sentiment score $S_{\text{vader}} \in [-1.0, +1.0]$:
- $S_{\text{vader}} \le -0.5 \implies \text{Angry}$
- $-0.5 < S_{\text{vader}} \le -0.1 \implies \text{Negative}$
- $-0.1 < S_{\text{vader}} < +0.1 \implies \text{Neutral}$
- $S_{\text{vader}} \ge +0.1 \implies \text{Positive}$

### 3. Priority & Escalation Risk Score Formula
The system computes a multi-factor risk percentage $R \in [10\%, 99\%]$:
$$R = \left( 0.50 \times W_{\text{category}} \right) + \left( 0.30 \times |S_{\text{vader}}| \right) + \left( 0.20 \times U_{\text{keyword}} \right)$$
- If $R \ge 65\% \implies$ Flagged as **`HIGH Priority`** with **2-6 hour SLA target**.
- If $R < 65\% \implies$ Assigned as **`MEDIUM / LOW Priority`** with **12-24 hour SLA target**.

### 4. Vector RAG Cosine Similarity Match
Determines top-3 historical ticket matches from the 2,224 Kaggle dataset vectors using cosine similarity:
$$\text{Cosine Similarity}(\mathbf{A}, \mathbf{B}) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$

---

## 📈 Model Performance & Rigorous ML Validation Audit

We conducted a complete, rigorous **Machine Learning Validation Audit** on the 2,224 Kaggle dataset records using a **Stratified 70% Train / 15% Validation / 15% Test** split.

### 🔍 Provenance of the 95.64% (~96%) Metric
- **Full Dataset Training Fit**: The **95.64% (~96%)** metric initially reported was evaluated across the entire 2,224 dataset during full model fitting.
- **Out-of-Sample Test Set Accuracy**: When trained **strictly on the 70% Training Split (1,556 samples)** and evaluated on the **completely unseen 15% Test Split (334 samples)**, the model achieves **88.62% Test Accuracy** and **88.13% Weighted F1-Score**.

### 🧪 Out-of-Sample Test Set Metrics (Unseen 15% Split — 334 Samples)

| Category | Precision | Recall | F1-Score | Test Support |
| :--- | :---: | :---: | :---: | :---: |
| **Billing Dispute** | 0.9383 | 0.7835 | 0.8539 | 97 |
| **Broadband Performance** | 0.8919 | 0.8684 | 0.8800 | 38 |
| **Call Drops** | 0.6667 | 1.0000 | 0.8000 | 4 |
| **Cancellation** | 1.0000 | 1.0000 | **1.0000** | 3 |
| **Customer Service** | 0.8182 | 0.9000 | 0.8571 | 10 |
| **Data / Usage Issue** | 0.9722 | 1.0000 | **0.9859** | 35 |
| **Equipment / Router** | 0.0000 | 0.0000 | 0.0000 | 1 |
| **Installation** | 0.0000 | 0.0000 | 0.0000 | 2 |
| **Network Connectivity** | 1.0000 | 1.0000 | **1.0000** | 1 |
| **Service Outage** | 0.7778 | 0.7778 | 0.7778 | 9 |
| **Service Request** | 0.8533 | 0.9552 | 0.9014 | 134 |
| **OVERALL UNSEEN TEST METRIC** | **0.8836** | **0.8862** | **0.8813** | **334** |

---

## 🌟 Key Platform Modules & Portals

### 1. 🌐 Subscriber Portal (`Landing.jsx` & `ComplaintForm.jsx`)
- Interactive complaint submission form with real-time quick presets.
- Embedded Side AI Chatbot with **Real SQLite Ticket Lookup** (`TC-XXXXX`).

### 2. 📊 Admin Dashboard (`AdminDashboard.jsx`)
- Displays overall system metrics, category distributions, priority breakdowns, and resolution rates.
- Search, filter, and paginate across all **2,224 dataset complaints** live from SQLite DB.

### 3. 🛠️ Support Agent Queue (`AgentModule.jsx` & `AgentResolutions.jsx`)
- Allows support officers to review AI-generated resolutions, adjust priority levels, and mark complaints as resolved.

---

## 🔑 Authentication & Demo Access

TelecomIQ features frictionless single-click demo access for evaluators:
- **Sign-In**: Enter **ANY email** and **ANY password**.
  - Email contains `admin` (e.g. `admin@telecomiq.com` or `admin@gmail.com`) $\implies$ Grants **Admin Dashboard Access**.
  - Email contains `agent` (e.g. `agent@telecomiq.com`) $\implies$ Grants **Support Agent Queue Access**.
  - Any other email $\implies$ Grants **Subscriber Access**.

---

## ⚡ Setup & Local Execution Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies:
pip install -r requirements.txt
pip install kagglehub pandas scikit-learn

# Run Kaggle Dataset Download, ML Training & DB Seeding:
python scripts/train_kaggle_dataset.py

# Start FastAPI backend server:
python start_backend.py
```
Backend API runs at: `http://localhost:8000` (Swagger Docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Portal runs at: `http://localhost:5173`.

---

## 👨‍💻 Author & Engineering Credits

- **Developer**: **Yashraj Gupta**
- **Role**: Software Engineer | AI & ML Enthusiast | Competitive Programmer
- **LinkedIn**: [https://www.linkedin.com/in/yash-raj-gupta001/](https://www.linkedin.com/in/yash-raj-gupta001/)
- **GitHub**: [https://github.com/Yash1889](https://github.com/Yash1889)

---

## 📄 License
This project is built for the **Cognizant NPN AI & Analytics evaluation** under the MIT License.