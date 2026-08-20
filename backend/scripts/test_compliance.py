"""
TelecomIQ Compliance & Privacy Monitor — Test Suite
Tests the compliance_monitor agent in isolation, then runs an end-to-end
pipeline test to confirm existing features still work alongside compliance.

Usage:
    cd backend
    python3 scripts/test_compliance.py
"""

import sys
import os
import asyncio
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from app.agents.compliance_monitor import run_compliance_check
from app.agents.orchestrator import run_agent_pipeline

PASS = "✅ PASS"
FAIL = "❌ FAIL"

results = []


def check(label: str, condition: bool, detail: str = "") -> bool:
    status = PASS if condition else FAIL
    print(f"  {status}  {label}" + (f"  [{detail}]" if detail else ""))
    results.append(condition)
    return condition


# ─────────────────────────────────────────────────────────────────────────────
# UNIT TESTS — compliance_monitor in isolation
# ─────────────────────────────────────────────────────────────────────────────

async def test_normal_complaint():
    """A clean complaint with no PII and no policy violations."""
    print("\n── Test 1: Normal complaint (no PII, no flags) ──")
    text = (
        "My broadband internet has been very slow for the past two days. "
        "The speed drops below 2 Mbps during peak hours. Please help."
    )
    res = await run_compliance_check(text)
    check("pii_detected is False",         res["pii_detected"] == False)
    check("compliance_flags is empty",     res["compliance_flags"] == [])
    check("risk_level is CLEAR",           res["risk_level"] == "CLEAR")
    check("compliance_action is NO_ACTION_REQUIRED",
          res["compliance_action"] == "NO_ACTION_REQUIRED")
    check("sensitive_content is False",    res["sensitive_content"] == False)
    check("policy_violation is False",     res["policy_violation"] == False)
    check("masked_text equals input",      res["masked_text"] == text)


async def test_pii_phone_and_email():
    """Complaint containing a phone number and email address."""
    print("\n── Test 2: Complaint with phone number and email ──")
    text = (
        "Hi, my name is Rahul. Please contact me at 9876543210 or "
        "rahul.sharma@example.com to resolve my billing dispute."
    )
    res = await run_compliance_check(text)
    check("pii_detected is True",          res["pii_detected"] == True)
    check("PHONE_NUMBER in pii_types",     "PHONE_NUMBER" in res["pii_types"],
          str(res["pii_types"]))
    check("EMAIL_ADDRESS in pii_types",    "EMAIL_ADDRESS" in res["pii_types"],
          str(res["pii_types"]))
    check("masked_text hides phone",
          "9876543210" not in res["masked_text"],
          res["masked_text"][:80])
    check("masked_text hides email",
          "rahul.sharma@example.com" not in res["masked_text"],
          res["masked_text"][:80])
    check("risk_level is LOW",             res["risk_level"] == "LOW",
          res["risk_level"])
    check("compliance_action is MASK_PII", res["compliance_action"] == "MASK_PII",
          res["compliance_action"])


async def test_unauthorized_access_request():
    """Complaint attempting to access another customer's account."""
    print("\n── Test 3: Unauthorized account access request ──")
    text = (
        "Please give me access to my employee's account and share their "
        "address and billing details with me without their permission."
    )
    res = await run_compliance_check(text)
    check("policy_violation is True",      res["policy_violation"] == True)
    check("UNAUTHORIZED_ACCESS_REQUEST flagged",
          "UNAUTHORIZED_ACCESS_REQUEST" in res["compliance_flags"],
          str(res["compliance_flags"]))
    check("risk_level is CRITICAL",        res["risk_level"] == "CRITICAL",
          res["risk_level"])
    check("compliance_action contains BLOCK",
          "BLOCK" in res["compliance_action"],
          res["compliance_action"])
    check("recommended_actions not empty", len(res["recommended_actions"]) > 0)


async def test_fraud_indicator():
    """Complaint reporting a fraudulent charge."""
    print("\n── Test 4: Fraud/scam indicator ──")
    text = (
        "I never authorised this charge. This is a fraudulent transaction "
        "on my account. I think I was scammed by one of your agents."
    )
    res = await run_compliance_check(text)
    check("sensitive_content is True",     res["sensitive_content"] == True)
    check("FRAUD_SCAM_INDICATOR flagged",
          "FRAUD_SCAM_INDICATOR" in res["compliance_flags"],
          str(res["compliance_flags"]))
    check("risk_level is HIGH",            res["risk_level"] == "HIGH",
          res["risk_level"])
    check("recommended_actions mention Fraud team",
          any("Fraud" in r for r in res["recommended_actions"]))


async def test_threatening_language():
    """Complaint containing a legal threat."""
    print("\n── Test 5: Threatening language ──")
    text = (
        "I will sue your company and file a legal notice if this is not "
        "resolved by tomorrow. I am ready to go to consumer court."
    )
    res = await run_compliance_check(text)
    check("sensitive_content is True",     res["sensitive_content"] == True)
    check("THREATENING_LANGUAGE flagged",
          "THREATENING_LANGUAGE" in res["compliance_flags"],
          str(res["compliance_flags"]))
    check("risk_level is HIGH",            res["risk_level"] == "HIGH",
          res["risk_level"])
    check("compliance_action is ESCALATE_AND_REVIEW",
          res["compliance_action"] == "ESCALATE_AND_REVIEW",
          res["compliance_action"])


