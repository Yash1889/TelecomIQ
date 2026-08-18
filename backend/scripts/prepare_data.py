import os
import sys
import json
import random
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

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

CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Chandigarh"]
STATES = ["Maharashtra", "Delhi", "Karnataka", "Telangana", "Tamil Nadu", "West Bengal", "Maharashtra", "Gujarat", "Rajasthan", "Punjab"]

TEMPLATE_COMPLAINTS = {
    "Network Connectivity": [
        ("No network coverage in my area", "I have zero mobile signal since morning in my apartment. Emergency calls only showing on screen. Please fix this cellular network issue immediately.", "High", "Angry"),
        ("Frequent loss of 4G/5G connection", "My phone continuously drops from 5G to 2G every 10 minutes. Network bar completely disappears in office building.", "High", "Negative"),
        ("Poor signal strength indoors", "Signal is extremely weak inside my home. Cannot make any voice calls or use mobile internet unless I step outside.", "Medium", "Negative"),
        ("Network signal keeps dropping repeatedly", "Every time I travel through the electronic city corridor, signal completely dies for 15 minutes. Very unreliable network.", "High", "Angry"),
        ("SIM card showing no service", "My SIM suddenly stopped catching network signal. Checked on another phone, still says No Service.", "High", "Angry")
    ],
    "Broadband Performance": [
        ("Very slow fiber broadband speed", "Subscribed to 300 Mbps fiber plan but getting only 5 Mbps download speed. Speed test ping is over 250ms. Extremely slow.", "High", "Angry"),
        ("Frequent internet disconnects every hour", "Broadband connection disconnects every 30 minutes while working from home. PON light on fiber ONT blinks red.", "High", "Angry"),
        ("High latency and packet loss while working", "Experiencing 40% packet loss and high latency. Video calls on Zoom and Teams keep freezing constantly.", "High", "Negative"),
        ("Broadband speed throttling during peak hours", "Every evening between 7 PM and 11 PM speed drops below 2 Mbps. This is unacceptable service quality.", "Medium", "Frustrated"),
        ("Fiber optical cable line signal unstable", "Fiber link drops repeatedly. Router loses IP address allocation every morning.", "Medium", "Negative")
    ],
    "Call Drops": [
        ("Voice call drops within 30 seconds", "Almost every call drops automatically within 20 to 30 seconds. Unusable voice calling service.", "High", "Angry"),
        ("Call disconnects continuously on VoLTE", "HD voice call quality is pathetic. Audio breaks up and call drops without warning during important business calls.", "High", "Angry"),
        ("One-way audio issue during phone calls", "When people call me, they cannot hear my voice at all while I can hear them clearly. Terrible experience.", "High", "Frustrated"),
        ("Call drops frequently while driving in city", "Call handoff between cell towers fails completely. Every call gets cut when moving between cell sectors.", "Medium", "Negative"),
        ("Unable to make outgoing calls", "Outgoing calls immediately get terminated with call ended error. Incoming calls work fine.", "High", "Angry")
    ],
    "Service Outage": [
        ("Complete fiber optic broadband blackout", "Total internet and landline blackout across our entire apartment complex since 8 AM today. No response from helpline.", "High", "Angry"),
        ("Regional mobile tower power failure outage", "All mobile network connectivity is down in HSR Layout sector 2. Whole neighborhood affected.", "High", "Angry"),
        ("Severe network outage in localized zone", "No broadband or cellular service available since last night heavy storm. Fiber cable seems damaged.", "High", "Angry"),
        ("Complete service outage in operational area", "Total breakdown of voice and data services across post office area. Business is severely impacted.", "High", "Angry")
    ],
    "Billing Dispute": [
        ("Double charge on monthly broadband bill", "I was charged twice ₹1,499 for the current month bill. Money deducted twice from credit card but status shows pending.", "High", "Angry"),
        ("Unauthorized Value Added Service (VAS) charged", "My bill includes ₹299 for international roaming VAS which I never subscribed or activated. Deduct this immediately.", "High", "Angry"),
        ("Security deposit refund not received after cancellation", "Cancelled my connection 45 days ago but ₹2,000 security deposit refund is still pending. Support promised 7 days.", "High", "Angry"),
        ("Incorrect plan billing amount charged", "Subscribed to ₹599 plan but bill generated is ₹1,199. High overcharge without explanation.", "Medium", "Frustrated"),
        ("Auto-debit failure penalty wrongly applied", "Bank auto-debit succeeded on time but your system marked late payment fee ₹250. Please reverse penalty.", "Medium", "Negative")
    ],
    "Data / Usage Issue": [
        ("Daily FUP data quota exhausted instantly", "My 2GB daily data limit got exhausted at 10 AM without heavy usage. Metering system is inaccurate.", "Medium", "Frustrated"),
        ("Data speed throttled to 64 Kbps incorrectly", "High speed data quota shows 50% balance in app but speed is throttled to unusable 64 Kbps.", "High", "Negative"),
        ("International roaming data pack not working", "Purchased 5GB roaming data pack for international travel but roaming data is not activating.", "High", "Angry"),
        ("Data balance deducted without internet usage", "500MB data debited automatically overnight while mobile data switch was off. Please audit usage logs.", "Medium", "Negative")
    ],
    "Installation": [
        ("Delayed fiber installation appointment", "Fiber installation was scheduled for yesterday 2 PM. Technician did not turn up and phone is switched off.", "High", "Angry"),
        ("Pending broadband connection setup over 5 days", "Applied for new fiber connection 5 days ago. Payment completed but technician installation pending.", "Medium", "Frustrated"),
        ("Work order pending port availability issue", "Feeder box installation pending due to lack of spare fiber port. Need resolution.", "Medium", "Negative")
    ],
    "Equipment / Router": [
        ("Faulty router Wi-Fi red light issue", "Router optical PON light turns solid red. No internet access on any Wi-Fi device.", "High", "Angry"),
        ("Modem overheating and rebooting automatically", "Provided Wi-Fi router gets burning hot within 10 minutes and reboots continuously.", "High", "Negative"),
        ("Wi-Fi range very weak and dropping", "Wi-Fi signal cuts out 5 meters away from router. Need dual-band router replacement.", "Medium", "Negative")
    ],
    "Service Request": [
        ("Request to shift broadband to new address", "Moving to new apartment next week. Need connection relocation feasible check and schedule.", "Low", "Neutral"),
        ("Plan upgrade request to Gigabit speed", "Want to upgrade existing 100 Mbps plan to 1 Gbps fiber plan. Please share pricing and process.", "Low", "Positive"),
        ("Request static IP allocation for home server", "Need static IPv4 address for remote access setup on my connection.", "Low", "Neutral")
    ],
    "Cancellation": [
        ("Requesting MNP UPC port out code due to poor network", "Tired of frequent call drops and zero coverage. Want to port out my number to another operator immediately.", "High", "Angry"),
        ("Cancel broadband subscription connection", "Subscribed to another provider due to continuous outages. Please disconnect line and refund deposit.", "High", "Angry"),
        ("Terminate account service immediately", "Unsatisfied with customer service and frequent billing errors. Terminate my plan today.", "High", "Angry")
    ],
    "Customer Service": [
        ("Rude customer care support agent behavior", "Customer service agent hung up the call on me while explaining my broadband issue. Worst support ever.", "High", "Angry"),
        ("No resolution provided despite 5 calls", "Called customer care 5 times in 3 days. Promises callback every time but nobody calls back.", "High", "Angry"),
        ("Misleading information given by call center", "Support executive promised bill adjustment within 24 hours but ticket was closed without action.", "High", "Angry")
    ]
}

