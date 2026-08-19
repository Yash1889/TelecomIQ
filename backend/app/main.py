from fastapi import FastAPI, Request
import os

from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.db.database import engine, run_migrations
from app.db import models
from app.db.seed import ensure_db_seeded
from app.api.routes import router as complaint_router
from app.api.chat import router as chat_router
from app.routes.feedback import router as feedback_router
from app.routes.auth import router as auth_router
from app.routes.agent_module import router as agent_router

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Run custom migrations (add missing columns)
run_migrations()

# Ensure database is seeded with Kaggle complaints on startup if empty
ensure_db_seeded()

app = FastAPI(title="TelecomIQ Engine - Telecom Complaint Intelligence & Resolution Assistant")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"❌ VALIDATION ERROR: {exc.errors()}")
    print(f"📋 REQUEST BODY: {exc.body}")
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"detail": exc.errors(), "body": exc.body}),
    )

IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production" or bool(os.getenv("RENDER"))

# Origins allowed
ALLOWED_ORIGINS = [
    "https://riteshkr.online",
    "http://riteshkr.online",
    "https://www.riteshkr.online",
    "http://www.riteshkr.online",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# Append custom environment origin URLs
extra_origins = os.getenv("FRONTEND_URL", "") + "," + os.getenv("APP_URL", "")
for origin in extra_origins.split(","):
    cleaned = origin.strip().rstrip("/")
    if cleaned and cleaned not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(cleaned)

ALLOWED_ORIGINS = list(dict.fromkeys(o for o in ALLOWED_ORIGINS if o != "*"))

# Allow all HTTPS origins via regex to support Render, Vercel, Railway, and Netlify deployments
ALLOWED_ORIGIN_REGEX = r"https://.*"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
    max_age=86400,
)

@app.middleware("http")
async def cross_origin_isolation_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
    response.headers.setdefault("Cross-Origin-Resource-Policy", "cross-origin")
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    return response

app.include_router(complaint_router)
app.include_router(chat_router)
app.include_router(feedback_router)
app.include_router(auth_router)
app.include_router(agent_router)

@app.get("/")
def root():
    return {
        "status": "TelecomIQ Backend Running",
        "system": "Telecom Complaint Intelligence & Resolution Platform",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    """Production health check endpoint for platform monitoring & load balancers"""
    db_status = "connected"
    complaint_count = 0
    try:
        from app.db.database import SessionLocal
        db = SessionLocal()
        complaint_count = db.query(models.Complaint).count()
        db.close()
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "service": "TelecomIQ Production Engine",
        "database": db_status,
        "records_count": complaint_count,
        "environment": "render" if os.getenv("RENDER") else "local"
    }
