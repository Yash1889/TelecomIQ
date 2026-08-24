"""
Multi-factor Telecom Priority & Escalation Engine.
Evaluates category severity, sentiment intensity, repeated complaint keywords,
outage indicators, and SLA risk to produce explainable priority levels and escalation scores.
"""

PRIORITY_LEVELS = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
LEVEL_TO_PRIORITY = {1: "LOW", 2: "MEDIUM", 3: "HIGH", 4: "CRITICAL"}


def reconcile_priority(model_priority: str, user_priority: str) -> tuple:
    """
    Reconciles subscriber-selected priority with ML systemic priority.
    If diff <= 1: adopts higher priority for customer protection.
    If diff >= 2 (major conflict): computes mean severity tier.
    """
    if not user_priority:
        return model_priority, ""
    
    u_p = user_priority.strip().upper()
    m_p = model_priority.strip().upper()
    
    if u_p not in PRIORITY_LEVELS or m_p not in PRIORITY_LEVELS:
        return m_p, ""
        
    u_level = PRIORITY_LEVELS[u_p]
    m_level = PRIORITY_LEVELS[m_p]
    
    diff = abs(u_level - m_level)
    if diff == 0:
        return m_p, f"Priority confirmed: Both subscriber and system evaluated severity as {m_p}."
    elif diff == 1:
        final_level = max(u_level, m_level)
        final_p = LEVEL_TO_PRIORITY[final_level]
        return final_p, f"Priority set to {final_p} (Subscriber: {u_p}, System ML: {m_p})."
    else:
        mean_level = int(round((u_level + m_level) / 2.0))
        final_p = LEVEL_TO_PRIORITY[mean_level]
        return final_p, f"Priority reconciled to {final_p} via hybrid mean formula (Subscriber: {u_p}, System ML: {m_p})."


def calculate_telecom_priority_and_escalation(category: str, sentiment: str, text: str, is_sufficient: bool = True, user_priority: str = "MEDIUM") -> dict:
    """
    Multi-factor telecom severity, priority & escalation risk calculator.
    """
    if not is_sufficient:
        return {
            "priority": "LOW",
            "user_priority": user_priority,
            "priority_reconciliation_note": "",
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
        model_priority = "CRITICAL"
    elif risk_score >= 50.0:
        model_priority = "HIGH"
    elif risk_score >= 30.0:
        model_priority = "MEDIUM"
    else:
        model_priority = "LOW"

    final_priority, recon_note = reconcile_priority(model_priority, user_priority)

    priority_label = (
        "P1 - CRITICAL" if final_priority == "CRITICAL" else
        "P2 - HIGH"     if final_priority == "HIGH"     else
        "P3 - MEDIUM"   if final_priority == "MEDIUM"   else
        "P4 - LOW"
    )

    escalation_required = (risk_score >= 60.0 or final_priority == "CRITICAL")

    if not reasons:
        reasons.append("Standard telecom query requiring routine customer support processing.")

    return {
        "priority": final_priority,
        "user_priority": user_priority,
        "priority_reconciliation_note": recon_note,
        "priority_label": priority_label,
        "escalation_required": escalation_required,
        "escalation_risk_score": round(risk_score, 1),
        "escalation_reasons": reasons
    }

async def detect_priority(text: str, category: str = "Network Connectivity", sentiment: str = "Neutral", is_sufficient: bool = True, user_priority: str = "MEDIUM") -> dict:
    return calculate_telecom_priority_and_escalation(category, sentiment, text, is_sufficient=is_sufficient, user_priority=user_priority)
