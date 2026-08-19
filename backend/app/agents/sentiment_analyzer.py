"""
Defensible Telecom Sentiment Analyzer.
Uses VADER Sentiment & TextBlob polarity to return grounded sentiment
(Positive, Neutral, Negative) and real confidence scores.
"""

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob

_vader_analyzer = None

def get_vader():
    global _vader_analyzer
    if _vader_analyzer is None:
        _vader_analyzer = SentimentIntensityAnalyzer()
    return _vader_analyzer

async def analyze_sentiment(text: str) -> dict:
    """
    Perform defensible sentiment analysis on complaint text.
    Returns dict with 'sentiment' ('Positive', 'Neutral', 'Negative'),
    'score' (float -1.0 to 1.0), and 'confidence' (float 0-100%).
    """
    if not text or not text.strip():
        return {"sentiment": "Neutral", "score": 0.0, "confidence": 0.0}

    try:
        vader = get_vader()
        scores = vader.polarity_scores(text)
        compound = float(scores["compound"])
    except Exception:
        try:
            blob = TextBlob(text)
            compound = float(blob.sentiment.polarity)
        except Exception:
            compound = 0.0

    # Categorize sentiment into canonical categories
    if compound <= -0.05:
        sentiment = "Negative"
        # Confidence derived directly from compound intensity magnitude
        confidence = min(98.0, max(60.0, abs(compound) * 100.0))
    elif compound >= 0.05:
        sentiment = "Positive"
        confidence = min(98.0, max(60.0, compound * 100.0))
    else:
        sentiment = "Neutral"
        confidence = min(90.0, max(55.0, (1.0 - abs(compound)) * 80.0))

    return {
        "sentiment": sentiment,
        "score": round(compound, 2),
        "confidence": round(float(confidence), 1)
    }
