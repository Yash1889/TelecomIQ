"""
TelecomIQ — Complaint Intelligence Pipeline (LangGraph Orchestration)
======================================================================
Official scope (per company use case):
  1.  Complaint category classification      → classifier.py
  2.  Customer sentiment analysis            → sentiment_analyzer.py
  3.  Complaint prioritization               → priority.py
  4.  Escalation risk prediction             → priority.py
  5.  Resolution recommendation              → GenAI (Groq → Gemini → SOP)
  6.  Automatic ticket summary generation    → GenAI
  7.  BERT / DistilBERT component            → local_transformer.py (offline)
  8.  GenAI triage assistant                 → gemini_client.py / groq_client.py
  9.  Vector DB / RAG                        → rag_engine.py + complaint_matcher.py
  10. Agentic orchestration                  → LangGraph StateGraph  ← THIS FILE

Pipeline graph
--------------
  validate_input
       │
  [insufficient] ──────────────────────────────► END
       │ [sufficient]
  classify_complaint
       │
  analyze_sentiment
       │
  predict_priority
       │
  retrieve_similar          (Vector DB — historical complaints)
       │
  retrieve_rag_context      (RAG    — telecom SOP knowledge base)
       │
  genai_triage              (GenAI triage assistant)
       │
       ▼
      END
"""

import asyncio
import json
from typing import TypedDict, List, Optional, Any

from langgraph.graph import StateGraph, END

from app.agents.input_validator import validate_complaint_input
from app.agents.classifier import classify_complaint
from app.agents.sentiment_analyzer import analyze_sentiment
from app.agents.priority import detect_priority
from app.agents.complaint_matcher import find_similar_complaints
from app.services.rag_engine import rag_engine
from app.agents.gemini_client import async_ask_ai


# ─────────────────────────────────────────────────────────────────────────────
# Shared state schema — every node reads from and writes to this TypedDict
# ─────────────────────────────────────────────────────────────────────────────

class ComplaintState(TypedDict, total=False):
    # Input
    text:                  str
    # Validity gate
    is_sufficient:         bool
    # Step 1 — Classification
    category:              str
    confidence:            float
    # Step 2 — Sentiment
    sentiment:             str
    sentiment_score:       float
    # Step 3 & 4 — Priority + Escalation
    priority:              str
    escalation_required:   bool
    escalation_risk_score: float
    escalation_reasons:    List[str]
    # Step 5 — Vector DB / historical similarity
    similar_issues:        List[Any]
    # Step 6 — RAG
    kb_context:            str
    kb_sources:            List[str]
    # Step 7 — GenAI triage outputs
    solution:              str
    ticket_summary:        str
    response:              str
    action:                str
    # Pipeline audit
    steps:                 List[dict]


# ─────────────────────────────────────────────────────────────────────────────
# Node 1 — Input Validation
# ─────────────────────────────────────────────────────────────────────────────

async def node_validate_input(state: ComplaintState) -> ComplaintState:
    text = state["text"]
    result = validate_complaint_input(text)
    state["is_sufficient"] = result["is_sufficient"]
    return state


# ─────────────────────────────────────────────────────────────────────────────
# Node 2 — Complaint Classification  (NLP/ML: TF-IDF + LogisticRegression)
# ─────────────────────────────────────────────────────────────────────────────

async def node_classify(state: ComplaintState) -> ComplaintState:
    result = await classify_complaint(state["text"])
    state["category"]   = result["category"]
    state["confidence"] = result["confidence"]
    state.setdefault("steps", []).append({
        "step":   "Telecom Classifier",
        "status": f"Category: {result['category']} ({result['confidence']}% confidence)",
    })
    return state


# ─────────────────────────────────────────────────────────────────────────────
# Node 3 — Sentiment Analysis  (VADER + TextBlob)
# ─────────────────────────────────────────────────────────────────────────────

async def node_sentiment(state: ComplaintState) -> ComplaintState:
    result = await analyze_sentiment(state["text"])
    state["sentiment"]       = result["sentiment"]
    state["sentiment_score"] = result["score"]
    state.setdefault("steps", []).append({
        "step":   "Sentiment Analyzer",
        "status": f"Sentiment: {result['sentiment']} (Score: {result['score']})",
    })
    return state


# ─────────────────────────────────────────────────────────────────────────────
# Node 4 — Priority + Escalation Risk  (multi-factor rule model)
# ─────────────────────────────────────────────────────────────────────────────

