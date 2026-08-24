"""
TelecomIQ — Complaint Intelligence Pipeline (LangGraph Orchestration)
======================================================================
Official scope (per company use case):
  1.  Complaint category classification      → classifier.py
  2.  Customer sentiment analysis            → sentiment_analyzer.py
  3.  Complaint prioritization               → priority.py
  4.  Escalation risk prediction             → priority.py
  5.  Resolution recommendation              → GenAI (Groq → SOP)
  6.  Automatic ticket summary generation    → GenAI
  7.  BERT / DistilBERT component            → local_transformer.py (offline)
  8.  GenAI triage assistant                 → groq_client.py
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
from app.agents.groq_client import async_ask_ai


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
    # Step 7 — GenAI triage outputs (7 operational fields)
    incident_summary:      str
    likely_cause:          str
    alternative_causes:    List[str]
    recommended_actions:   List[str]
    customer_impact:       str
    customer_response:     str
    resolution_basis:      str
    # Backward compatibility fields
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
    user_p = state.get("user_priority", "MEDIUM")
    result = await detect_priority(
        state["text"],
        category=state.get("category", ""),
        sentiment=state.get("sentiment", "Neutral"),
        is_sufficient=True,
        user_priority=user_p
    )
    state["priority"]                     = result["priority"]
    state["user_priority"]                = result.get("user_priority", user_p)
    state["priority_reconciliation_note"] = result.get("priority_reconciliation_note", "")
    state["escalation_required"]          = result["escalation_required"]
    state["escalation_risk_score"]        = result["escalation_risk_score"]
    state["escalation_reasons"]           = result["escalation_reasons"]
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
    cat = state.get("category", "")
    result = rag_engine.retrieve(state["text"], category=cat)
    state["kb_context"] = result["context"]
    state["kb_sources"] = result["sources"]
    state.setdefault("steps", []).append({
        "step":   "RAG Knowledge Base",
        "status": f"SOP sources: {', '.join(result['sources'][:2]) if result['sources'] else 'Telecom Operational SOP'}",
    })
    return state


# ─────────────────────────────────────────────────────────────────────────────
# Node 7 — GenAI Triage Assistant  (Groq → Structured 7-field JSON analysis)
# ─────────────────────────────────────────────────────────────────────────────

async def node_genai_triage(state: ComplaintState) -> ComplaintState:
    category              = state.get("category", "Network Connectivity")
    sentiment             = state.get("sentiment", "Neutral")
    sent_score            = state.get("sentiment_score", 0.0)
    priority              = state.get("priority", "MEDIUM")
    escalation_risk_score = state.get("escalation_risk_score", 0.0)
    escalation_reasons    = state.get("escalation_reasons", [])
    kb_context            = state.get("kb_context", "")
    kb_sources            = state.get("kb_sources", [])
    similar_issues        = state.get("similar_issues", [])
    text                  = state["text"]

    sla_hours = (
        2  if priority == "CRITICAL" else
        6  if priority == "HIGH"     else
        12 if priority == "MEDIUM"   else
        24
    )

    # Format retrieved historical cases for prompt grounding
    hist_formatted = []
    for item in (similar_issues or [])[:3]:
        t_id = item.get("ticket_id") or item.get("id") or ""
        t_desc = item.get("description") or item.get("subject") or ""
        t_cat = item.get("category") or ""
        t_sim = item.get("similarity_percent") or item.get("score") or ""
        hist_formatted.append(f"- Ticket {t_id} ({t_cat}): '{t_desc}' [{t_sim}% match]")
    hist_text = "\n".join(hist_formatted) if hist_formatted else "No historical matches found."

    llm_prompt = f"""You are TelecomIQ's incident-resolution engine.

CRITICAL Triage Principle:
The ML Category prediction ("{category}") tells you where to look, NOT the diagnosis.
Never assume the category implies a technical/network problem.

Analyze the actual subscriber complaint text first:
"{text}"

Determine:
1. What specifically happened to the subscriber?
2. What resource is affected?
   - network/service (broadband disconnects, 5G loss, outage, slow speeds, call drops)
   - billing/payment (double deduction, overcharge, unrecognized VAS, invoice error)
   - account (login issues, plan change, profile update, SIM swap)
   - device/equipment (router power red light, defective ONT, SIM hardware fault)
   - support process (delayed technician, installation follow-up)

3. What is the most plausible technical or operational cause?
4. What specific diagnostic/reconciliation steps should an operations agent take next?
5. What clear, empathetic response should be sent to the subscriber?

