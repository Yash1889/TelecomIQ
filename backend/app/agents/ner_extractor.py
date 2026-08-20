"""
Named Entity Recognition (NER) Agent — TelecomIQ
Extracts structured entities from complaint/transcript text using spaCy en_core_web_sm.
Identifies: people, organizations, locations, products, dates, money, and telecom-specific entities.
"""

import re
from typing import Dict, List

# --------------------------------------------------------------------------- #
# spaCy model — lazy-loaded singleton                                          #
# --------------------------------------------------------------------------- #
_nlp = None

def _get_nlp():
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
            print("✅ spaCy NER model loaded (en_core_web_sm)")
        except Exception as e:
            print(f"⚠️  spaCy NER model unavailable: {e}")
            _nlp = False          # sentinel — don't retry
    return _nlp if _nlp else None


# --------------------------------------------------------------------------- #
# Telecom-domain regex patterns (supplement spaCy for domain-specific signals) #
# --------------------------------------------------------------------------- #
TELECOM_OPERATORS = [
    r"\b(airtel|jio|vi|vodafone|idea|bsnl|mtnl|reliance|tata\s+tele|act\s+fibernet|"
    r"excitel|hathway|comcast|at&t|verizon|t-mobile|tmobile|sprint|bell|rogers|"
    r"telstra|optus|vodacom|mtn|orange|bouygues|deutsche\s+telekom|o2|ee|bt\b|"
    r"xfinity|spectrum|cox|centurylink|lumen|frontier)\b"
]

PLAN_PRODUCT_PATTERNS = [
    r"\b(\d{1,4}\s*(?:gb|mb|tb)\s*(?:plan|pack|data|add[-\s]?on)?)\b",
    r"\b(prepaid|postpaid|unlimited|broadband|fiber|4g|5g|volte|iot)\s+(?:plan|pack|service|connection)?\b",
    r"\b(smart\s+?(?:pack|plan)|mega\s+?(?:pack|plan)|super\s+?(?:plan|pack))\b",
]

TICKET_ID_PATTERN = r"\bTC-[A-Z0-9-]+\b"
PHONE_PATTERN     = r"\b(?:\+?\d[\d\s\-()]{8,14}\d)\b"
MONEY_PATTERN     = r"\b(?:rs\.?|₹|\$|usd|inr)\s*[\d,]+(?:\.\d{1,2})?\b"
DATE_PATTERN      = (
    r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|"
    r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|"
    r"\d{4}-\d{2}-\d{2})\b"
)


def _regex_telecom_entities(text: str) -> Dict[str, List[str]]:
    """Extract telecom-specific entities via regex."""
    tl = text.lower()
    entities: Dict[str, List[str]] = {
        "operators": [],
        "plans_products": [],
        "ticket_ids": [],
        "phone_numbers": [],
        "monetary_amounts": [],
        "dates_regex": [],
    }

    for pat in TELECOM_OPERATORS:
        for m in re.finditer(pat, tl):
            val = m.group(0).strip().title()
            if val not in entities["operators"]:
                entities["operators"].append(val)

    for pat in PLAN_PRODUCT_PATTERNS:
        for m in re.finditer(pat, tl):
            val = m.group(0).strip()
            if val not in entities["plans_products"]:
                entities["plans_products"].append(val)

    for m in re.finditer(TICKET_ID_PATTERN, text):
        entities["ticket_ids"].append(m.group(0))

    for m in re.finditer(PHONE_PATTERN, text):
        entities["phone_numbers"].append(m.group(0).strip())

    for m in re.finditer(MONEY_PATTERN, tl):
        entities["monetary_amounts"].append(m.group(0).strip())

    for m in re.finditer(DATE_PATTERN, tl, re.IGNORECASE):
        entities["dates_regex"].append(m.group(0).strip())

    return entities


async def extract_entities(text: str) -> Dict:
    """
    Full NER extraction combining spaCy (general entities) + regex (telecom entities).

    Returns:
    {
        "persons":       ["Rahul Sharma", ...],
        "organizations": ["Airtel", "TRAI", ...],
        "locations":     ["Mumbai", "Delhi", ...],
        "products":      ["5G plan", ...],
        "dates":         ["2024-01-15", ...],
        "monetary":      ["₹500", ...],
        "phone_numbers": ["9876543210", ...],
        "ticket_ids":    ["TC-20240115-AB12", ...],
        "operators":     ["Airtel", "Jio", ...],
        "misc":          [...],          # any other spaCy entities
        "entity_count":  12
    }
    """
    if not text or not text.strip():
        return _empty_entities()

    result: Dict[str, List[str]] = {
        "persons":       [],
        "organizations": [],
        "locations":     [],
        "products":      [],
        "dates":         [],
        "monetary":      [],
        "phone_numbers": [],
        "ticket_ids":    [],
        "operators":     [],
        "misc":          [],
    }

    # ------------------------------------------------------------------ #
    # spaCy pass                                                           #
    # ------------------------------------------------------------------ #
    nlp = _get_nlp()
    if nlp:
        try:
            doc = nlp(text[:1024])   # cap at 1 k chars to keep latency low
            label_map = {
                "PERSON":  "persons",
                "ORG":     "organizations",
                "GPE":     "locations",   # geo-political entity (city, country)
                "LOC":     "locations",
                "FAC":     "locations",
                "PRODUCT": "products",
                "DATE":    "dates",
                "TIME":    "dates",
                "MONEY":   "monetary",
                "CARDINAL": None,
                "ORDINAL":  None,
            }
            for ent in doc.ents:
                key = label_map.get(ent.label_)
                if key and ent.text.strip() not in result[key]:
                    result[key].append(ent.text.strip())
                elif key is None:
                    pass
                else:
                    if ent.text.strip() not in result["misc"]:
                        result["misc"].append(f"{ent.label_}:{ent.text.strip()}")
        except Exception as e:
            print(f"⚠️  spaCy NER error: {e}")

    # ------------------------------------------------------------------ #
    # Regex telecom pass (merge without duplicates)                       #
    # ------------------------------------------------------------------ #
    regex_ents = _regex_telecom_entities(text)
    for op in regex_ents["operators"]:
        if op not in result["organizations"]:
            result["organizations"].append(op)
        if op not in result["operators"]:
            result["operators"].append(op)

    for pp in regex_ents["plans_products"]:
        if pp not in result["products"]:
            result["products"].append(pp)

    for tid in regex_ents["ticket_ids"]:
        if tid not in result["ticket_ids"]:
            result["ticket_ids"].append(tid)

    for ph in regex_ents["phone_numbers"]:
        if ph not in result["phone_numbers"]:
            result["phone_numbers"].append(ph)

    for mo in regex_ents["monetary_amounts"]:
        if mo not in result["monetary"]:
            result["monetary"].append(mo)

    for dt in regex_ents["dates_regex"]:
        if dt not in result["dates"]:
            result["dates"].append(dt)

    total = sum(len(v) for v in result.values())
    result["entity_count"] = total

    return result


def _empty_entities() -> Dict:
    return {
        "persons":       [],
        "organizations": [],
        "locations":     [],
        "products":      [],
        "dates":         [],
        "monetary":      [],
        "phone_numbers": [],
        "ticket_ids":    [],
        "operators":     [],
        "misc":          [],
        "entity_count":  0,
    }