def generate_telecom_dataset(num_records=2200):
    print(f"📦 Generating {num_records} realistic telecom complaint records...")
    records = []
    
    start_date = datetime.now() - timedelta(days=180)
    
    for i in range(1, num_records + 1):
        cat = random.choice(CATEGORIES)
        subj, desc, base_priority, base_sentiment = random.choice(TEMPLATE_COMPLAINTS[cat])
        
        # Add slight variations to description for realism
        ticket_id = f"TC-{random.randint(10000, 99999)}"
        name = f"Customer_{i}"
        email = f"user_{i}@telecom-domain.com"
        
        city_idx = random.randint(0, len(CITIES) - 1)
        city = CITIES[city_idx]
        state = STATES[city_idx]
        
        created_dt = start_date + timedelta(minutes=random.randint(0, 180 * 24 * 60))
        status = random.choice(["Solved", "Closed", "Pending", "Open"])
        channel = random.choice(["Mobile App", "Web Portal", "Customer Care Call", "Email", "Branch Store"])
        
        records.append({
            "ticket_id": ticket_id,
            "name": name,
            "email": email,
            "subject": subj,
            "description": f"{desc} (Location: {city}, Account #{random.randint(100000, 999999)})",
            "category": cat,
            "priority": base_priority,
            "sentiment": base_sentiment,
            "status": status,
            "city": city,
            "state": state,
            "channel": channel,
            "created_at": created_dt.strftime("%Y-%m-%d %H:%M:%S")
        })
        
    df = pd.DataFrame(records)
    csv_path = os.path.join(DATA_DIR, "telecom_complaints.csv")
    df.to_csv(csv_path, index=False)
    print(f"✅ Saved CSV dataset to {csv_path} ({len(df)} rows)")
    return df

