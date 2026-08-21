"""
Semantic Similarity using Sentence Transformers (optional / lazy load)
Falls back gracefully if sentence_transformers is not installed.
"""
import logging
import numpy as np

class SemanticSimilarityEngine:
    def __init__(self):
        self.model = None
        self.complaint_cache = []
        self.embedding_cache = []
        self._initialized = False

    def _load_model(self):
        if self._initialized:
            return
        self._initialized = True
        try:
            from sentence_transformers import SentenceTransformer, util
            self.util = util
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logging.info("✅ Sentence Transformer Model Loaded")
        except Exception as e:
            logging.info(f"Sentence transformer optional fallback: {e}")
            self.model = None

    def find_similar(self, query: str, candidates: list, top_k: int = 3) -> list:
        """
        Find most similar texts from candidates
        Returns: List of (text, similarity_score) tuples
        """
        self._load_model()
        if not self.model or not query or not candidates:
            return []
        
        try:
            query_embedding = self.model.encode(query, convert_to_tensor=True)
            candidate_embeddings = self.model.encode(candidates, convert_to_tensor=True)
            similarities = self.util.cos_sim(query_embedding, candidate_embeddings)[0]
            
            top_results = []
            for idx in similarities.argsort(descending=True)[:top_k]:
                if similarities[idx] > 0.3:
                    top_results.append({
                        "text": candidates[idx],
                        "similarity": float(similarities[idx])
                    })
            return top_results
        except Exception as e:
            logging.error(f"Similarity search error: {e}")
            return []

    def add_to_cache(self, complaint: str):
        """Add complaint to historical cache for future similarity searches"""
        self._load_model()
        if self.model and complaint:
            try:
                embedding = self.model.encode(complaint)
                self.complaint_cache.append(complaint)
                self.embedding_cache.append(embedding)
            except:
                pass

# Global instance
similarity_engine = SemanticSimilarityEngine()

def find_similar_complaints_local(query: str, candidates: list = None, top_k: int = 3):
    """Find similar complaints using local semantic search"""
    if candidates is None:
        candidates = similarity_engine.complaint_cache
    return similarity_engine.find_similar(query, candidates, top_k)

def cache_complaint(complaint: str):
    """Cache complaint for future similarity matching"""
    similarity_engine.add_to_cache(complaint)

