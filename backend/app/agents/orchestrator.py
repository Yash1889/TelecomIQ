import asyncio
import json
import os
from app.agents.classifier import classify_complaint
from app.agents.sentiment_analyzer import analyze_sentiment
from app.agents.priority import detect_priority
from app.agents.complaint_matcher import find_similar_complaints
from app.services.rag_engine import rag_engine
from app.agents.gemini_client import async_ask_ai

async def run_agent_pipeline(text: str, user_language: str = 'english') -> dict:
    """
    TelecomIQ Orchestrated Intelligence Pipeline.
    Executes real NLP classification, sentiment analysis, escalation risk scoring,
    vector RAG search over historical complaints, grounded resolution recommendations,
    concise ticket summary, customer response generation, and human review routing.
    """
    if not text or not text.strip():
        text = "Telecom service complaint"

    # Step 1 & 2: Local ML Classification & Sentiment Analysis
    cat_res = await classify_complaint(text)
    category = cat_res["category"]
    cat_confidence = cat_res["confidence"]

    sent_res = await analyze_sentiment(text)
    sentiment = sent_res["sentiment"]
    sent_score = sent_res["score"]

    # Step 3: Priority & Escalation Risk Calculation
    priority_res = await detect_priority(text, category=category, sentiment=sentiment)
    priority = priority_res["priority"]
    escalation_required = priority_res["escalation_required"]
    escalation_risk_score = priority_res["escalation_risk_score"]
    escalation_reasons = priority_res["escalation_reasons"]

    # Step 4: Real Historical Vector Retrieval
    similar_complaints = await find_similar_complaints(text, category=category, top_k=3)

    # Step 5: Telecom Knowledge Base (RAG) SOP Retrieval
    rag_res = rag_engine.retrieve(f"{category} {text}")
    kb_context = rag_res["context"]
    kb_sources = rag_res["sources"]

    # Step 6: Grounded Resolution & Response Generation (via LLM or deterministic fallback)
    llm_prompt = f"""
You are TelecomIQ's Lead Operations Specialist.
Analyze the following telecom complaint and output ONLY valid JSON.

Complaint: "{text}"
Category: {category} (Confidence: {cat_confidence}%)
Sentiment: {sentiment} (Score: {sent_score})
Priority: {priority} (Escalation Risk: {escalation_risk_score}%)
Escalation Reasons: {', '.join(escalation_reasons)}
Retrieved SOP Context:
{kb_context}

Return EXACT JSON format with these exact keys:
{{
  "solution": "Clear 4-step internal technical action plan (e.g. 1. Run line diagnostics, 2. Verify signal SNR, 3. Reset SIM profile, 4. Target SLA 4h)",
  "ticket_summary": "Concise 2-sentence executive summary of customer issue and status",
  "customer_response": "Professional, empathetic response to the customer explaining immediate action, SLA, and next step.",
  "action": "Immediate action tag (e.g., NOC Escalation / Technical Field Dispatch / Billing Audit)"
}}
"""
    try:
        raw_res = await async_ask_ai(llm_prompt)
        # Parse JSON output from LLM
        clean_json = raw_res.strip().replace("```json", "").replace("```", "").strip()
        start = clean_json.find('{')
        end = clean_json.rfind('}') + 1
        if start != -1 and end != -1:
            clean_json = clean_json[start:end]
        llm_data = json.loads(clean_json)

        solution = llm_data.get("solution", f"1. Initiate {category} line diagnostic. 2. Verify signal metrics. 3. Dispatch NOC ticket if unresolved within SLA.")
        ticket_summary = llm_data.get("ticket_summary", f"Customer reports {category} issue with {sentiment.lower()} sentiment. Escalation risk assessed at {escalation_risk_score}%.")
        customer_response = llm_data.get("customer_response", f"Dear Customer, we have received your {category} report. Our technical team has prioritized your request and initiated diagnostic checks. Expected resolution within target SLA.")
        action = llm_data.get("action", f"{category} Diagnostic & SOP Execution")
    except Exception as e:
        print(f"ℹ️ LLM Generation fallback triggered ({e}). Using grounded rule templates.")
        solution = f"1. Run automated {category} line diagnostic.\n2. Cross-reference regional network outage alerts.\n3. Reset subscriber network profile.\n4. Target SLA: {6 if priority=='HIGH' else 24} hours."
        ticket_summary = f"Customer reports {category} issue requiring investigation. Classified as {priority} priority with {escalation_risk_score}% escalation risk."
        customer_response = f"Dear Customer, thank you for contacting support. We have logged your {category} complaint (Priority: {priority}). Our technical engineering team is investigating your line status. We will update you via SMS within our target SLA."
        action = f"Technical SOP Check for {category}"

    steps = [
        {"step": "Telecom Classifier", "status": f"Category: {category} ({cat_confidence}% confidence)"},
        {"step": "Sentiment Analyzer", "status": f"Sentiment: {sentiment} (Score: {sent_score})"},
        {"step": "Severity & Risk Model", "status": f"Priority: {priority} | Escalation Risk: {escalation_risk_score}%"},
        {"step": "Vector Historical Search", "status": f"Retrieved {len(similar_complaints)} similar historical tickets"},
        {"step": "Grounding RAG Engine", "status": f"Loaded SOP sources: {', '.join(kb_sources[:2])}"},
        {"step": "Resolution & Response", "status": "Grounded resolution recommendation generated"}
    ]

    return {
        "category": category,
        "confidence": cat_confidence,
        "priority": priority,
        "sentiment": sentiment,
        "sentiment_score": sent_score,
        "escalation_required": escalation_required,
        "escalation_risk_score": escalation_risk_score,
        "escalation_reasons": escalation_reasons,
        "solution": solution,
        "ticket_summary": ticket_summary,
        "response": customer_response,
        "action": action,
        "satisfaction": "Medium" if sentiment == "Negative" else ("Low" if sentiment == "Angry" else "High"),
        "similar_issues": similar_complaints,
        "kb_sources": kb_sources,
        "steps": steps,
        "is_anomaly": escalation_required
    }
