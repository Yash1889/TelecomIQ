#!/usr/bin/env python
"""Start backend server properly for production and local environments"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

if os.path.exists(BACKEND_DIR):
    os.chdir(BACKEND_DIR)
    if BACKEND_DIR not in sys.path:
        sys.path.insert(0, BACKEND_DIR)
else:
    if BASE_DIR not in sys.path:
        sys.path.insert(0, BASE_DIR)

host = os.getenv("HOST", "0.0.0.0")
port = int(os.getenv("PORT", "8000"))

print(f"🚀 Starting TelecomIQ Backend Server on {host}:{port}...")
import uvicorn
uvicorn.run("app.main:app", host=host, port=port, proxy_headers=True, forwarded_allow_ips="*")

