"""
Speaker Identification Agent — TelecomIQ
Parses multi-speaker transcripts/complaint threads and tags each segment with
the identified speaker. Handles common transcript formats:

  - Labeled turns:   "Agent: ...", "Customer: ...", "Tech Support: ..."
  - Chat format:     "[10:32] Agent: ...", "User > ..."
  - Email chains:    "From: ...", "On <date>, <name> wrote:"
  - Raw text:        heuristic classification of customer vs. agent utterances
"""

import re
from typing import Dict, List, Optional, Tuple


# --------------------------------------------------------------------------- #
# Speaker label normalisers                                                    #
# --------------------------------------------------------------------------- #
AGENT_LABELS = {
    "agent", "support", "csr", "representative", "rep", "executive",
    "tech", "technical support", "technician", "operator", "staff",
    "admin", "system", "bot", "telecomiq", "ivr", "helpdesk", "service",
}

CUSTOMER_LABELS = {
    "customer", "user", "client", "subscriber", "caller", "me", "i",
    "complainant", "member",
}


def _normalise_speaker(raw: str) -> str:
    """Map raw label text to a canonical speaker role."""
    key = raw.strip().lower()
    if key in AGENT_LABELS or any(a in key for a in AGENT_LABELS):
        return "Agent"
    if key in CUSTOMER_LABELS or any(c in key for c in CUSTOMER_LABELS):
        return "Customer"
    # Proper-name detection heuristic (Title Case, single/two words)
    if re.match(r"^[A-Z][a-z]+(?:\s[A-Z][a-z]+)?$", raw.strip()):
        return raw.strip()   # keep name as-is
    return raw.strip().title()


# --------------------------------------------------------------------------- #
# Transcript parsing patterns                                                  #
# --------------------------------------------------------------------------- #

# Pattern 1 — "[HH:MM] Speaker: text"  or  "[HH:MM:SS] Speaker: text"
_TS_LABELED   = re.compile(
    r"^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s+([^:]+):\s*(.+)$", re.MULTILINE)

# Pattern 2 — "Speaker: text"  (no timestamp)
_LABELED      = re.compile(r"^([^:\n]{1,40}):\s+(.+)$", re.MULTILINE)

# Pattern 3 — "Speaker > text"  (Slack / chat style)
_ARROW        = re.compile(r"^([^>\n]{1,40})\s*>\s*(.+)$", re.MULTILINE)

# Pattern 4 — Email "From: Name <email>" or "On <date>, Name wrote:"
_EMAIL_FROM   = re.compile(
    r"^(?:From|from):\s*(.+?)(?:\s*<[^>]+>)?\s*$", re.MULTILINE)
_EMAIL_WROTE  = re.compile(
    r"On .+?,\s+(.+?)\s+wrote:", re.MULTILINE)


def _parse_labeled_transcript(text: str) -> Optional[List[Dict]]:
    """Try to parse a labeled multi-speaker transcript."""
    segments: List[Dict] = []

    # Try timestamp + label format first
    ts_matches = list(_TS_LABELED.finditer(text))
    if ts_matches:
        for i, m in enumerate(ts_matches):
            timestamp, raw_speaker, content = m.group(1), m.group(2), m.group(3)
            segments.append({
                "speaker":    _normalise_speaker(raw_speaker),
                "raw_label":  raw_speaker.strip(),
                "text":       content.strip(),
                "timestamp":  timestamp,
                "segment_id": i + 1,
                "start_char": m.start(),
                "end_char":   m.end(),
            })
        return segments

    # Try plain "Speaker: text"
    labeled_matches = list(_LABELED.finditer(text))
    if len(labeled_matches) >= 2:
        for i, m in enumerate(labeled_matches):
            raw_speaker, content = m.group(1), m.group(2)
            # Skip if "speaker" looks like a URL or sentence fragment
            if len(raw_speaker.split()) > 4 or "http" in raw_speaker:
                continue
            segments.append({
                "speaker":    _normalise_speaker(raw_speaker),
                "raw_label":  raw_speaker.strip(),
                "text":       content.strip(),
                "timestamp":  None,
                "segment_id": i + 1,
                "start_char": m.start(),
                "end_char":   m.end(),
            })
        if len(segments) >= 2:
            return segments

    # Try arrow style
    arrow_matches = list(_ARROW.finditer(text))
    if len(arrow_matches) >= 2:
        for i, m in enumerate(arrow_matches):
            raw_speaker, content = m.group(1), m.group(2)
            segments.append({
                "speaker":    _normalise_speaker(raw_speaker),
                "raw_label":  raw_speaker.strip(),
                "text":       content.strip(),
                "timestamp":  None,
                "segment_id": i + 1,
                "start_char": m.start(),
                "end_char":   m.end(),
            })
        return segments

    return None


