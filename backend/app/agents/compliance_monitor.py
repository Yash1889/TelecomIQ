"""
Compliance & Privacy Monitoring Agent — TelecomIQ
Detects PII and compliance/security risks in complaint or transcript text.

Capabilities:
  1. PII Detection & Masking
     - Phone numbers, email addresses, payment/card-like numbers,
       IP addresses, account/ticket IDs
  2. Compliance Risk Detection
     - Abusive / threatening language
     - Fraud & scam indicators
     - Account verification bypass attempts
     - Unauthorized account access requests
  3. Structured output with risk level and recommended action

Design principles:
  - Pure regex + keyword matching — zero extra dependencies
  - Deterministic and fully explainable (every flag has a cited reason)
  - Never raises an exception that would break the main pipeline
  - Masking replaces sensitive values in a copy of the text; the original
    is never mutated
"""

import re
from typing import Dict, List, Tuple

# ─────────────────────────────────────────────────────────────────────────────
# PII Patterns
# Each entry: (pii_type_label, compiled_regex, mask_replacement)
# ─────────────────────────────────────────────────────────────────────────────

_PII_PATTERNS: List[Tuple[str, re.Pattern, str]] = [
    # Phone numbers — Indian (10-digit) and international (+country-code variants)
    (
        "PHONE_NUMBER",
        re.compile(
            r"(?<!\w)(?:\+?\d[\d\s\-().]{7,14}\d)(?!\w)",
            re.IGNORECASE,
        ),
        "[PHONE_REDACTED]",
    ),
    # Email addresses
    (
        "EMAIL_ADDRESS",
        re.compile(
            r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",
            re.IGNORECASE,
        ),
        "[EMAIL_REDACTED]",
    ),
    # Credit / debit card numbers — 13-19 digit sequences with optional spaces/dashes
    (
        "PAYMENT_CARD_NUMBER",
        re.compile(
            r"\b(?:\d[ \-]?){13,19}\b",
            re.IGNORECASE,
        ),
        "[CARD_REDACTED]",
    ),
    # IP addresses (v4)
    (
        "IP_ADDRESS",
        re.compile(
            r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b"
        ),
        "[IP_REDACTED]",
    ),
    # TelecomIQ ticket IDs  (TC-YYYYMMDD-XXXX style)
    (
        "TICKET_ID",
        re.compile(r"\bTC-\d{6,8}-[A-Z0-9]{2,6}\b"),
        "[TICKET_REDACTED]",
    ),
    # Generic account / customer IDs (e.g. ACC-12345, CID-9876543)
    (
        "ACCOUNT_ID",
        re.compile(r"\b(?:ACC|CID|ACCT|CUST|SUB|ID)[-_]?\d{4,12}\b", re.IGNORECASE),
        "[ACCOUNT_REDACTED]",
    ),
]

# Guard against false-positive card matches on sequences that are clearly
# not card numbers (e.g. "100 Mbps for 3 days" → "1003" — not a card).
_CARD_FALSE_POSITIVE_GUARD = re.compile(
    r"(?:mbps|kbps|gbps|gb|mb|tb|km|rs\.?|₹|\$|%|days?|hours?|mins?|seconds?|"
    r"months?|years?|weeks?)",
    re.IGNORECASE,
)


def _is_likely_card(match_text: str, surrounding: str) -> bool:
    """Heuristic: skip if the number is adjacent to a unit keyword."""
    window = surrounding[max(0, surrounding.find(match_text) - 15):][:40]
    return not bool(_CARD_FALSE_POSITIVE_GUARD.search(window))


# ─────────────────────────────────────────────────────────────────────────────
# Compliance / Policy Risk Keyword Groups
# Each entry: (flag_name, [keywords/phrases], triggered_action)
# ─────────────────────────────────────────────────────────────────────────────

