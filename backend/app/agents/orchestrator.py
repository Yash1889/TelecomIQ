"""
TelecomIQ — Core Complaint Intelligence Pipeline
Official scope (per company use case):
  1. Complaint category classification
  2. Customer sentiment analysis
  3. Priority + escalation risk prediction
  4. Vector DB / RAG retrieval (historical complaints + SOPs)
  5. GenAI triage assistant → resolution recommendation + ticket summary
"""

import asyncio
import json
from app.agents.input_validator import validate_complaint_input
from app.agents.classifier import classify_complaint
from app.agents.sentiment_analyzer import analyze_sentiment
from app.agents.priority import detect_priority
from app.agents.complaint_matcher import find_similar_complaints
from app.services.rag_engine import rag_engine
from app.agents.gemini_client import async_ask_ai


async def run_agent_pipeline(text: str, user_language: str = "english") -> dict:
    """
    TelecomIQ end-to-end complaint analysis pipeline.

    Stages
    ------
    1  Input sufficiency validation
    2  ML classification (TF-IDF + LogisticRegression)  → category + confidence
    3  VADER sentiment analysis                          → sentiment + score
    4  Multi-factor priority & escalation scoring        → priority + escalation
    5  Vector cosine similarity over historical corpus   → similar complaints
    6  TF-IDF RAG over telecom SOP knowledge base        → resolution context
    7  GenAI triage (Groq → Gemini → SOP fallback)       → resolution + summary
    """

    # ── 1. Input Validation ──────────────────────────────────────────────── #
    validation_res = validate_complaint_input(text)
    if not validation_res["is_sufficient"]:
        return {
            "is_sufficient":       False,
            "category":            "Insufficient Information",
            "confidence":          0.0,
            "priority":            "LOW",
            "sentiment":           "Neutral",
            "sentiment_score":     0.0,
            "escalation_required": False,
            "escalation_risk_score": 0.0,
            "escalation_reasons":  [
                "Input contains insufficient details to perform automated complaint analysis."
            ],
            "ticket_summary": "Insufficient complaint information provided.",
            "solution": (
                "Please provide additional details regarding your issue, including "
                "affected service type, problem description, duration, and location."
            ),
            "response": (
                "Hello! Thank you for contacting TelecomIQ Support. Your submission "
                "does not contain sufficient details for automated complaint "
                "classification and resolution. Please describe your issue "
                "(e.g. Broadband disconnects, Billing overcharge, Call drops), "
                "including duration and location."
            ),
            "action":        "Awaiting Customer Details",
            "satisfaction":  "High",
            "similar_issues": [],
            "kb_sources":     [],
            "steps": [
                {"step": "Input Validation", "status": "Insufficient complaint information detected"}
            ],
            "is_anomaly": False,
        }

    # ── 2. Classification ────────────────────────────────────────────────── #
    cat_res      = await classify_complaint(text)
    category     = cat_res["category"]
    cat_confidence = cat_res["confidence"]

    # ── 3. Sentiment Analysis ────────────────────────────────────────────── #
    sent_res   = await analyze_sentiment(text)
    sentiment  = sent_res["sentiment"]
    sent_score = sent_res["score"]

    # ── 4. Priority + Escalation Risk ───────────────────────────────────── #
    priority_res       = await detect_priority(
        text, category=category, sentiment=sentiment, is_sufficient=True
    )
    priority             = priority_res["priority"]
    escalation_required  = priority_res["escalation_required"]
    escalation_risk_score = priority_res["escalation_risk_score"]
    escalation_reasons   = priority_res["escalation_reasons"]

    # ── 5. Vector RAG — historical complaints ───────────────────────────── #
    similar_complaints = await find_similar_complaints(text, category=category, top_k=3)

    # ── 6. RAG — telecom SOP knowledge base ─────────────────────────────── #
    rag_res    = rag_engine.retrieve(f"{category} {text}")
    kb_context = rag_res["context"]
    kb_sources = rag_res["sources"]

    # ── 7. GenAI Triage — resolution + ticket summary ───────────────────── #
    sla_hours = (
        2  if priority == "CRITICAL" else
        6  if priority == "HIGH"     else
        12 if priority == "MEDIUM"   else
        24
    )

    llm_prompt = f"""You are TelecomIQ's Senior Telecom Operations Specialist.
Analyze the following complaint and return ONLY valid JSON.

Complaint: "{text}"
Category: {category} (Confidence: {cat_confidence}%)
Sentiment: {sentiment} (Score: {sent_score})
Priority: {priority} (Escalation Risk: {escalation_risk_score}%)
Escalation Reasons: {', '.join(escalation_reasons)}
Telecom SOP Grounding:
{kb_context}

Return EXACTLY this JSON (no extra keys, no markdown):
{{
  "solution": "Clear 4-step technical action plan (1. Diagnostic, 2. Field/NOC check, 3. Profile reset, 4. SLA target {sla_hours}h)",
  "ticket_summary": "Concise 2-sentence internal operational summary of customer issue and risk level",
  "customer_response": "Professional response explaining immediate diagnostic action, target SLA of {sla_hours}h, and next update timeline.",
  "action": "Technical action tag (e.g. NOC Escalation / Line Diagnostics / Billing Audit)"
}}"""

    try:
        raw_res    = await async_ask_ai(llm_prompt)
        clean_json = raw_res.strip().replace("```json", "").replace("```", "").strip()
        start, end = clean_json.find("{"), clean_json.rfind("}") + 1
        if start != -1 and end:
            clean_json = clean_json[start:end]
        llm_data = json.loads(clean_json)

        solution          = llm_data.get("solution",          f"1. Run automated {category} line diagnostic.\n2. Verify signal/billing metrics in portal.\n3. Reset subscriber connection profile.\n4. Target SLA: {sla_hours} hours.")
        ticket_summary    = llm_data.get("ticket_summary",    f"Customer reported a {category} issue with {sentiment.lower()} sentiment. Priority assessed as {priority} with {escalation_risk_score}% escalation risk.")
        customer_response = llm_data.get("customer_response", f"Dear Customer, we have received your {category} report. Our engineering team has assigned priority {priority} to your ticket. Diagnostic checks are underway with a target SLA of {sla_hours} hours.")
        action            = llm_data.get("action",            f"{category} Diagnostic & SOP Execution")

    except Exception as e:
        print(f"ℹ️ LLM Generation fallback triggered ({e}). Using grounded SOP templates.")
        solution          = f"1. Run automated {category} line diagnostic.\n2. Cross-reference regional network alerts.\n3. Reset subscriber network profile.\n4. Target SLA: {sla_hours} hours."
        ticket_summary    = f"Customer reported a {category} complaint. Classified as {priority} priority with {escalation_risk_score}% escalation risk."
        customer_response = f"Dear Customer, thank you for contacting TelecomIQ Support. Your {category} issue has been registered under Priority {priority}. Technical investigation has been initiated with a target resolution SLA of {sla_hours} hours."
        action            = f"Technical SOP Check for {category}"

    steps = [
        {"step": "Input Validation",       "status": "Valid telecom complaint text confirmed"},
        {"step": "Telecom Classifier",     "status": f"Category: {category} ({cat_confidence}% confidence)"},
        {"step": "Sentiment Analyzer",     "status": f"Sentiment: {sentiment} (Score: {sent_score})"},
        {"step": "Priority & Risk Model",  "status": f"Priority: {priority} | Escalation Risk: {escalation_risk_score}%"},
        {"step": "Vector Historical Search","status": f"Retrieved {len(similar_complaints)} matching historical tickets"},
        {"step": "RAG Knowledge Base",     "status": f"SOP sources: {', '.join(kb_sources[:2]) if kb_sources else 'Telecom Operational SOP'}"},
        {"step": "GenAI Triage Assistant", "status": "Resolution recommendation and ticket summary generated"},
    ]

    return {
        "is_sufficient":        True,
        "category":             category,
        "confidence":           cat_confidence,
        "priority":             priority,
        "sentiment":            sentiment,
        "sentiment_score":      sent_score,
        "escalation_required":  escalation_required,
        "escalation_risk_score": escalation_risk_score,
        "escalation_reasons":   escalation_reasons,
        "solution":             solution,
        "ticket_summary":       ticket_summary,
        "response":             customer_response,
        "action":               action,
        "satisfaction":         "Low" if sentiment == "Negative" else "High",
        "similar_issues":       similar_complaints,
        "kb_sources":           kb_sources,
        "steps":                steps,
        "is_anomaly":           escalation_required,
    }
