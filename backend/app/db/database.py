import os
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

def get_ist_time():
    """Helper to get current time in IST (UTC+5:30)"""
    return datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)


# Database URL resolution (SQLite for Local and Vercel /tmp)
DATABASE_URL = os.getenv("DATABASE_URL") or ""

if not DATABASE_URL or not DATABASE_URL.startswith("sqlite"):
    # On Vercel / serverless platforms, current directory is read-only. Use /tmp
    if os.getenv("VERCEL") or not os.access(".", os.W_OK):
        DATABASE_URL = "sqlite:////tmp/complaints.db"
    else:
        DATABASE_URL = "sqlite:///complaints.db"

# Create SQLite engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

print(f"[db] Database initialized: {DATABASE_URL}")

# ✅ Session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ✅ Base
Base = declarative_base()

# ✅ Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations():
    """Add missing columns to existing tables if they don't exist"""
    from sqlalchemy import text
    
    with engine.connect() as conn:
        # Migration for 'users' table
        user_columns = [
            ("bio", "TEXT"),
            ("role", "VARCHAR(100) DEFAULT 'Strategic Member'"),
            ("location", "VARCHAR(100) DEFAULT 'India'"),
            ("is_agent", "BOOLEAN DEFAULT FALSE")
        ]
        for col_name, col_type in user_columns:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                conn.rollback()

        # Migration for 'complaints' table
        complaint_columns = [
            ("ai_analysis_steps", "TEXT"),
            ("user_rating", "INTEGER"),
            ("user_feedback", "TEXT"),
            ("subject", "VARCHAR(255)"),
            ("description", "TEXT"),
            ("user_resolution_feedback", "BOOLEAN"),
            ("user_resolution_comment", "TEXT"),
            ("sentiment_score", "FLOAT DEFAULT 0"),
            ("escalation_risk_score", "FLOAT DEFAULT 0"),
            ("escalation_required", "BOOLEAN DEFAULT FALSE"),
            ("confidence_score", "FLOAT DEFAULT 90")
        ]
        for col_name, col_type in complaint_columns:
            try:
                conn.execute(text(f"ALTER TABLE complaints ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                conn.rollback()

        # Migration for 'agent_resolutions' table
        agent_res_columns = [
            ("steps", "TEXT")
        ]
        for col_name, col_type in agent_res_columns:
            try:
                conn.execute(text(f"ALTER TABLE agent_resolutions ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                conn.rollback()

        # ✅ Ensure complaint_text is nullable for legacy compatibility
        try:
            conn.execute(text("ALTER TABLE complaints ALTER COLUMN complaint_text DROP NOT NULL"))
            conn.commit()
        except Exception:
            try:
                # SQLite doesn't support ALTER COLUMN DROP NOT NULL, skip it there
                conn.rollback()
            except: pass
        
        # ✅ Manual fallback if Postgres/MySQL fails
        admin_email = "admin@telecomiq.com"
        try:
            conn.execute(
                text("UPDATE users SET role = 'Admin', full_name = 'TelecomIQ Admin' WHERE email = :email"),
                {"email": admin_email}
            )
            conn.commit()
            print(f"👑 Admin role verified for: {admin_email}")
        except Exception as e:
            conn.rollback() # 🔄 Rollback here too
            print(f"⚠️ Could not set auto-admin: {e}")
