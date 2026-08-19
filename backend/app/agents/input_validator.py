"""
Input Validation & Sufficiency Guardrail for TelecomIQ.
Identifies low-information inputs, non-complaints, greetings, and short test messages
to prevent manufactured AI predictions on insufficient user input.
"""

import re

TELECOM_KEYWORDS = [
    "bill", "billing", "charge", "charged", "fee", "refund", "payment", "invoice", "overcharge",
    "outage", "blackout", "down", "slow", "speed", "latency", "ping", "disconnect", "disconnected",
    "disconnection", "fiber", "broadband", "ont", "router", "modem", "wifi", "5g", "4g", "volte",
    "sim", "signal", "coverage", "network", "call", "drop", "dropped", "voice", "audio", "data",
    "limit", "quota", "fup", "cap", "install", "installation", "setup", "technician", "appointment",
    "cancel", "cancellation", "terminate", "port", "mnp", "support", "agent", "service", "problem",
    "issue", "fault", "broken", "working", "line"
]

COMMON_NON_COMPLAINTS = {
    "hello", "hi", "hey", "thanks", "thank you", "okay", "ok", "test", "testing",
    "hi bro", "hello sir", "pls help", "good morning", "good evening", "namaste",
    "what the hell", "admin", "yes", "no", "bye", "goodbye", "fine", "check"
}

def validate_complaint_input(text: str) -> dict:
    """
    Validates input complaint text for analytical sufficiency.
    Returns dict with 'is_sufficient' (bool) and diagnostic guidance if insufficient.
    """
    if not text or not isinstance(text, str):
        return {
            "is_sufficient": False,
            "reason": "Empty or missing complaint text.",
            "guidance": "Please enter a detailed description of your telecom issue."
        }

    clean_text = text.strip()
    words = re.findall(r'\b\w+\b', clean_text.lower())
    word_count = len(words)
    text_lower = clean_text.lower()

    # Direct match on common non-complaints
    if text_lower in COMMON_NON_COMPLAINTS:
        return {
            "is_sufficient": False,
            "reason": f"Input '{clean_text}' is a greeting or casual phrase, not a specific complaint.",
            "guidance": "Please describe your telecom issue (e.g., Broadband disconnects, Billing overcharge, Call drops)."
        }

    # Check keyword presence
    has_telecom_keyword = any(k in text_lower for k in TELECOM_KEYWORDS)

    # Short input without telecom domain context
    if word_count < 3 and not has_telecom_keyword:
        return {
            "is_sufficient": False,
            "reason": "Complaint description is too short and lacks telecom context.",
            "guidance": "Please provide more details regarding your issue, affected service, and duration."
        }

    # Total character length check
    if len(clean_text) < 6 and not has_telecom_keyword:
        return {
            "is_sufficient": False,
            "reason": "Input length is insufficient for analysis.",
            "guidance": "Please provide a complete description of the issue you are experiencing."
        }

    return {
        "is_sufficient": True,
        "reason": "Valid telecom complaint text.",
        "guidance": None
    }
