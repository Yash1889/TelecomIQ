"""
Time-Based Segmentation Agent — TelecomIQ
Maps complaint/transcript text into time-aware scenes or logical segments.

Handles:
- Explicit timestamps in transcript lines → scene-level metadata
- Date references in plain text → temporal context markers
- Paragraph/topic-shift segmentation when no timestamps are present
- Duration extraction (e.g. "since yesterday", "for 3 days")
"""

import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional


# --------------------------------------------------------------------------- #
# Regex patterns                                                               #
# --------------------------------------------------------------------------- #

# Matches HH:MM or HH:MM:SS (with optional brackets)
_INLINE_TS = re.compile(r"\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?")

# Full ISO / common date formats
_DATE_FULL = re.compile(
    r"\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b"
)

# Relative time references
_RELATIVE_TIME = re.compile(
    r"\b(yesterday|today|last\s+(?:week|month|year)|"
    r"(?:\d+)\s+(?:hour|day|week|month|year)s?\s+ago|"
    r"since\s+(?:morning|yesterday|last\s+\w+|[a-z]+day)|"
    r"for\s+(?:the\s+)?(?:past\s+)?(?:\d+\s+)?(?:hour|day|week|month|year)s?|"
    r"from\s+(?:yesterday|last\s+\w+))\b",
    re.IGNORECASE
)

# Duration patterns: "3 hours", "2 days", "a week"
_DURATION = re.compile(
    r"\b(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+"
    r"(?:hour|minute|day|week|month|year)s?\b",
    re.IGNORECASE
)

# Scene/paragraph split boundary keywords
_TOPIC_SHIFT_KWS = [
    r"\bfirstly\b", r"\bsecondly\b", r"\bthirdly\b",
    r"\bthen\b", r"\bafter\s+that\b", r"\blater\b",
    r"\bmeanwhile\b", r"\bhowever\b", r"\bmoreover\b",
    r"\bto\s+summarize\b", r"\bin\s+conclusion\b",
    r"\bnext\b", r"\bfinally\b", r"\bsubsequently\b",
]
_TOPIC_SHIFT_PAT = re.compile("|".join(_TOPIC_SHIFT_KWS), re.IGNORECASE)


# --------------------------------------------------------------------------- #
# Helpers                                                                      #
# --------------------------------------------------------------------------- #

def _seconds_from_ts(ts: str) -> int:
    """Convert HH:MM or HH:MM:SS to total seconds."""
    parts = [int(x) for x in ts.split(":")]
    if len(parts) == 2:
        return parts[0] * 3600 + parts[1] * 60
    return parts[0] * 3600 + parts[1] * 60 + parts[2]


def _extract_temporal_refs(text: str) -> List[Dict]:
    """Collect all temporal references (dates, relative times, durations) from text."""
    refs = []
    for m in _DATE_FULL.finditer(text):
        refs.append({"type": "absolute_date", "value": m.group(0), "position": m.start()})
    for m in _RELATIVE_TIME.finditer(text):
        refs.append({"type": "relative_time", "value": m.group(0).strip(), "position": m.start()})
    for m in _DURATION.finditer(text):
        # Avoid double-counting if already caught by relative
        overlap = any(abs(r["position"] - m.start()) < 5 for r in refs)
        if not overlap:
            refs.append({"type": "duration", "value": m.group(0).strip(), "position": m.start()})
    # Sort by position
    refs.sort(key=lambda x: x["position"])
    return refs


