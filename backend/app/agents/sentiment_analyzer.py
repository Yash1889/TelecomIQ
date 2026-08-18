from textblob import TextBlob

ANGRY_KEYWORDS = [
    "unacceptable", "furious", "pathetic", "worst", "fraud", "scam", "useless",
    "terrible", "disgusting", "horrible", "shameful", "sue", "legal", "court",
    "stole", "cheated", "lawyer", "consumer court", "ridiculous", "hopeless"
]

NEGATIVE_KEYWORDS = [
    "bad", "poor", "slow", "down", "failing", "broken", "issue", "problem",
    "delay", "disconnect", "dropped", "cut", "error", "fault", "not working",
    "frustrated", "disappointed", "annoyed", "unable"
]

POSITIVE_KEYWORDS = [
    "good", "great", "thank", "thanks", "excellent", "happy", "appreciate",
    "solved", "helpful", "resolved", "awesome", "perfect", "satisfied"
]

async def analyze_sentiment(text: str) -> dict:
    """
    Perform genuine sentiment analysis on telecom complaint text.
    Returns dict with 'sentiment' (Positive, Neutral, Negative, Angry),
    'score' (-1.0 to 1.0), and 'confidence' (float %).
    """
    if not text or not text.strip():
        return {"sentiment": "Neutral", "score": 0.0, "confidence": 50.0}

    text_lower = text.lower()
    
    # Calculate polarity using TextBlob
    try:
        blob = TextBlob(text)
        polarity = float(blob.sentiment.polarity)
        subjectivity = float(blob.sentiment.subjectivity)
    except Exception:
        polarity = 0.0
        subjectivity = 0.5

    # Check explicit emotion keyword counts
    angry_count = sum(1 for w in ANGRY_KEYWORDS if w in text_lower)
    neg_count = sum(1 for w in NEGATIVE_KEYWORDS if w in text_lower)
    pos_count = sum(1 for w in POSITIVE_KEYWORDS if w in text_lower)

    if angry_count >= 1 or polarity <= -0.5:
        sentiment = "Angry"
        score = max(-1.0, min(-0.7, polarity - (0.2 * angry_count)))
        confidence = min(99.0, 75.0 + (angry_count * 10.0))
    elif neg_count >= 1 or polarity < -0.05:
        sentiment = "Negative"
        score = max(-0.7, min(-0.2, polarity - (0.1 * neg_count)))
        confidence = min(95.0, 68.0 + (neg_count * 5.0))
    elif pos_count >= 1 or polarity > 0.2:
        sentiment = "Positive"
        score = min(1.0, max(0.3, polarity))
        confidence = min(95.0, 70.0 + (pos_count * 5.0))
    else:
        sentiment = "Neutral"
        score = 0.0
        confidence = 65.0

    return {
        "sentiment": sentiment,
        "score": round(score, 2),
        "confidence": round(confidence, 1)
    }