async def test_account_bypass_attempt():
    """Complaint trying to bypass OTP security."""
    print("\n── Test 6: Account bypass / security skip attempt ──")
    text = (
        "I lost my phone so please help me bypass otp and reset my account "
        "without verification. Just skip the two factor and give me access."
    )
    res = await run_compliance_check(text)
    check("policy_violation is True",      res["policy_violation"] == True)
    check("ACCOUNT_BYPASS_ATTEMPT flagged",
          "ACCOUNT_BYPASS_ATTEMPT" in res["compliance_flags"],
          str(res["compliance_flags"]))
    check("risk_level is CRITICAL",        res["risk_level"] == "CRITICAL",
          res["risk_level"])
    check("BLOCK in compliance_action",
          "BLOCK" in res["compliance_action"],
          res["compliance_action"])


async def test_ip_address_masking():
    """Complaint containing an IP address."""
    print("\n── Test 7: IP address masking ──")
    text = (
        "My router is showing connection failures from IP 192.168.1.105 "
        "and the gateway 10.0.0.1 is not responding since this morning."
    )
    res = await run_compliance_check(text)
    check("pii_detected is True",          res["pii_detected"] == True)
    check("IP_ADDRESS in pii_types",       "IP_ADDRESS" in res["pii_types"],
          str(res["pii_types"]))
    check("IP redacted in masked_text",
          "192.168.1.105" not in res["masked_text"])


async def test_empty_input():
    """Edge case: empty string."""
    print("\n── Test 8: Empty input edge case ──")
    res = await run_compliance_check("")
    check("pii_detected is False",     res["pii_detected"] == False)
    check("risk_level is CLEAR",       res["risk_level"] == "CLEAR")
    check("no exception raised",       True)


# ─────────────────────────────────────────────────────────────────────────────
# END-TO-END PIPELINE TEST
# Verifies existing features still work with compliance added
# ─────────────────────────────────────────────────────────────────────────────

async def test_end_to_end_pipeline():
    """
    Full orchestrator pipeline test.
    Checks that ALL existing + new features return without error.
    """
    print("\n── Test 9: End-to-end orchestrator pipeline ──")
    text = (
        "I am a Jio subscriber in Bangalore. My 4G data speed has been "
        "extremely slow for the past 3 days and I keep getting disconnected. "
        "I have also been charged Rs. 299 extra on my bill this month. "
        "Please call me at 9988776655 or email support@telecomiq.com to resolve urgently."
    )
    try:
        result = await run_agent_pipeline(text)
        check("is_sufficient is True",
              result.get("is_sufficient") == True)
        check("category returned",
              bool(result.get("category")))
        check("sentiment returned",
              bool(result.get("sentiment")))
        check("priority returned",
              bool(result.get("priority")))
        check("named_entities returned",
              isinstance(result.get("named_entities"), dict))
        check("keywords returned",
              isinstance(result.get("keywords"), dict))
        check("speaker_analysis returned",
              isinstance(result.get("speaker_analysis"), dict))
        check("time_segmentation returned",
              isinstance(result.get("time_segmentation"), dict))
        check("compliance_analysis returned",
              isinstance(result.get("compliance_analysis"), dict))

        ca = result.get("compliance_analysis", {})
        check("compliance pii_detected is True (phone + email in text)",
              ca.get("pii_detected") == True,
              str(ca.get("pii_types")))
        check("PHONE_NUMBER detected",
              "PHONE_NUMBER" in ca.get("pii_types", []),
              str(ca.get("pii_types")))
        check("pipeline steps include Compliance Monitor",
              any(s.get("step") == "Compliance Monitor"
                  for s in result.get("steps", [])))

        print("\n  📋 Compliance output sample:")
        print(json.dumps({
            "pii_detected":       ca.get("pii_detected"),
            "pii_types":          ca.get("pii_types"),
            "pii_count":          ca.get("pii_count"),
            "sensitive_content":  ca.get("sensitive_content"),
            "policy_violation":   ca.get("policy_violation"),
            "compliance_flags":   ca.get("compliance_flags"),
            "risk_level":         ca.get("risk_level"),
            "compliance_action":  ca.get("compliance_action"),
            "recommended_actions": ca.get("recommended_actions"),
        }, indent=4))

    except Exception as e:
        check(f"pipeline completed without exception (error: {e})", False)


# ─────────────────────────────────────────────────────────────────────────────
# Runner
# ─────────────────────────────────────────────────────────────────────────────

async def main():
    print("=" * 60)
    print("  TelecomIQ Compliance & Privacy Monitor — Test Suite")
    print("=" * 60)

    await test_normal_complaint()
    await test_pii_phone_and_email()
    await test_unauthorized_access_request()
    await test_fraud_indicator()
    await test_threatening_language()
    await test_account_bypass_attempt()
    await test_ip_address_masking()
    await test_empty_input()
    await test_end_to_end_pipeline()

    passed = sum(results)
    total  = len(results)
    print("\n" + "=" * 60)
    print(f"  Results: {passed}/{total} checks passed")
    if passed == total:
        print("  🎉 All checks passed!")
    else:
        print(f"  ⚠️  {total - passed} check(s) failed")
    print("=" * 60)

    return 0 if passed == total else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