async def node_priority(state: ComplaintState) -> ComplaintState:
    result = await detect_priority(
        state["text"],
        category=state.get("category", ""),
        sentiment=state.get("sentiment", "Neutral"),
        is_sufficient=True,
    )
    state["priority"]              = result["priority"]
    state["escalation_required"]   = result["escalation_required"]
    state["escalation_risk_score"] = result["escalation_risk_score"]
    state["escalation_reasons"]    = result["escalation_reasons"]
    state.setdefault("steps", []).append({
        "step":   "Priority & Risk Model",
        "status": f"Priority: {result['priority']} | Escalation Risk: {result['escalation_risk_score']}%",
    })
    return state


# ─────────────────────────────────────────────────────────────────────────────
# Node 5 — Vector DB: Historical Complaint Similarity
# ─────────────────────────────────────────────────────────────────────────────

async def node_vector_search(state: ComplaintState) -> ComplaintState:
    similar = await find_similar_complaints(
        state["text"], category=state.get("category", ""), top_k=3
    )
    state["similar_issues"] = similar
    state.setdefault("steps", []).append({
        "step":   "Vector Historical Search",
        "status": f"Retrieved {len(similar)} matching historical tickets",
    })
    return state


# ─────────────────────────────────────────────────────────────────────────────
# Node 6 — RAG: Telecom SOP Knowledge Base
# ─────────────────────────────────────────────────────────────────────────────

async def node_rag(state: ComplaintState) -> ComplaintState:
    query  = f"{state.get('category', '')} {state['text']}"
    result = rag_engine.retrieve(query)
    state["kb_context"] = result["context"]
    state["kb_sources"] = result["sources"]
    state.setdefault("steps", []).append({
        "step":   "RAG Knowledge Base",
        "status": f"SOP sources: {', '.join(result['sources'][:2]) if result['sources'] else 'Telecom Operational SOP'}",
    })
    return state


# ─────────────────────────────────────────────────────────────────────────────
# Node 7 — GenAI Triage Assistant  (Groq → Gemini → SOP template fallback)
# ─────────────────────────────────────────────────────────────────────────────

