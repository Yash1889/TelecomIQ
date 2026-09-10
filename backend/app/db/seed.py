import os
import json
import pandas as pd
from app.db.database import engine, SessionLocal, get_ist_time
from app.db.models import Complaint, User
from app.services.auth_service import hash_password

def ensure_db_seeded():
    """Ensure SQLite database is populated with default accounts and Kaggle dataset records."""
    db = SessionLocal()
    try:
        # 1. Seed Default Demo Users if missing
        demo_users = [
            {
                "email": "admin@telecomiq.com",
                "full_name": "TelecomIQ Administrator",
                "phone": "+91 98765 43210",
                "role": "Admin",
                "is_agent": True,
                "password": "admin123"
            },
            {
                "email": "agent@telecomiq.com",
                "full_name": "Rohan Verma (Support Agent)",
                "phone": "+91 98765 12345",
                "role": "Support Agent",
                "is_agent": True,
                "password": "agent123"
            },
            {
                "email": "customer@telecomiq.com",
                "full_name": "Aarav Sharma",
                "phone": "+91 98765 67890",
                "role": "Customer",
                "is_agent": False,
                "password": "customer123"
            }
        ]

        for u in demo_users:
            user_exists = db.query(User).filter(User.email == u["email"]).first()
            if not user_exists:
                new_user = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    phone=u["phone"],
                    role=u["role"],
                    is_agent=u["is_agent"],
                    hashed_password=hash_password(u["password"]),
                    is_active=True,
                    created_at=get_ist_time()
                )
                db.add(new_user)
            elif not user_exists.hashed_password:
                user_exists.hashed_password = hash_password(u["password"])
                user_exists.role = u["role"]
                user_exists.is_agent = u["is_agent"]
        
        db.commit()

        # 2. Seed Kaggle Complaints if empty
        count = db.query(Complaint).count()
        if count > 0:
            print(f"[db] Database check passed: {count} complaints present in database.")
            return

        print("[db] Empty database detected. Seeding Kaggle dataset records from local CSV...")
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_path = os.path.join(base_dir, "data", "telecom_complaints.csv")

        if not os.path.exists(csv_path):
            print(f"[db] WARNING: Dataset file not found at {csv_path}. Skipping auto-seed.")
            return

        df = pd.read_csv(csv_path)
        records = []
        for _, row in df.iterrows():
            sentiment_str = str(row.get('sentiment', 'Neutral'))
            records.append({
                "ticket_id": str(row.get('ticket_id', '')),
                "name": str(row.get('name', 'Customer')),
                "email": str(row.get('email', 'subscriber@telecom-domain.com')),
                "subject": str(row.get('subject', '')),
                "description": str(row.get('description', '')),
                "complaint_text": str(row.get('description', '')),
                "category": str(row.get('category', 'Service Request')),
                "priority": str(row.get('priority', 'Medium')),
                "sentiment": sentiment_str,
                "sentiment_score": -0.8 if sentiment_str in ['Angry', 'Negative'] else 0.4,
                "response": f"Dear Customer, we have logged your {row.get('category')} report ({row.get('ticket_id')}). Technical engineering team is investigating.",
                "solution": f"Perform line signal & exchange diagnostic for {row.get('category')}. Verify subscriber ONT/tower sector.",
                "satisfaction_prediction": "High" if str(row.get('status')) == "Solved" else "Medium",
                "action": "Technical Diagnostic & Field Dispatch",
                "similar_complaints": "Top matching historical tickets identified from Kaggle dataset",
                "ai_analysis_steps": json.dumps([
                    {"step": "Classification", "status": f"Categorized as {row.get('category')}"},
                    {"step": "Vector Retrieval", "status": "Indexed from Kaggle Telecom Dataset"},
                    {"step": "Priority Scorer", "status": f"Severity marked as {row.get('priority')}"}
                ]),
                "is_resolved": str(row.get('status')) in ['Solved', 'Closed']
            })

        db.bulk_insert_mappings(Complaint, records)
        db.commit()
        print(f"[db] ✅ Successfully auto-seeded {len(records)} Kaggle complaint records into database.")
    except Exception as e:
        db.rollback()
        print(f"[db] ❌ Error auto-seeding database: {e}")
    finally:
        db.close()