def _segment_by_timestamps(text: str) -> Optional[List[Dict]]:
    """
    If text contains inline timestamps (transcript format), split into
    timestamped segments and return scene-level metadata.
    """
    # Pattern: optional [HH:MM] at line start followed by content
    line_ts_pat = re.compile(
        r"^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s+)?(.+)$", re.MULTILINE
    )
    lines = text.strip().split("\n")
    segments = []
    last_ts = None
    seg_id = 1

    for line in lines:
        line = line.strip()
        if not line:
            continue
        ts_m = _INLINE_TS.match(line)
        if ts_m:
            last_ts = ts_m.group(1)
            content = line[ts_m.end():].strip()
        else:
            content = line

        if content:
            segments.append({
                "segment_id": seg_id,
                "timestamp":  last_ts,
                "start_sec":  _seconds_from_ts(last_ts) if last_ts else None,
                "text":       content,
                "char_start": text.find(line),
            })
            seg_id += 1

    # Only return if at least half lines had timestamps
    ts_count = sum(1 for s in segments if s["timestamp"])
    if ts_count >= max(1, len(segments) // 2):
        return segments
    return None


def _segment_by_paragraphs(text: str) -> List[Dict]:
    """
    Split text into logical segments by paragraph breaks and topic-shift keywords.
    Assign sequential segment IDs and temporal estimates.
    """
    # Split on double newlines or topic-shift keywords
    raw_blocks = re.split(r"\n{2,}", text.strip())
    segments = []
    seg_id = 1

    for block in raw_blocks:
        block = block.strip()
        if not block:
            continue
        # Further split on strong topic-shift keywords within a paragraph
        sub_blocks = _TOPIC_SHIFT_PAT.split(block)
        for sub in sub_blocks:
            sub = sub.strip()
            if len(sub) < 10:
                continue
            temporal_refs = _extract_temporal_refs(sub)
            segments.append({
                "segment_id":    seg_id,
                "timestamp":     None,
                "start_sec":     None,
                "text":          sub,
                "char_start":    text.find(sub),
                "temporal_refs": temporal_refs,
            })
            seg_id += 1

    if not segments:
        # Single-segment fallback
        temporal_refs = _extract_temporal_refs(text)
        segments = [{
            "segment_id":    1,
            "timestamp":     None,
            "start_sec":     None,
            "text":          text.strip(),
            "char_start":    0,
            "temporal_refs": temporal_refs,
        }]

    return segments


# --------------------------------------------------------------------------- #
# Public API                                                                   #
# --------------------------------------------------------------------------- #

async def segment_by_time(text: str) -> Dict:
    """
    Produce time-based segmentation metadata from a complaint or transcript.

    Returns:
    {
        "segmentation_type":  "timestamp" | "paragraph",
        "total_segments":     4,
        "temporal_references": [
            {"type": "relative_time", "value": "since yesterday", "position": 42},
            ...
        ],
        "duration_mentions": ["3 days", "2 hours"],
        "timeline_summary":  "Issue started ~3 days ago; escalated yesterday.",
        "segments": [
            {
                "segment_id":    1,
                "timestamp":     "10:32",     # None if paragraph-based
                "start_sec":     37920,        # seconds from midnight; None if absent
                "text":          "...",
                "char_start":    0,
                "temporal_refs": [...]         # temporal references within segment
            },
            ...
        ]
    }
    """
    if not text or not text.strip():
        return _empty_result()

    # Try timestamp-based segmentation
    ts_segments = _segment_by_timestamps(text)
    seg_type = "timestamp"

    if ts_segments:
        segments = ts_segments
        # Add temporal_refs per segment
        for seg in segments:
            seg["temporal_refs"] = _extract_temporal_refs(seg["text"])
    else:
        segments = _segment_by_paragraphs(text)
        seg_type = "paragraph"

    # Global temporal references
    all_temporal_refs = _extract_temporal_refs(text)
    duration_mentions = [r["value"] for r in all_temporal_refs if r["type"] == "duration"]

    # Build a brief timeline summary
    timeline_summary = _build_timeline_summary(all_temporal_refs, text)

    return {
        "segmentation_type":   seg_type,
        "total_segments":      len(segments),
        "temporal_references": all_temporal_refs,
        "duration_mentions":   duration_mentions,
        "timeline_summary":    timeline_summary,
        "segments":            segments,
    }


def _build_timeline_summary(temporal_refs: List[Dict], text: str) -> str:
    """Generate a 1-sentence summary of the temporal context."""
    if not temporal_refs:
        return "No specific time references detected in complaint text."

    types = [r["type"] for r in temporal_refs]
    values = [r["value"] for r in temporal_refs[:3]]  # first 3 mentions

    if "absolute_date" in types:
        return f"Complaint references specific dates: {', '.join(v for v in values if v)}."
    elif "relative_time" in types or "duration" in types:
        return f"Complaint references time context: {', '.join(values)}."
    return "Temporal references present but unstructured."


def _empty_result() -> Dict:
    return {
        "segmentation_type":   "paragraph",
        "total_segments":      0,
        "temporal_references": [],
        "duration_mentions":   [],
        "timeline_summary":    "No text provided.",
        "segments":            [],
    }
