import os
import pickle
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VECTOR_INDEX_PATH = os.path.join(BASE_DIR, "models", "vector_index.pkl")

_vector_store = None

def get_vector_store():
    global _vector_store
    if _vector_store is None and os.path.exists(VECTOR_INDEX_PATH):
        try:
            with open(VECTOR_INDEX_PATH, "rb") as f:
                _vector_store = pickle.load(f)
        except Exception as e:
            print(f"⚠️ Failed to load vector index: {e}")
    return _vector_store

async def find_similar_complaints(text: str, category: str = "", top_k: int = 3, current_ticket_id: str = "") -> list:
    """
    Perform genuine vector semantic search over historical telecom complaints.
    Returns top-K items with exact cosine similarity percentages.
    """
    if not text or not text.strip():
        return []

    store = get_vector_store()
    if not store:
        return []

    try:
        vectorizer = store["vectorizer"]
        matrix = store["matrix"]
        complaints = store["complaints"]

        query_vec = vectorizer.transform([text])
        similarities = cosine_similarity(query_vec, matrix).flatten()

        # Sort candidate indices by cosine similarity descending
        sorted_indices = np.argsort(similarities)[::-1]

        results = []
        for idx in sorted_indices:
            score = float(similarities[idx])
            score_pct = round(score * 100.0, 1)

            item = complaints[idx]
            ticket_id = f"#{item.get('ticket_id', 'TC-1000')}"

            # Filter out self-match if querying existing ticket
            if current_ticket_id and current_ticket_id in ticket_id:
                continue

            # Ignore non-relevant low cosine similarity matches (< 5%)
            if score_pct < 5.0 and len(results) > 0:
                continue

            results.append({
                "ticket_id": ticket_id,
                "category": item.get("category", category or "Network Connectivity"),
                "description": item.get("subject", item.get("description", item.get("complaint_text", "")))[:100],
                "status": item.get("status", "Solved"),
                "similarity_percent": score_pct
            })

            if len(results) >= top_k:
                break

        return results
    except Exception as e:
        print(f"❌ Error during historical vector similarity search: {e}")
        return []
