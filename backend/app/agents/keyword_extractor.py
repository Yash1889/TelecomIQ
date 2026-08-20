"""
Keyword & Keyphrase Extraction Agent — TelecomIQ
Uses YAKE (Yet Another Keyword Extractor) for unsupervised keyword extraction
plus TF-IDF top-term identification and domain-specific telecom keyword boosting.
"""

import re
from collections import Counter
from typing import Dict, List, Tuple

# --------------------------------------------------------------------------- #
# YAKE extractor — lazy-loaded singleton                                       #
# --------------------------------------------------------------------------- #
_yake_extractor = None

def _get_yake():
    global _yake_extractor
    if _yake_extractor is None:
        try:
            import yake
            # n=2 → extract unigrams + bigrams, top=15
            _yake_extractor = yake.KeywordExtractor(
                lan="en",
                n=2,
                dedupLim=0.7,
                dedupFunc="seqm",
                windowsSize=2,
                top=15,
            )
            print("✅ YAKE keyword extractor loaded")
        except Exception as e:
            print(f"⚠️  YAKE unavailable: {e}")
            _yake_extractor = False
    return _yake_extractor if _yake_extractor else None


# --------------------------------------------------------------------------- #
# Domain-specific telecom stop words (boost signal by filtering noise)        #
# --------------------------------------------------------------------------- #
TELECOM_STOP_WORDS = {
    "please", "hello", "hi", "dear", "sir", "madam", "i", "me", "my", "we",
    "you", "your", "he", "she", "it", "they", "this", "that", "these", "those",
    "is", "am", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "shall", "should", "may",
    "might", "must", "can", "could", "get", "got", "make", "made", "let",
    "use", "used", "need", "want", "know", "think", "come", "go", "take",
    "see", "look", "find", "give", "tell", "say", "said", "ask",
    "kindly", "regards", "thanks", "thank", "good", "new", "also",
    "much", "many", "more", "most", "very", "just", "still", "even",
    "last", "since", "already", "now", "always", "never", "every", "any",
}

# Telecom domain keywords to always surface if present
TELECOM_DOMAIN_KEYWORDS = [
    "call drop", "signal strength", "network coverage", "internet speed", "broadband",
    "fiber optic", "data limit", "fair usage policy", "fup", "volte", "5g", "4g",
    "sim card", "billing dispute", "overcharge", "refund", "roaming charges",
    "service outage", "downtime", "disconnected", "latency", "ping", "bandwidth",
    "router", "modem", "ont", "wifi", "hotspot", "data pack", "prepaid", "postpaid",
    "installation", "technician", "port out", "mnp", "number portability",
    "customer service", "escalation", "complaint", "resolution", "ticket",
]


def _clean_keyword(kw: str) -> str:
    """Remove trailing punctuation, lowercase."""
    return re.sub(r"[^\w\s-]", "", kw).strip().lower()


def _extract_domain_keywords(text: str) -> List[str]:
    """Scan text for telecom domain keywords."""
    text_lower = text.lower()
    found = []
    for kw in TELECOM_DOMAIN_KEYWORDS:
        if kw in text_lower and kw not in found:
            found.append(kw)
    return found


def _simple_tfidf_topwords(text: str, top_n: int = 8) -> List[str]:
    """
    Simple TF-based term frequency fallback (no corpus needed).
    Filters stop words, returns top-n terms by frequency.
    """
    tokens = re.findall(r"\b[a-z]{3,}\b", text.lower())
    filtered = [t for t in tokens if t not in TELECOM_STOP_WORDS]
    freq = Counter(filtered)
    return [word for word, _ in freq.most_common(top_n)]


async def extract_keywords(text: str, top_n: int = 10) -> Dict:
    """
    Extract top keywords and keyphrases from complaint/transcript text.

    Returns:
    {
        "keywords":      ["broadband speed", "call drop", ...],   # top keyphrases
        "domain_terms":  ["signal strength", "fup", ...],         # telecom-specific terms found
        "scores":        {"broadband speed": 0.09, ...},          # lower YAKE score = more relevant
        "keyword_count": 8
    }
    """
    if not text or not text.strip():
        return {"keywords": [], "domain_terms": [], "scores": {}, "keyword_count": 0}

    keywords: List[str] = []
    scores: Dict[str, float] = {}

    # ------------------------------------------------------------------ #
    # YAKE extraction                                                      #
    # ------------------------------------------------------------------ #
    yake = _get_yake()
    if yake:
        try:
            raw_kws: List[Tuple[str, float]] = yake.extract_keywords(text)
            for kw, score in raw_kws:
                cleaned = _clean_keyword(kw)
                if cleaned and cleaned not in TELECOM_STOP_WORDS and len(cleaned) > 2:
                    keywords.append(cleaned)
                    scores[cleaned] = round(float(score), 4)
        except Exception as e:
            print(f"⚠️  YAKE extraction error: {e}")

    # ------------------------------------------------------------------ #
    # Fallback: simple frequency if YAKE failed                           #
    # ------------------------------------------------------------------ #
    if not keywords:
        keywords = _simple_tfidf_topwords(text, top_n)
        scores = {kw: 0.0 for kw in keywords}

    # ------------------------------------------------------------------ #
    # Domain keyword surfacing (always add telecom-specific matches)      #
    # ------------------------------------------------------------------ #
    domain_terms = _extract_domain_keywords(text)

    # Merge domain terms into keywords list (de-duplicated, domain terms first)
    merged: List[str] = domain_terms[:]
    for kw in keywords:
        if kw not in merged:
            merged.append(kw)

    # Trim to top_n
    final_keywords = merged[:top_n]

    return {
        "keywords":      final_keywords,
        "domain_terms":  domain_terms,
        "scores":        {k: scores.get(k, 0.0) for k in final_keywords},
        "keyword_count": len(final_keywords),
    }