async def node_genai_triage(state: ComplaintState) -> ComplaintState:
    category              = state.get("category", "Network Connectivity")
    sentiment             = state.get("sentiment", "Neutral")
    sent_score            = state.get("sentiment_score", 0.0)
    priority              = state.get("priority", "MEDIUM")
    escalation_risk_score = state.get("escalation_risk_score", 0.0)
    escalation_reasons    = state.get("escalation_reasons", [])
    kb_context            = state.get("kb_context", "")
    text                  = state["text"]

    sla_hours = (
        2  if priority == "CRITICAL" else
        6  if priority == "HIGH"     else
        12 if priority == "MEDIUM"   else
        24
    )

    llm_prompt = f"""You are TelecomIQ's Senior Telecom Operations Specialist.
Analyze the following complaint and return ONLY valid JSON.

Complaint: "{text}"
Category: {category} (Confidence: {state.get('confidence', 0)}%)
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
        raw       = await async_ask_ai(llm_prompt)
        clean     = raw.strip().replace("```json", "").replace("```", "").strip()
        s, e      = clean.find("{"), clean.rfind("}") + 1
        if s != -1 and e:
            clean = clean[s:e]
        data = json.loads(clean)

        state["solution"]       = data.get("solution",          f"1. Run automated {category} line diagnostic.\n2. Verify metrics in portal.\n3. Reset subscriber profile.\n4. Target SLA: {sla_hours} hours.")
        state["ticket_summary"] = data.get("ticket_summary",    f"Customer reported a {category} issue with {sentiment.lower()} sentiment. Priority assessed as {priority} with {escalation_risk_score}% escalation risk.")
        state["response"]       = data.get("customer_response", f"Dear Customer, we have received your {category} report. Our engineering team has assigned priority {priority}. Target SLA: {sla_hours} hours.")
        state["action"]         = data.get("action",            f"{category} Diagnostic & SOP Execution")

    except Exception as exc:
        print(f"ℹ️ LLM fallback triggered ({exc}). Using grounded SOP templates.")
        state["solution"]       = f"1. Run automated {category} line diagnostic.\n2. Cross-reference regional network alerts.\n3. Reset subscriber network profile.\n4. Target SLA: {sla_hours} hours."
        state["ticket_summary"] = f"Customer reported a {category} complaint. Classified as {priority} priority with {escalation_risk_score}% escalation risk."
        state["response"]       = f"Dear Customer, thank you for contacting TelecomIQ Support. Your {category} issue has been registered under Priority {priority}. Target SLA: {sla_hours} hours."
        state["action"]         = f"Technical SOP Check for {category}"

    state.setdefault("steps", []).append({
        "step":   "GenAI Triage Assistant",
        "status": "Resolution recommendation and ticket summary generated",
    })
    return state


# ─────────────────────────────────────────────────────────────────────────────
# Routing function — branches on input sufficiency
# ─────────────────────────────────────────────────────────────────────────────

def route_after_validation(state: ComplaintState) -> str:
    """Route to classification if input is sufficient, otherwise end early."""
    return "node_classify" if state.get("is_sufficient", False) else END


# ─────────────────────────────────────────────────────────────────────────────
# Build the LangGraph StateGraph
# ─────────────────────────────────────────────────────────────────────────────

def _build_graph() -> Any:
    graph = StateGraph(ComplaintState)

    # Register nodes (prefixed with node_ to prevent state key name collisions)
    graph.add_node("node_validate",      node_validate_input)
    graph.add_node("node_classify",      node_classify)
    graph.add_node("node_sentiment",     node_sentiment)
    graph.add_node("node_priority",      node_priority)
    graph.add_node("node_vector_search", node_vector_search)
    graph.add_node("node_rag",           node_rag)
    graph.add_node("node_genai_triage",  node_genai_triage)

    # Entry point
    graph.set_entry_point("node_validate")

    # Conditional branch after validation
    graph.add_conditional_edges(
        "node_validate",
        route_after_validation,
        {
            "node_classify": "node_classify",
            END:             END,
        },
    )

    # Linear chain for the happy path
    graph.add_edge("node_classify",      "node_sentiment")
    graph.add_edge("node_sentiment",     "node_priority")
    graph.add_edge("node_priority",      "node_vector_search")
    graph.add_edge("node_vector_search", "node_rag")
    graph.add_edge("node_rag",           "node_genai_triage")
    graph.add_edge("node_genai_triage",  END)

    return graph.compile()


# Compiled graph — module-level singleton
_compiled_graph = _build_graph()


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point — same signature as before, API contract unchanged
# ─────────────────────────────────────────────────────────────────────────────

async def run_agent_pipeline(text: str, user_language: str = "english") -> dict:
    """
    Execute the LangGraph complaint intelligence pipeline.

    Accepts a complaint text string and returns the full analysis dict
    with the same keys as before so no downstream code needs to change.
    """

    # Seed the initial state
    initial_state: ComplaintState = {
        "text":  text,
        "steps": [
            {"step": "Input Validation", "status": "Complaint received — running LangGraph pipeline"},
        ],
    }

    # Run the compiled graph asynchronously
    final_state: ComplaintState = await _compiled_graph.ainvoke(initial_state)

    # ── Insufficient input early return ──────────────────────────────────── #
    if not final_state.get("is_sufficient", True):
        return {
            "is_sufficient":         False,
            "category":              "Insufficient Information",
            "confidence":            0.0,
            "priority":              "LOW",
            "sentiment":             "Neutral",
            "sentiment_score":       0.0,
            "escalation_required":   False,
            "escalation_risk_score": 0.0,
            "escalation_reasons":    [
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
            "action":         "Awaiting Customer Details",
            "satisfaction":   "High",
            "similar_issues": [],
            "kb_sources":     [],
            "steps":          final_state.get("steps", []),
            "is_anomaly":     False,
        }

    # ── Full result ──────────────────────────────────────────────────────── #
    return {
        "is_sufficient":         True,
        "category":              final_state.get("category",              "Network Connectivity"),
        "confidence":            final_state.get("confidence",             90.0),
        "priority":              final_state.get("priority",              "MEDIUM"),
        "sentiment":             final_state.get("sentiment",             "Neutral"),
        "sentiment_score":       final_state.get("sentiment_score",       0.0),
        "escalation_required":   final_state.get("escalation_required",   False),
        "escalation_risk_score": final_state.get("escalation_risk_score", 0.0),
        "escalation_reasons":    final_state.get("escalation_reasons",    []),
        "solution":              final_state.get("solution",              ""),
        "ticket_summary":        final_state.get("ticket_summary",        ""),
        "response":              final_state.get("response",              ""),
        "action":                final_state.get("action",                ""),
        "satisfaction":          "Low" if final_state.get("sentiment") == "Negative" else "High",
        "similar_issues":        final_state.get("similar_issues",        []),
        "kb_sources":            final_state.get("kb_sources",            []),
        "steps":                 final_state.get("steps",                 []),
        "is_anomaly":            final_state.get("escalation_required",   False),
    }