_COMPLIANCE_RISKS = [
    (
        "ABUSIVE_LANGUAGE",
        [
            "idiot", "stupid", "moron", "useless", "pathetic", "incompetent",
            "damn you", "go to hell", "shut up", "bastard", "son of a bitch",
            "i will kill", "get lost", "rubbish service", "trash company",
        ],
        "ESCALATE_TO_SUPERVISOR",
    ),
    (
        "THREATENING_LANGUAGE",
        [
            "i will sue", "will take legal action", "consumer court", "police complaint",
            "dragging you to court", "filing a case", "trai complaint", "fcc complaint",
            "legal notice", "lawyer", "i will destroy", "i know where you are",
            "you will regret", "consequences", "warn you",
        ],
        "FLAG_FOR_LEGAL_REVIEW",
    ),
    (
        "FRAUD_SCAM_INDICATOR",
        [
            "unauthorized charge", "fraudulent transaction", "scam", "i was scammed",
            "they stole", "money stolen", "charged without consent",
            "fake invoice", "fake bill", "forged document",
            "phishing", "suspicious link", "malware",
        ],
        "FLAG_FOR_FRAUD_TEAM",
    ),
    (
        "ACCOUNT_BYPASS_ATTEMPT",
        [
            "bypass otp", "skip verification", "without verification",
            "bypass security", "skip otp", "disable 2fa", "turn off authentication",
            "override password", "reset without otp", "remove security question",
            "skip two factor", "skip 2fa",
        ],
        "BLOCK_AND_REVIEW",
    ),
    (
        "UNAUTHORIZED_ACCESS_REQUEST",
        [
            "access someone else's account", "access my wife's account",
            "access my husband's account", "access my employee's account",
            "see another person's details", "hack into account",
            "get into account without password", "access without permission",
            "share another customer's data", "give me their information",
            "tell me their address", "other customer details",
            "share their address", "share their billing", "their billing details",
            "without their permission", "access their account",
            "give me access to my employee", "give me access to",
        ],
        "BLOCK_AND_REPORT",
    ),
]

# ─────────────────────────────────────────────────────────────────────────────
# Risk level matrix
# (pii_detected, sensitive_content, policy_violation) → risk_level
# ─────────────────────────────────────────────────────────────────────────────

def _calculate_risk_level(
    pii_detected: bool,
    sensitive_flags: List[str],
    policy_flags: List[str],
) -> str:
    """
    CRITICAL  — unauthorized access / bypass attempt present
    HIGH      — fraud/scam OR threatening language detected
    MEDIUM    — abusive language OR PII detected alongside any flag
    LOW       — PII only, no security/policy flags
    CLEAR     — nothing detected
    """
    flags = sensitive_flags + policy_flags

    if "UNAUTHORIZED_ACCESS_REQUEST" in flags or "ACCOUNT_BYPASS_ATTEMPT" in flags:
        return "CRITICAL"
    if "FRAUD_SCAM_INDICATOR" in flags or "THREATENING_LANGUAGE" in flags:
        return "HIGH"
    if "ABUSIVE_LANGUAGE" in flags:
        return "MEDIUM"
    if pii_detected:
        return "LOW"
    return "CLEAR"


def _pick_compliance_action(
    risk_level: str,
    policy_flags: List[str],
    pii_detected: bool,
) -> str:
    """Choose the most urgent recommended action."""
    if "UNAUTHORIZED_ACCESS_REQUEST" in policy_flags:
        return "BLOCK_AND_REPORT"
    if "ACCOUNT_BYPASS_ATTEMPT" in policy_flags:
        return "BLOCK_AND_REVIEW"

    # Simpler direct mapping
    action_priority = {
        "CRITICAL":  "BLOCK_AND_ESCALATE",
        "HIGH":      "ESCALATE_AND_REVIEW",
        "MEDIUM":    "MASK_AND_REVIEW",
        "LOW":       "MASK_PII",
        "CLEAR":     "NO_ACTION_REQUIRED",
    }
    return action_priority.get(risk_level, "REVIEW")


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

