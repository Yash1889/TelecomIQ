"""
Multi-factor Telecom Priority & Escalation Engine.
Evaluates category severity, sentiment intensity, repeated complaint keywords,
outage indicators, and SLA risk to produce explainable priority levels and escalation scores.
"""

def calculate_telecom_priority_and_escalation(category: str, sentiment: str, text: str, is_sufficient: bool = True) -> dict:
    """
    Multi-factor telecom severity, priority & escalation risk calculator.
    Outputs:
    - priority: CRITICAL, HIGH, MEDIUM, LOW
    - priority_label: P1 - CRITICAL, P2 - HIGH, P3 - MEDIUM, P4 - LOW
    - escalation_required: bool
    - escalation_risk_score: float (0 to 100)
    - escalation_reasons: list of strings
    """
    if not is_sufficient:
        return {
            "priority": "LOW",
            "priority_label": "P4 - LOW",
            "escalation_required": False,
            "escalation_risk_score": 0.0,
            "escalation_reasons": ["Insufficient complaint information to calculate escalation risk."]
        }

    text_lower = text.lower()
    risk_score = 5.0
    reasons = []

    # 1. Category Impact Factor
    if category in ["Service Outage", "Cancellation"]:
        risk_score += 35.0
        reasons.append(f"High-impact category: '{category}' directly affects service continuity or customer retention.")
    elif category in ["Network Connectivity", "Broadband Performance", "Call Drops", "Billing Dispute"]:
        risk_score += 20.0
        reasons.append(f"Core service impact category: '{category}'.")
    elif category in ["Equipment / Router", "Installation", "Data / Usage Issue"]:
        risk_score += 10.0
    else:
        risk_score += 5.0

    # 2. Sentiment Impact Factor
    if sentiment == "Negative":
        risk_score += 20.0
        reasons.append("Negative customer sentiment detected.")
    elif sentiment == "Neutral":
        risk_score += 5.0

    # 3. Repeated Complaint / SLA Risk Keywords
    repeated_keywords = ["again", "repeated", "second time", "third time", "calls", "days ago", "already", "pending", "unresolved", "no update", "multiple times"]
    if any(k in text_lower for k in repeated_keywords):
        risk_score += 20.0
        reasons.append("Repeated complaint / multiple unresolved support interactions indicated.")

    # 4. Outage & Emergency Indicators
    outage_keywords = ["outage", "entire building", "blackout", "emergency", "no signal at all", "no service since", "work from home", "hospital", "urgent", "disconnected"]
    if any(k in text_lower for k in outage_keywords):
        risk_score += 15.0
        reasons.append("Severe service disruption or critical work/safety impact reported.")

    # 5. Financial / Regulatory Risk Keywords
    legal_keywords = ["sue", "legal", "court", "consumer court", "lawyer", "fraud", "scam", "trai", "fcc", "overcharge"]
    if any(k in text_lower for k in legal_keywords):
        risk_score += 15.0
        reasons.append("High regulatory/financial escalation risk keyword detected.")

    risk_score = min(99.0, max(5.0, risk_score))

    # Priority Tier Logic
    if risk_score >= 75.0:
        priority = "CRITICAL"
        priority_label = "P1 - CRITICAL"
    elif risk_score >= 50.0:
        priority = "HIGH"
        priority_label = "P2 - HIGH"
    elif risk_score >= 30.0:
        priority = "MEDIUM"
        priority_label = "P3 - MEDIUM"
    else:
        priority = "LOW"
        priority_label = "P4 - LOW"

    escalation_required = (risk_score >= 60.0)

    if not reasons:
        reasons.append("Standard telecom query requiring routine customer support processing.")

    return {
        "priority": priority,
        "priority_label": priority_label,
        "escalation_required": escalation_required,
        "escalation_risk_score": round(risk_score, 1),
        "escalation_reasons": reasons
    }

async def detect_priority(text: str, category: str = "Network Connectivity", sentiment: str = "Neutral", is_sufficient: bool = True) -> dict:
    return calculate_telecom_priority_and_escalation(category, sentiment, text, is_sufficient=is_sufficient)
