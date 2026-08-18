def calculate_telecom_priority_and_escalation(category: str, sentiment: str, text: str) -> dict:
    """
    Multi-factor telecom severity, priority & escalation risk calculator.
    Outputs:
    - priority: P1 - CRITICAL, P2 - HIGH, P3 - MEDIUM, P4 - LOW
    - escalation_required: bool
    - escalation_risk_score: float (0 to 100)
    - escalation_reasons: list of strings detailing why
    """
    text_lower = text.lower()
    risk_score = 15.0
    reasons = []
    
    # 1. Category Impact Factor
    if category in ["Service Outage", "Cancellation"]:
        risk_score += 40.0
        reasons.append(f"High-impact category: {category} affects service availability/retention.")
    elif category in ["Network Connectivity", "Broadband Performance", "Call Drops", "Billing Dispute"]:
        risk_score += 25.0
        reasons.append(f"Core telecom service disruption category: {category}.")
    elif category in ["Equipment / Router", "Installation"]:
        risk_score += 15.0
    else:
        risk_score += 5.0

    # 2. Sentiment Impact Factor
    if sentiment == "Angry":
        risk_score += 30.0
        reasons.append("Strong negative/angry customer sentiment detected.")
    elif sentiment == "Negative":
        risk_score += 15.0
        reasons.append("Dissatisfied customer tone detected.")

    # 3. Repeated Complaint / SLA Risk Keywords
    repeated_keywords = ["again", "repeated", "second time", "third time", "calls", "days ago", "already", "pending", "unresolved"]
    if any(k in text_lower for k in repeated_keywords):
        risk_score += 20.0
        reasons.append("Repeated complaint / multiple unresolved support interactions indicated.")

    # 4. Outage & Emergency Indicators
    outage_keywords = ["outage", "entire building", "blackout", "emergency", "no signal at all", "no service since", "work from home"]
    if any(k in text_lower for k in outage_keywords):
        risk_score += 15.0
        reasons.append("Severe service disruption or critical work impact reported.")

    risk_score = min(99.0, max(10.0, risk_score))
    
    # Priority Tier Logic
    if risk_score >= 75.0:
        priority = "CRITICAL"
        priority_label = "P1 - CRITICAL"
    elif risk_score >= 55.0:
        priority = "HIGH"
        priority_label = "P2 - HIGH"
    elif risk_score >= 35.0:
        priority = "MEDIUM"
        priority_label = "P3 - MEDIUM"
    else:
        priority = "LOW"
        priority_label = "P4 - LOW"

    escalation_required = (risk_score >= 65.0)

    if not reasons:
        reasons.append("Standard telecom service query requiring routine support handling.")

    return {
        "priority": priority,
        "priority_label": priority_label,
        "escalation_required": escalation_required,
        "escalation_risk_score": round(risk_score, 1),
        "escalation_reasons": reasons
    }

async def detect_priority(text: str, category: str = "Network Connectivity", sentiment: str = "Neutral") -> dict:
    return calculate_telecom_priority_and_escalation(category, sentiment, text)
