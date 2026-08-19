import os
import pickle
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "classifier_model.pkl")

# Canonical TelecomIQ Categories
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
    "Customer Service",
    "Other"
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

def fallback_keyword_classify(text: str) -> tuple[str, float]:
    """
    Keyword-based heuristic classification fallback.
    Returns (category, confidence_float).
    """
    text_lower = text.lower()

    if any(w in text_lower for w in ["outage", "blackout", "down across", "no service anywhere", "no network service"]):
        return "Service Outage", 88.0
    if any(w in text_lower for w in ["call drop", "volte", "call cut", "dropped call", "audio drop", "calls keep dropping", "dropping"]):
        return "Call Drops", 86.0
    if any(w in text_lower for w in ["broadband", "fiber", "ont", "slow internet", "ping", "latency", "wifi disconnect"]):
        return "Broadband Performance", 85.0
    if any(w in text_lower for w in ["bill", "charge", "charged", "refund", "vas", "deposit", "invoice", "overcharge", "double charge"]):
        return "Billing Dispute", 90.0
    if any(w in text_lower for w in ["signal", "network bar", "sim card", "5g", "4g", "coverage"]):
        return "Network Connectivity", 84.0
    if any(w in text_lower for w in ["fup", "data quota", "speed throttled", "roaming data", "mb", "gb"]):
        return "Data / Usage Issue", 82.0
    if any(w in text_lower for w in ["installation", "technician", "setup", "appointment"]):
        return "Installation", 80.0
    if any(w in text_lower for w in ["router", "modem", "pon", "hardware", "cables"]):
        return "Equipment / Router", 83.0
    if any(w in text_lower for w in ["upgrade", "relocation", "static ip", "shift", "plan change"]):
        return "Service Request", 78.0
    if any(w in text_lower for w in ["port out", "mnp", "upc", "cancel", "terminate", "discontinue"]):
        return "Cancellation", 87.0
    if any(w in text_lower for w in ["agent", "representative", "support", "callback", "rude", "behavior"]):
        return "Customer Service", 80.0

    return "Other", 60.0

async def classify_complaint(text: str) -> dict:
    """
    Classify complaint text into canonical telecom category with genuine confidence.
    Returns dict with 'category' (str) and 'confidence' (float 0-100).
    """
    if not text or not text.strip():
        return {"category": "Other", "confidence": 0.0}

    # First check keyword heuristic for strong domain signal
    kw_category, kw_confidence = fallback_keyword_classify(text)

    # Local Trained ML Classifier Model (TF-IDF + LogisticRegression)
    model = get_classifier_model()
    if model:
        try:
            probs = model.predict_proba([text])[0]
            best_idx = int(np.argmax(probs))
            pred_category = str(model.classes_[best_idx])
            ml_confidence = float(probs[best_idx] * 100.0)

            # Map predicted category to canonical name
            if pred_category not in TELECOM_CATEGORIES:
                if "Billing" in pred_category: pred_category = "Billing Dispute"
                elif "Outage" in pred_category: pred_category = "Service Outage"
                elif "Broadband" in pred_category or "Internet" in pred_category: pred_category = "Broadband Performance"
                elif "Call" in pred_category: pred_category = "Call Drops"
                elif "Equipment" in pred_category or "Router" in pred_category: pred_category = "Equipment / Router"
                elif "Installation" in pred_category: pred_category = "Installation"
                elif "Data" in pred_category: pred_category = "Data / Usage Issue"
                elif "Cancel" in pred_category: pred_category = "Cancellation"
                elif "Request" in pred_category: pred_category = "Service Request"
                else: pred_category = "Network Connectivity"

            # If ML model has high confidence (>= 40%), use ML prediction
            if ml_confidence >= 40.0:
                return {
                    "category": pred_category,
                    "confidence": round(ml_confidence, 1)
                }
            # Otherwise, if keyword heuristic matches a specific category (not Other), prefer keyword category
            elif kw_category != "Other":
                return {
                    "category": kw_category,
                    "confidence": round(kw_confidence, 1)
                }
            else:
                return {
                    "category": pred_category,
                    "confidence": round(ml_confidence, 1)
                }
        except Exception as e:
            print(f"⚠️ ML Prediction Error: {e}")

    return {
        "category": kw_category,
        "confidence": round(kw_confidence, 1)
    }
