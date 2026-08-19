#!/usr/bin/env python
"""Start backend server properly for production and local environments"""
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

# Render & cloud platforms use 0.0.0.0 and a provided $PORT
host = os.getenv("HOST", "0.0.0.0")
port = os.getenv("PORT", "8000")

print(f"🚀 Starting TelecomIQ Backend Server on {host}:{port}...")
subprocess.run([sys.executable, "-m", "uvicorn", "app.main:app", "--host", host, "--port", port])
