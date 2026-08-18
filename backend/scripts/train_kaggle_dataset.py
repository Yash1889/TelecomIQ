import os
import sys
import json
import random
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Sklearn imports
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

# Kagglehub download
import kagglehub

# Ensure python path includes backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

CATEGORIES = [
    "Network Connectivity",
    "Broadband Performance",
    "Call Drops",
    "Service Outage",
    "Billing Dispute",
    "Data / Usage Issue",
    "Installation",
    "Equipment / Router",
    "Service Request",
    "Cancellation",
    "Customer Service"
]

def map_complaint_to_category(text: str) -> str:
    t = str(text).lower()
    if any(k in t for k in ["data cap", "usage cap", "data limit", "overage", "fup", "300gb", "data usage", "cap"]):
        return "Data / Usage Issue"
    if any(k in t for k in ["bill", "charge", "fee", "price", "pricing", "payment", "overcharge", "refund", "cost", "money", "debit", "credit"]):
        return "Billing Dispute"
    if any(k in t for k in ["speed", "slow", "throttle", "throttling", "latency", "buffering", "bandwidth", "mbps"]):
        return "Broadband Performance"
    if any(k in t for k in ["outage", "blackout", "down", "no service", "not working", "disconnected", "disconnect", "disconnects"]):
        return "Service Outage"
    if any(k in t for k in ["router", "modem", "hardware", "box", "equipment", "red light"]):
        return "Equipment / Router"
    if any(k in t for k in ["signal", "network", "coverage", "wifi", "5g", "4g", "volte"]):
        return "Network Connectivity"
    if any(k in t for k in ["call drop", "call", "voice", "phone", "audio"]):
        return "Call Drops"
    if any(k in t for k in ["cancel", "cancellation", "disconnect service", "terminate", "port out"]):
        return "Cancellation"
    if any(k in t for k in ["install", "installation", "setup", "technician", "appointment"]):
        return "Installation"
    if any(k in t for k in ["customer service", "agent", "support", "behavior", "helpline", "representative"]):
        return "Customer Service"
    return "Service Request"

def map_sentiment_and_priority(category: str, text: str):
    t = str(text).lower()
    if any(k in t for k in ["horrible", "terrible", "worst", "unacceptable", "scam", "fraud", "illegal", "outage", "down", "refuse"]):
        sentiment = "Angry"
        priority = "High"
    elif any(k in t for k in ["slow", "issue", "problem", "dispute", "caps", "charge", "fail"]):
        sentiment = "Negative"
        priority = "High" if category in ["Service Outage", "Billing Dispute", "Network Connectivity"] else "Medium"
    else:
        sentiment = "Frustrated"
        priority = "Medium"
    return sentiment, priority

def process_kaggle_dataset():
    print("⬇️ Downloading latest dataset via Kagglehub...")
    dataset_path = kagglehub.dataset_download("ravillatejakumar/telecom-complaints-monitoring-system")
    csv_file = os.path.join(dataset_path, "Comcast_telecom_complaints_data.csv")
    
    print(f"📖 Reading raw Kaggle dataset from {csv_file}...")
    raw_df = pd.read_csv(csv_file)
    print(f"Found {len(raw_df)} total customer complaint records.")

    processed_records = []
    start_date = datetime.now() - timedelta(days=180)

    for idx, row in raw_df.iterrows():
        comp_text = str(row.get('Customer Complaint', 'Telecom Service Issue')).strip()
        ticket_raw = str(row.get('Ticket #', f"{idx+100000}"))
        ticket_id = f"TC-{ticket_raw}"
        
        category = map_complaint_to_category(comp_text)
        sentiment, priority = map_sentiment_and_priority(category, comp_text)
        
        city = str(row.get('City', 'Chicago'))
        state = str(row.get('State', 'Illinois'))
        raw_status = str(row.get('Status', 'Solved')).capitalize()
        status = "Solved" if raw_status in ["Solved", "Closed"] else ("Pending" if raw_status == "Pending" else "Open")
        channel = str(row.get('Received Via', 'Web Portal'))
        
        # Build enhanced description
        description = (
            f"Subscriber report regarding {comp_text}. "
            f"Filing Channel: {channel}. Location: {city}, {state}. "
            f"Current Resolution Status: {status}."
        )
        
        created_dt = start_date + timedelta(minutes=random.randint(0, 180 * 24 * 60))

        processed_records.append({
            "ticket_id": ticket_id,
            "name": f"Customer_{ticket_raw}",
            "email": f"subscriber_{ticket_raw}@telecom-domain.com",
            "subject": comp_text,
            "description": description,
            "category": category,
            "priority": priority,
            "sentiment": sentiment,
            "status": status,
            "city": city,
            "state": state,
            "channel": channel,
            "created_at": created_dt.strftime("%Y-%m-%d %H:%M:%S")
        })

    df = pd.DataFrame(processed_records)
    out_csv = os.path.join(DATA_DIR, "telecom_complaints.csv")
    df.to_csv(out_csv, index=False)
    print(f"✅ Processed dataset saved to {out_csv} ({len(df)} records).")
    return df

