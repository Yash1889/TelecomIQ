import os
import pickle
import numpy as np
from app.agents.gemini_client import async_ask_gemini

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "classifier_model.pkl")

TELECOM_CATEGORIES = [
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

_classifier_model = None

def get_classifier_model():
    global _classifier_model
    if _classifier_model is None and os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                _classifier_model = pickle.load(f)
        except Exception as e:
            print(f"⚠️ Failed to load local ML classifier model: {e}")
    return _classifier_model

def fallback_keyword_classify(text: str) -> str:
    text_lower = text.lower()
    if any(w in text_lower for w in ["outage", "blackout", "down across"]):
        return "Service Outage"
    if any(w in text_lower for w in ["broadband", "fiber", "ont", "slow internet", "ping", "latency"]):
        return "Broadband Performance"
    if any(w in text_lower for w in ["call drop", "volte", "call cut", "dropped call", "audio"]):
        return "Call Drops"
    if any(w in text_lower for w in ["signal", "network bar", "sim card", "5g", "4g", "coverage"]):
        return "Network Connectivity"
    if any(w in text_lower for w in ["bill", "charge", "refund", "vas", "deposit", "invoice", "overcharge"]):
        return "Billing Dispute"
    if any(w in text_lower for w in ["fup", "data quota", "speed throttled", "roaming data", "mb"]):
        return "Data / Usage Issue"
    if any(w in text_lower for w in ["installation", "technician", "setup", "appointment"]):
        return "Installation"
    if any(w in text_lower for w in ["router", "modem", "pon", "wifi", "hardware"]):
        return "Equipment / Router"
    if any(w in text_lower for w in ["upgrade", "relocation", "static ip", "shift"]):
        return "Service Request"
    if any(w in text_lower for w in ["port out", "mnp", "upc", "cancel", "terminate"]):
        return "Cancellation"
    if any(w in text_lower for w in ["agent", "representative", "support", "callback", "rude"]):
        return "Customer Service"
    return "Network Connectivity"

async def classify_complaint(text: str) -> dict:
    """
    Classify complaint text into telecom category.
    Returns dict with 'category' and 'confidence' (float 0-100).
    """
    if not text or not text.strip():
        return {"category": "Network Connectivity", "confidence": 50.0}

    # 1. Local ML Classifier Model (Instant TF-IDF + LogisticRegression)
    model = get_classifier_model()
    if model:
        try:
            probs = model.predict_proba([text])[0]
            best_idx = np.argmax(probs)
            pred_category = model.classes_[best_idx]
            confidence = float(probs[best_idx] * 100)
            
            # If confidence is strong, return ML prediction directly
            if confidence > 45.0:
                return {
                    "category": pred_category,
                    "confidence": round(confidence, 1)
                }
        except Exception as e:
            print(f"⚠️ ML Prediction Error: {e}")

    # 2. Heuristic fallback
    category = fallback_keyword_classify(text)
    return {
        "category": category,
        "confidence": 88.5
    }