def train_ml_models(df):
    print("🧠 Training Scikit-Learn TF-IDF + Logistic Regression Classifier...")
    df['full_text'] = df['subject'] + " " + df['description']
    
    # 1. Classification Pipeline
    classifier_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, stop_words='english')),
        ('clf', LogisticRegression(max_iter=1000, class_weight='balanced'))
    ])
    
    X = df['full_text']
    y_cat = df['category']
    
    classifier_pipeline.fit(X, y_cat)
    cat_preds = classifier_pipeline.predict(X)
    print("Category Classification Train Metrics:")
    print(classification_report(y_cat, cat_preds))
    
    with open(os.path.join(MODELS_DIR, "classifier_model.pkl"), "wb") as f:
        pickle.dump(classifier_pipeline, f)
        
    # 2. Vector Indexing for RAG / Historical Retrieval
    print("🔍 Building Vector Embeddings Index for Semantic Complaint Matching...")
    tfidf_vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
    vector_matrix = tfidf_vectorizer.fit_transform(df['full_text'])
    
    vector_store = {
        "vectorizer": tfidf_vectorizer,
        "matrix": vector_matrix,
        "complaints": df.to_dict(orient="records")
    }
    
    with open(os.path.join(MODELS_DIR, "vector_index.pkl"), "wb") as f:
        pickle.dump(vector_store, f)
        
    print("✅ ML Models and Vector Search Index successfully saved to models/")

def seed_database(df):
    print("🗄️ Seeding SQLite Database with Historical Complaints...")
    from app.db.database import engine, SessionLocal, run_migrations
    from app.db.models import Base, Complaint
    import json
    
    Base.metadata.create_all(bind=engine)
    run_migrations()
    db = SessionLocal()
    
    try:
        # Check current count
        existing_count = db.query(Complaint).count()
        if existing_count > 100:
            print(f"ℹ️ Database already has {existing_count} complaints. Skipping full seed to avoid duplicate bloat.")
            return
            
        complaint_objects = []
        # Seed top 250 records into DB for fast operations
        sample_df = df.head(250)
        for _, row in sample_df.iterrows():
            steps_json = json.dumps([
                {"step": "Classification", "status": f"Categorized as {row['category']}"},
                {"step": "Vector Retrieval", "status": "Indexed in historical database"},
                {"step": "Priority Calculation", "status": f"Severity marked as {row['priority']}"}
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
                sentiment_score=-0.7 if row['sentiment'] in ['Angry', 'Negative'] else 0.5,
                response=f"Dear Customer, we have logged your {row['category']} report. Our technical team is investigating.",
                solution=f"Perform diagnostics for {row['category']}. Verify line signal and reset profile.",
                satisfaction_prediction="Medium",
                action="Technical Diagnostic & Dispatch",
                similar_complaints="Top matching historical tickets identified",
                ai_analysis_steps=steps_json,
                is_resolved=(row['status'] in ['Solved', 'Closed'])
            )
            complaint_objects.append(c)
            
        db.add_all(complaint_objects)
        db.commit()
        print(f"✅ Successfully seeded database with {len(complaint_objects)} historical telecom complaints!")
    except Exception as e:
        db.rollback()
        print(f"❌ Database seed error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    df = generate_telecom_dataset(2200)
    train_ml_models(df)
    seed_database(df)
    print("🎉 Telecom Data & ML Pipeline setup complete!")
