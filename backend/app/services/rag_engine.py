import json
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict

class TelecomRAGEngine:
    """
    Telecom RAG Engine (Retrieval-Augmented Generation).
    Retrieves grounded telecom operational policies, SLA rules,
    and troubleshooting steps from telecom_kb.json.
    """
    def __init__(self, kb_path: str):
        self.kb_path = kb_path
        self.kb_data = []
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = None
        self.load_kb()

    def load_kb(self):
        """Load and index the telecom knowledge base"""
        if not os.path.exists(self.kb_path):
            print(f"⚠️ Telecom KB path {self.kb_path} not found.")
            return

        try:
            with open(self.kb_path, 'r') as f:
                self.kb_data = json.load(f)
            
            documents = [
                f"{doc.get('category', '')} {doc.get('topic', '')} {doc.get('content', '')}" 
                for doc in self.kb_data
            ]
            
            if documents:
                self.tfidf_matrix = self.vectorizer.fit_transform(documents)
                print(f"✅ Telecom RAG Engine: Indexed {len(documents)} domain knowledge documents.")
        except Exception as e:
            print(f"❌ RAG Initialization Error: {e}")

    def retrieve(self, query: str, category: str = "", top_k: int = 2) -> Dict:
        """
        Retrieve relevant telecom troubleshooting steps & SLA policies.
        Returns dict with context string and retrieved document metadata.
        """
        if self.tfidf_matrix is None or not self.kb_data:
            return {
                "context": "Follow standard telecom resolution SLA guidelines.",
                "sources": ["Telecom SLA Standard Operational Manual"]
            }

        try:
            query_vec = self.vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
            
            # Apply domain-matching multiplier if category matches
            if category:
                for i, doc in enumerate(self.kb_data):
                    doc_cat = doc.get("category", "")
                    if doc_cat.lower() == category.lower():
                        similarities[i] *= 1.8  # Strong boost for same-category SOPs
                    elif doc_cat.lower() in ["billing dispute", "service request"] and any(kw in query.lower() for kw in ["bill", "charge", "fee", "deduction", "invoice", "vas", "₹"]):
                        if doc_cat.lower() == "billing dispute":
                            similarities[i] *= 1.6
                    elif any(kw in query.lower() for kw in ["bill", "charge", "fee", "deduction", "invoice", "vas", "₹"]) and "broadband" in doc_cat.lower():
                        similarities[i] *= 0.2  # De-boost network SOPs when query is purely monetary

            top_indices = np.argsort(similarities)[-top_k:][::-1]
            
            snippets = []
            sources = []
            for idx in top_indices:
                if similarities[idx] < 0.05:
                    continue
                doc = self.kb_data[idx]
                snippets.append(f"[{doc['category']} - {doc['topic']}]: {doc['content']}")
                sources.append(f"{doc['category']} — {doc['topic']}")
            
            if not snippets:
                snippets = ["Follow standard telecom operational guidelines for " + (category or "resolution")]
                sources = [f"{category or 'Telecom'} Standard Operational Procedure"]

            return {
                "context": "\n\n".join(snippets),
                "sources": sources
            }
        except Exception as e:
            print(f"❌ RAG Retrieval Error: {e}")
            return {
                "context": "Follow standard telecom operational guidelines.",
                "sources": ["Telecom Standard Procedure"]
            }

kb_file = os.path.join(os.path.dirname(__file__), "..", "knowledge_base", "telecom_kb.json")
rag_engine = TelecomRAGEngine(kb_file)
