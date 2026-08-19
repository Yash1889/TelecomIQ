import os
import json
import pandas as pd
from app.db.database import engine, SessionLocal
from app.db.models import Complaint

def ensure_db_seeded():
    """Ensure SQLite database is populated with 2,224 Kaggle dataset records on fresh deployment boot."""
    db = SessionLocal()
    try:
        count = db.query(Complaint).count()
        if count > 0:
            print(f"[db] Database check passed: {count} complaints present in database.")
            return

        print("[db] Empty database detected. Seeding 2,224 Kaggle dataset records from local CSV...")
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_path = os.path.join(base_dir, "data", "telecom_complaints.csv")

        if not os.path.exists(csv_path):
            print(f"[db] WARNING: Dataset file not found at {csv_path}. Skipping auto-seed.")
            return

        df = pd.read_csv(csv_path)
        complaint_objects = []
        for _, row in df.iterrows():
            steps_json = json.dumps([
                {"step": "Classification", "status": f"Categorized as {row.get('category')}"},
                {"step": "Vector Retrieval", "status": "Indexed from Kaggle Telecom Dataset"},
                {"step": "Priority Scorer", "status": f"Severity marked as {row.get('priority')}"}
            ])

            c = Complaint(
                ticket_id=str(row.get('ticket_id', '')),
                name=str(row.get('name', 'Customer')),
                email=str(row.get('email', 'subscriber@telecom-domain.com')),
                subject=str(row.get('subject', '')),
                description=str(row.get('description', '')),
                complaint_text=str(row.get('description', '')),
                category=str(row.get('category', 'Service Request')),
                priority=str(row.get('priority', 'Medium')),
                sentiment=str(row.get('sentiment', 'Neutral')),
                sentiment_score=-0.8 if str(row.get('sentiment')) in ['Angry', 'Negative'] else 0.4,
                response=f"Dear Customer, we have logged your {row.get('category')} report ({row.get('ticket_id')}). Technical engineering team is investigating.",
                solution=f"Perform line signal & exchange diagnostic for {row.get('category')}. Verify subscriber ONT/tower sector.",
                satisfaction_prediction="High" if str(row.get('status')) == "Solved" else "Medium",
                action="Technical Diagnostic & Field Dispatch",
                similar_complaints="Top matching historical tickets identified from Kaggle dataset",
                ai_analysis_steps=steps_json,
                is_resolved=(str(row.get('status')) in ['Solved', 'Closed'])
            )
            complaint_objects.append(c)

        db.add_all(complaint_objects)
        db.commit()
        print(f"[db] ✅ Successfully auto-seeded {len(complaint_objects)} Kaggle complaint records into database.")
    except Exception as e:
        db.rollback()
        print(f"[db] ❌ Error auto-seeding database: {e}")
    finally:
        db.close()
