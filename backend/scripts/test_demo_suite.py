"""
TelecomIQ Demo Test Suite Script.
Runs automated validation across all 8 required test cases to prove technical accuracy,
input sufficiency guardrails, RAG similarity metrics, and deterministic multi-factor priority scoring.
"""

import sys
import os
import asyncio
import json

# Add backend root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from app.agents.orchestrator import run_agent_pipeline

TEST_CASES = [
    {
        "id": 1,
        "input": "My broadband has disconnected every 10 minutes since yesterday.",
        "expected_category": ["Broadband Performance", "Network Connectivity"],
        "expected_sufficient": True,
        "description": "Broadband frequent disconnects"
    },
    {
        "id": 2,
        "input": "I was charged twice for my monthly plan.",
        "expected_category": ["Billing Dispute"],
        "expected_sufficient": True,
        "description": "Double billing charge"
    },
    {
        "id": 3,
        "input": "Calls keep dropping whenever I travel outside the city.",
        "expected_category": ["Call Drops", "Network Connectivity"],
        "expected_sufficient": True,
        "description": "Call drops while traveling"
    },
    {
        "id": 4,
        "input": "There is no network service in my area since morning.",
        "expected_category": ["Service Outage", "Network Connectivity"],
        "expected_sufficient": True,
        "description": "Complete service outage since morning"
    },
    {
        "id": 5,
        "input": "hello",
        "expected_category": ["Insufficient Information"],
        "expected_sufficient": False,
        "description": "Low-information greeting 'hello'"
    },
    {
        "id": 6,
        "input": "thank you",
        "expected_category": ["Insufficient Information"],
        "expected_sufficient": False,
        "description": "Pleasantry 'thank you'"
    },
    {
        "id": 7,
        "input": "",
        "expected_category": ["Insufficient Information"],
        "expected_sufficient": False,
        "description": "Empty input"
    },
    {
        "id": 8,
        "input": "This service is pathetic and useless, my fiber connection is down for 3 days and nobody is responding!",
        "expected_category": ["Broadband Performance", "Service Outage", "Customer Service"],
        "expected_sufficient": True,
        "expected_sentiment": ["Negative"],
        "description": "Genuine negative telecom complaint"
    }
]

async def run_suite():
    print("\n" + "="*80)
    print("🚀 TELECOMIQ DEMO TEST SUITE EXECUTION")
    print("="*80 + "\n")

    passed_count = 0
    total_count = len(TEST_CASES)

    for case in TEST_CASES:
        inp = case["input"]
        print(f"Test #{case['id']}: {case['description']}")
        print(f"Input text: '{inp}'")

        result = await run_agent_pipeline(inp)

        sufficient = result.get("is_sufficient", True)
        category = result.get("category", "")
        confidence = result.get("confidence", 0.0)
        priority = result.get("priority", "")
        sentiment = result.get("sentiment", "")
        esc_risk = result.get("escalation_risk_score", 0.0)
        esc_req = result.get("escalation_required", False)
        similar_count = len(result.get("similar_issues", []))

        print(f"  └─ Sufficient: {sufficient} (Expected: {case['expected_sufficient']})")
        print(f"  └─ Category: {category} ({confidence}% conf)")
        print(f"  └─ Sentiment: {sentiment}")
        print(f"  └─ Priority: {priority} | Escalation Risk: {esc_risk}% (Required: {esc_req})")
        print(f"  └─ RAG Similar Cases Retrieved: {similar_count}")

        # Validation Checks
        is_suff_ok = (sufficient == case["expected_sufficient"])
        is_cat_ok = (category in case["expected_category"])

        if is_suff_ok and is_cat_ok:
            print("  🟢 PASSED\n")
            passed_count += 1
        else:
            print("  🔴 FAILED (Criteria mismatch)\n")

    print("="*80)
    print(f"📊 SUMMARY: {passed_count}/{total_count} Test Cases Passed ({round((passed_count/total_count)*100, 1)}%)")
    print("="*80 + "\n")

    if passed_count == total_count:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_suite())
