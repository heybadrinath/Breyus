import numpy as np
from typing import List, Dict
from app.tagging import nlp, word_vectors

class ProductRecommender:
    def __init__(self, product_titles: List[str]) -> None:
        self.product_titles = product_titles
        self.embeddings = self._generate_embeddings(product_titles)

    def _generate_embeddings(self, titles: List[str]) -> Dict[str, np.ndarray]:
        embeddings = {}
        for title in titles:
            embeddings[title] = self._compute_embedding(title)
        return embeddings

    def _compute_embedding(self, text: str) -> np.ndarray:
        doc = nlp(text.lower())
        vectors = [word_vectors[token.text] for token in doc if token.is_alpha and token.text in word_vectors]
        if not vectors:
            return np.zeros(100)
        return np.mean(vectors, axis=0)

    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return np.dot(vec1, vec2) / (norm1 * norm2)

    def recommend(self, query: str, top_k: int = 5) -> List[str]:
        query_embedding = self._compute_embedding(query)
        similarity_scores = [
            (title, self._cosine_similarity(query_embedding, embedding))
            for title, embedding in self.embeddings.items()
            if title.lower() != query.lower()
        ]
        similarity_scores.sort(key=lambda x: x[1], reverse=True)
        return [title for title, _ in similarity_scores[:top_k]]