CRITICAL PRODUCTION RULES:
1. "incident_summary": Give an IMMEDIATE concrete summary specifying exact amounts, fee names, or technical symptoms from complaint text (e.g. "The current invoice contains two separate billing concerns: a duplicate ₹1,499 card charge and an additional ₹299 VAS fee...").
2. "likely_cause": Core technical/operational hypothesis string ONLY. Do NOT include 'Primary Hypothesis:' prefix.
3. "alternative_causes": Provide 2-3 ranked secondary possibilities (e.g. ["One ₹1,499 transaction is a temporary card authorization hold", "Payment posting occurred twice during billing cycle", "₹299 VAS was activated without subscriber authorization"]).
4. "recommended_actions": 3-5 step-by-step operational actions for an agent.
5. "customer_impact": Specific impact explanation with actual amounts or symptoms (e.g. "MEDIUM — Potential ₹1,499 duplicate charge plus an unrecognized ₹299 fee. No service interruption reported.").
6. "customer_response": DO NOT PROMISE GUARANTEED REFUNDS OR AUTOMATIC CREDITS! State that payment records and invoice history are being reviewed to determine whether an adjustment is required.
7. "resolution_basis": Provide operational reasoning connecting the complaint anomalies with SOP and historical cases (e.g. "The complaint contains two distinct billing anomalies. Historical double-billing and payment-related cases support reconciling the payment ledger before making an adjustment.").

GROUNDING EVIDENCE:
Historical Matching Tickets:
{hist_text}

SOP Grounding Context:
{kb_context if kb_context else 'Standard Telecom Operating Procedure'}

Target SLA: {sla_hours} hours