async def run_compliance_check(text: str) -> Dict:
    """
    Run PII detection + compliance risk scan on complaint/transcript text.

    Returns:
    {
        "pii_detected":       True,
        "pii_types":          ["PHONE_NUMBER", "EMAIL_ADDRESS"],
        "pii_count":          2,
        "masked_text":        "My number is [PHONE_REDACTED] ...",
        "sensitive_content":  False,
        "policy_violation":   False,
        "compliance_flags":   [],          # e.g. ["THREATENING_LANGUAGE"]
        "flag_details":       [           # human-readable explanations
            "PHONE_NUMBER: detected 1 instance(s)"
        ],
        "risk_level":         "LOW",
        "compliance_action":  "MASK_PII",
        "recommended_actions": ["Mask phone number before storing or displaying"]
    }
    """
    if not text or not text.strip():
        return _clean_result(text or "")

    masked = text
    pii_types: List[str] = []
    flag_details: List[str] = []

    # ── PII Pass ─────────────────────────────────────────────────────────── #
    for label, pattern, replacement in _PII_PATTERNS:
        matches = pattern.findall(masked)

        # Extra guard for payment card false positives
        if label == "PAYMENT_CARD_NUMBER":
            real_matches = [m for m in matches if _is_likely_card(m, masked)]
            if not real_matches:
                continue
            matches = real_matches

        if matches:
            count = len(matches)
            pii_types.append(label)
            flag_details.append(f"{label}: detected {count} instance(s)")
            masked = pattern.sub(replacement, masked)

    pii_detected = bool(pii_types)

    # ── Compliance / Policy Pass ──────────────────────────────────────────── #
    text_lower = text.lower()
    compliance_flags: List[str] = []
    sensitive_flags: List[str] = []
    policy_flags: List[str] = []

    for flag_name, keywords, action in _COMPLIANCE_RISKS:
        triggered = [kw for kw in keywords if kw in text_lower]
        if triggered:
            compliance_flags.append(flag_name)
            flag_details.append(
                f"{flag_name}: triggered by keyword(s): {', '.join(triggered[:3])}"
            )
            # Categorise
            if flag_name in ("ABUSIVE_LANGUAGE", "FRAUD_SCAM_INDICATOR",
                             "THREATENING_LANGUAGE"):
                sensitive_flags.append(flag_name)
            else:
                policy_flags.append(flag_name)

    sensitive_content = bool(sensitive_flags)
    policy_violation  = bool(policy_flags)

    # ── Risk Level & Action ───────────────────────────────────────────────── #
    risk_level = _calculate_risk_level(pii_detected, sensitive_flags, policy_flags)

    # Build action list by collecting unique actions across triggered risk groups
    action_set: List[str] = []
    for flag_name, _, rec_action in _COMPLIANCE_RISKS:
        if flag_name in compliance_flags and rec_action not in action_set:
            action_set.append(rec_action)
    if pii_detected and "MASK_PII" not in action_set and not compliance_flags:
        action_set.append("MASK_PII")

    primary_action = _pick_compliance_action(risk_level, policy_flags, pii_detected)

    recommended_actions = _build_recommendations(
        pii_types, compliance_flags, risk_level
    )

    return {
        "pii_detected":        pii_detected,
        "pii_types":           pii_types,
        "pii_count":           len(pii_types),
        "masked_text":         masked,
        "sensitive_content":   sensitive_content,
        "policy_violation":    policy_violation,
        "compliance_flags":    compliance_flags,
        "flag_details":        flag_details,
        "risk_level":          risk_level,
        "compliance_action":   primary_action,
        "recommended_actions": recommended_actions,
    }


def _build_recommendations(
    pii_types: List[str],
    compliance_flags: List[str],
    risk_level: str,
) -> List[str]:
    """Human-readable recommended actions for the compliance report."""
    recs: List[str] = []

    if "PHONE_NUMBER" in pii_types:
        recs.append("Mask phone number before storing or displaying in UI")
    if "EMAIL_ADDRESS" in pii_types:
        recs.append("Mask email address in logs and metadata output")
    if "PAYMENT_CARD_NUMBER" in pii_types:
        recs.append("⚠️  Payment card data detected — apply PCI-DSS masking immediately")
    if "IP_ADDRESS" in pii_types:
        recs.append("Anonymise IP address per privacy policy")
    if "TICKET_ID" in pii_types or "ACCOUNT_ID" in pii_types:
        recs.append("Validate account/ticket ID ownership before processing")

    if "ABUSIVE_LANGUAGE" in compliance_flags:
        recs.append("Route to senior supervisor — abusive language detected")
    if "THREATENING_LANGUAGE" in compliance_flags:
        recs.append("Forward to Legal & Compliance team — threat indicators found")
    if "FRAUD_SCAM_INDICATOR" in compliance_flags:
        recs.append("Escalate to Fraud Prevention team — potential fraud/scam reported")
    if "ACCOUNT_BYPASS_ATTEMPT" in compliance_flags:
        recs.append("Block request — security bypass attempt detected")
    if "UNAUTHORIZED_ACCESS_REQUEST" in compliance_flags:
        recs.append("Block and report — request for unauthorized account access")

    if not recs:
        recs.append("No compliance action required — content is clean")

    return recs


def _clean_result(text: str) -> Dict:
    return {
        "pii_detected":        False,
        "pii_types":           [],
        "pii_count":           0,
        "masked_text":         text,
        "sensitive_content":   False,
        "policy_violation":    False,
        "compliance_flags":    [],
        "flag_details":        [],
        "risk_level":          "CLEAR",
        "compliance_action":   "NO_ACTION_REQUIRED",
        "recommended_actions": ["No compliance action required — content is clean"],
    }