def train_models(df):
    print("🧠 Training Scikit-Learn TF-IDF + Logistic Regression Classifier on Kaggle Dataset...")
    df['full_text'] = df['subject'] + " " + df['description']
    
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=8000, stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, class_weight='balanced'))
    ])
    
    X = df['full_text']
    y = df['category']
    
    pipeline.fit(X, y)
    preds = pipeline.predict(X)
    print("📊 Model Training Classification Report:")
    print(classification_report(y, preds))
    
    with open(os.path.join(MODELS_DIR, "classifier_model.pkl"), "wb") as f:
        pickle.dump(pipeline, f)
        
    print("🔍 Building Vector Embeddings Store for RAG Complaint Matcher...")
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
    matrix = vectorizer.fit_transform(df['full_text'])
    
    vector_store = {
        "vectorizer": vectorizer,
        "matrix": matrix,
        "complaints": df.to_dict(orient="records")
    }
    
    with open(os.path.join(MODELS_DIR, "vector_index.pkl"), "wb") as f:
        pickle.dump(vector_store, f)
        
    print("✅ Classifier model and Vector Index updated in models/ directory!")

def seed_sqlite_db(df):
    print("🗄️ Seeding SQLite Database with 2,224 Kaggle Complaint Records...")
    from app.db.database import engine, SessionLocal, run_migrations
    from app.db.models import Base, Complaint
    
    Base.metadata.create_all(bind=engine)
    run_migrations()
    db = SessionLocal()
    
    try:
        # Clear existing seeded complaints to ensure exact sync
        db.query(Complaint).delete()
        db.commit()
        
        complaint_objects = []
        for _, row in df.iterrows():
            steps_json = json.dumps([
                {"step": "Classification", "status": f"Categorized as {row['category']}"},
                {"step": "Vector Retrieval", "status": "Indexed from Kaggle Telecom Dataset"},
                {"step": "Priority Scorer", "status": f"Severity marked as {row['priority']}"}
            ])
            
            c = Complaint(
                ticket_id=row['ticket_id'],
                name=row['name'],
                email=row['email'],
                subject=row['subject'],
                description=row['description'],
                complaint_text=row['description'],
                category=row['category'],
                priority=row['priority'],
                sentiment=row['sentiment'],
                sentiment_score=-0.8 if row['sentiment'] in ['Angry', 'Negative'] else 0.4,
                response=f"Dear Customer, we have logged your {row['category']} report ({row['ticket_id']}). Technical engineering team is investigating.",
                solution=f"Perform line signal & exchange diagnostic for {row['category']}. Verify subscriber ONT/tower sector.",
                satisfaction_prediction="High" if row['status'] == "Solved" else "Medium",
                action="Technical Diagnostic & Field Dispatch",
                similar_complaints="Top matching historical tickets identified from Kaggle dataset",
                ai_analysis_steps=steps_json,
                is_resolved=(row['status'] in ['Solved', 'Closed'])
            )
            complaint_objects.append(c)
            
        db.add_all(complaint_objects)
        db.commit()
        print(f"✅ Successfully seeded SQLite database with all {len(complaint_objects)} Kaggle complaint records!")
    except Exception as e:
        db.rollback()
        print(f"❌ Database seed error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    df = process_kaggle_dataset()
    train_models(df)
    seed_sqlite_db(df)
    print("🎉 Kaggle Telecom Dataset Training & Database Seeding Completed Successfully!")