Return ONLY a raw JSON object with EXACTLY these 7 keys (no markdown wrapping, no code blocks):
{{
  "incident_summary": "Concrete operational summary specifying figures, fees, or symptoms from complaint text.",
  "likely_cause": "Core technical or operational hypothesis string.",
  "alternative_causes": [
    "Ranked secondary possibility 1",
    "Ranked secondary possibility 2",
    "Ranked secondary possibility 3"
  ],
  "recommended_actions": [
    "Domain-specific operational action 1",
    "Domain-specific operational action 2",
    "Domain-specific operational action 3",
    "Domain-specific operational action 4"
  ],
  "customer_impact": "Severity level + concrete impact explanation (e.g. MEDIUM — Potential ₹1,499 duplicate charge plus an unrecognized ₹299 fee. No service interruption reported.).",
  "customer_response": "Safe, realistic subscriber response without unverified refund promises.",
  "resolution_basis": "Operational reasoning explaining why this workflow was selected based on complaint anomalies and historical cases."
}}"""

    try:
        raw = await async_ask_ai(llm_prompt)
        if raw:
            import re
            clean = raw.strip()
            clean = re.sub(r'```(?:json)?', '', clean).strip()
            s, e  = clean.find("{"), clean.rfind("}") + 1
            if s != -1 and e > s:
                clean = clean[s:e]
            clean = re.sub(r',\s*([\]}])', r'\1', clean)
            data = json.loads(clean)
        else:
            data = {}

        incident_summary    = data.get("incident_summary", "").strip()
        likely_cause        = data.get("likely_cause", "").replace("Primary Hypothesis:", "").replace("Primary hypothesis:", "").strip()
        alternative_causes  = data.get("alternative_causes", [])
        recommended_actions = data.get("recommended_actions", [])
        customer_impact     = data.get("customer_impact", "").strip()
        customer_response   = data.get("customer_response", "").strip()
        resolution_basis    = data.get("resolution_basis", "").strip()

        if not (incident_summary and likely_cause):
            raise ValueError("Incomplete JSON fields from LLM")

    except Exception as exc:
        print(f"ℹ️ LLM fallback triggered ({exc}). Generating context-grounded structured analysis.")
        cat_lower = (category + " " + text).lower()
        if any(kw in cat_lower for kw in ["bill", "charge", "refund", "invoice", "vas", "debit", "overcharge", "payment", "rupee", "₹", "card"]):
            incident_summary    = "The current invoice contains billing concerns regarding potential duplicate card charges and unrecognized fee line-items. The immediate task is to reconcile payment transactions and verify fee provenance."
            likely_cause        = "Duplicate payment capture or duplicate billing entry"
            alternative_causes  = [
                "One payment transaction is a temporary card authorization hold",
                "Payment posting occurred twice during the billing cycle",
                "VAS fee was activated without clear subscriber authorization"
            ]
            recommended_actions = [
                "Reconcile payment transactions against the payment ledger",
                "Determine whether transactions are pending authorization or captured",
                "Identify activation source and date of unrecognized VAS charges",
                "Apply appropriate billing adjustment only after ledger verification",
                "Escalate to billing reconciliation if transactions cannot be matched automatically"
            ]
            customer_impact     = "MEDIUM — Potential duplicate charge plus an unrecognized fee. No service interruption reported."
            customer_response   = f"We've identified billing items requiring verification on your statement. We're checking payment records and invoice history to determine whether an adjustment is required. Target resolution: within {sla_hours} hours."
            resolution_basis    = "The complaint contains distinct billing anomalies. Historical double-billing and payment-related cases support reconciling the payment ledger and invoice history before making any account adjustment."
        elif any(kw in cat_lower for kw in ["account", "cancel", "login", "password", "sim"]):
            incident_summary    = "Subscriber reported an account management query requiring identity verification and subscription profile review."
            likely_cause        = "Account profile discrepancy or service provision configuration lock"
            alternative_causes  = [
                "Authentication portal credential mismatch",
                "Pending account provision request in workflow queue",
                "Subscription tier status lock"
            ]
            recommended_actions = [
                "Verify subscriber identity and active account profile status",
                "Check provision logs for pending plan changes or service requests",
                "Reset account access credentials or update subscription status in billing system",
                "Confirm resolution with subscriber and log account update"
            ]
            customer_impact     = "LOW — Administrative account query or access request. No service outage reported."
            customer_response   = f"We are reviewing your account profile and subscription status. Target resolution: within {sla_hours} hours."
            resolution_basis    = "Historical account service cases and standard account administration SOPs support verifying identity and account provision logs."
        else:
            incident_summary    = "Subscriber reported recurring signal degradation or connectivity interruption requiring technical diagnostic review."
            likely_cause        = f"{category} service line degradation or equipment signal instability"
            alternative_causes  = [
                "Regional network node congestion during peak hours",
                "Optical line / port degradation or physical cable attenuation",
                "Premises equipment / router setting misconfiguration"
            ]
            recommended_actions = [
                f"Run automated {category} line diagnostics",
                "Check recent loss-of-signal events & gateway metrics",
                "Cross-reference active regional network outage alerts",
                f"Escalate to NOC / field engineering if metrics abnormal (Target SLA: {sla_hours} hours)"
            ]
            customer_impact     = f"{priority} — Service disruption reported affecting subscriber connectivity."
            customer_response   = f"We have initiated a technical investigation into your connection. We will remotely diagnose your line and optical signal. Target resolution: within {sla_hours} hours."
            resolution_basis    = f"{len(similar_issues)} historical complaints matched. Grounded in Telecom Network SOPs."

    if likely_cause.lower().startswith("primary hypothesis:"):
        likely_cause = likely_cause[19:].strip()

    if not isinstance(alternative_causes, list):
        alternative_causes = [str(alternative_causes)]
    if not isinstance(recommended_actions, list):
        recommended_actions = [str(recommended_actions)]

    state["incident_summary"]    = incident_summary or f"Incident reported regarding {category}. Priority {priority}."
    state["likely_cause"]        = likely_cause or f"{category} Operational Instability"
    state["alternative_causes"]  = alternative_causes
    state["recommended_actions"] = recommended_actions
    state["customer_impact"]     = customer_impact or f"{priority} Impact"
    state["customer_response"]   = customer_response or f"Your {category} issue has been registered. Target SLA: {sla_hours} hours."
    state["resolution_basis"]    = resolution_basis or f"{len(similar_issues)} historical complaints matched. Grounded in Telecom SOPs."

    # Backward compatibility mapping
    state["ticket_summary"]      = state["incident_summary"]
    state["response"]            = state["customer_response"]
    state["action"]              = state["likely_cause"]
    state["solution"]            = "\n".join([f"{i+1}. {act}" for i, act in enumerate(state["recommended_actions"])])

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

async def run_agent_pipeline(text: str, user_language: str = "english", user_category: str = None, user_priority: str = "MEDIUM") -> dict:
    """
    Execute the LangGraph complaint intelligence pipeline.
    """
    # Seed the initial state
    initial_state: ComplaintState = {
        "text":          text,
        "user_priority": user_priority or "MEDIUM",
        "steps": [
            {"step": "Input Validation", "status": "Complaint received — running LangGraph pipeline"},
        ],
    }
    if user_category and user_category.strip():
        initial_state["category"] = user_category.strip()

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
        "incident_summary":      final_state.get("incident_summary",      final_state.get("ticket_summary", "")),
        "likely_cause":          final_state.get("likely_cause",          final_state.get("action", "")),
        "alternative_causes":    final_state.get("alternative_causes",    []),
        "recommended_actions":   final_state.get("recommended_actions",   []),
        "customer_impact":       final_state.get("customer_impact",       ""),
        "customer_response":     final_state.get("customer_response",     final_state.get("response", "")),
        "resolution_basis":      final_state.get("resolution_basis",      ""),
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