def _parse_email_chain(text: str) -> Optional[List[Dict]]:
    """Parse email chain format."""
    segments: List[Dict] = []
    # Split on email reply markers
    blocks = re.split(r"(?m)^[-]{5,}|^_{5,}|(?=On .+? wrote:)", text)
    for i, block in enumerate(blocks):
        if not block.strip():
            continue
        # Try to find "From:" or "wrote:" speaker
        from_m = _EMAIL_FROM.search(block)
        wrote_m = _EMAIL_WROTE.search(block)
        speaker = None
        if from_m:
            speaker = _normalise_speaker(from_m.group(1))
        elif wrote_m:
            speaker = _normalise_speaker(wrote_m.group(1))

        content = re.sub(r"^(From|On|To|Subject|Date|Cc):.+$", "", block, flags=re.MULTILINE).strip()
        if content and speaker:
            segments.append({
                "speaker":    speaker,
                "raw_label":  speaker,
                "text":       content,
                "timestamp":  None,
                "segment_id": i + 1,
                "start_char": None,
                "end_char":   None,
            })

    return segments if len(segments) >= 2 else None


def _heuristic_single_speaker(text: str) -> List[Dict]:
    """
    For plain-text complaints with no speaker labels, treat the whole text
    as a single Customer segment.
    """
    return [{
        "speaker":    "Customer",
        "raw_label":  "Customer",
        "text":       text.strip(),
        "timestamp":  None,
        "segment_id": 1,
        "start_char": 0,
        "end_char":   len(text),
    }]


async def identify_speakers(text: str) -> Dict:
    """
    Identify and tag speakers in a complaint or transcript text.

    Returns:
    {
        "is_multi_speaker": True/False,
        "transcript_format": "labeled" | "email_chain" | "single_speaker",
        "speakers": ["Agent", "Customer"],           # unique speakers found
        "segments": [
            {
                "segment_id": 1,
                "speaker":    "Customer",
                "text":       "My internet has been down since yesterday.",
                "timestamp":  "10:32",               # None if not present
                "start_char": 0,
                "end_char":   50
            },
            ...
        ],
        "speaker_stats": {
            "Customer": {"segment_count": 3, "total_chars": 420},
            "Agent":    {"segment_count": 2, "total_chars": 310},
        }
    }
    """
    if not text or not text.strip():
        return _empty_speaker_result()

    # Try labeled transcript first
    segments = _parse_labeled_transcript(text)
    fmt = "labeled"

    if not segments:
        # Try email chain
        segments = _parse_email_chain(text)
        fmt = "email_chain"

    if not segments:
        # Fall back to single-speaker
        segments = _heuristic_single_speaker(text)
        fmt = "single_speaker"

    # Compute stats
    unique_speakers: List[str] = []
    stats: Dict[str, Dict] = {}
    for seg in segments:
        sp = seg["speaker"]
        if sp not in unique_speakers:
            unique_speakers.append(sp)
        if sp not in stats:
            stats[sp] = {"segment_count": 0, "total_chars": 0}
        stats[sp]["segment_count"] += 1
        stats[sp]["total_chars"] += len(seg["text"])

    is_multi = len(unique_speakers) > 1

    return {
        "is_multi_speaker":  is_multi,
        "transcript_format": fmt,
        "speakers":          unique_speakers,
        "segments":          segments,
        "speaker_stats":     stats,
    }


def _empty_speaker_result() -> Dict:
    return {
        "is_multi_speaker":  False,
        "transcript_format": "single_speaker",
        "speakers":          ["Customer"],
        "segments":          [],
        "speaker_stats":     {},
    }
