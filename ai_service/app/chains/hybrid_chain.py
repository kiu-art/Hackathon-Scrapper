import re
from datetime import datetime, timezone
from typing import List, Tuple
import numpy as np
from rank_bm25 import BM25Okapi
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.schemas.hackathon import Hackathon
from app.schemas.match import MatchRequest, ScoredHackathon


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two 1D float vectors."""
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))


def tokenize(text: str) -> List[str]:
    """Basic alphanumeric tokenizer for BM25 indexing."""
    if not text:
        return []
    return re.findall(r"\b\w+\b", text.lower())


def calculate_deadline_multiplier(deadline: datetime | None) -> float:
    """
    Penalizes hackathons that have already expired or end in less than 24 hours.
    Returns a multiplier between 0.1 and 1.0.
    """
    if not deadline:
        return 0.85  # Neutral default if no deadline is posted

    # Ensure timezone-aware UTC comparison
    now = datetime.now(timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    hours_left = (deadline - now).total_seconds() / 3600.0

    if hours_left <= 0:
        return 0.0  # Already expired
    if hours_left < 24:
        return 0.3  # Panic mode / registration likely closing
    if hours_left < 72:
        return 0.7  # Closing soon
    return 1.0  # Healthy runway


class HybridMatchEngine:
    def __init__(self, embeddings_model: GoogleGenerativeAIEmbeddings):
        self.embeddings = embeddings_model

    async def execute_match(self, request: MatchRequest) -> List[ScoredHackathon]:
        """
        Executes hybrid scoring against all incoming hackathons and returns top_k results.
        """
        hackathons: List[Hackathon] = request.hackathons
        if not hackathons:
            return []

        # -------------------------------------------------------------
        # 1. Resolve User Embedding
        # -------------------------------------------------------------
        user_vector = request.user_embedding
        if not user_vector:
            # Build search query from summary + user skills if vector was not supplied
            query_parts = []
            if request.user_summary:
                query_parts.append(request.user_summary)
            if request.user_skills:
                query_parts.append(f"Technologies: {', '.join(request.user_skills)}")

            search_query = "\n".join(query_parts) if query_parts else "software engineering hackathon"
            user_vector = await self.embeddings.aembed_query(search_query)

        # -------------------------------------------------------------
        # 2. Sparse BM25 Keyword Scoring
        # -------------------------------------------------------------
        # Index the context text + title of all hackathons
        corpus = [
            tokenize(f"{h.title} {' '.join(h.tech_stack)} {h.context_text}")
            for h in hackathons
        ]
        bm25 = BM25Okapi(corpus)

        # Create query tokens from user skills & summary
        bm25_query_text = f"{' '.join(request.user_skills)} {request.user_summary or ''}"
        query_tokens = tokenize(bm25_query_text)
        raw_bm25_scores = bm25.get_scores(query_tokens) if query_tokens else [0.0] * len(hackathons)

        # Min-Max normalize BM25 scores between 0.0 and 1.0
        max_bm25 = max(raw_bm25_scores) if len(raw_bm25_scores) > 0 else 0.0
        min_bm25 = min(raw_bm25_scores) if len(raw_bm25_scores) > 0 else 0.0
        bm25_spread = max_bm25 - min_bm25

        if bm25_spread > 0:
            norm_bm25 = [(score - min_bm25) / bm25_spread for score in raw_bm25_scores]
        else:
            norm_bm25 = [0.5 if max_bm25 > 0 else 0.0 for _ in raw_bm25_scores]

        # Normalize user skills for case-insensitive set math
        user_skills_normalized = {skill.strip().lower(): skill.strip() for skill in request.user_skills}

        scored_results: List[ScoredHackathon] = []

        # -------------------------------------------------------------
        # 3. Compute Composite Scores Per Hackathon
        # -------------------------------------------------------------
        for idx, h in enumerate(hackathons):
            # A. Dense Vector Cosine Similarity
            vector_sim = 0.0
            if h.embedding and len(h.embedding) == len(user_vector):
                raw_sim = cosine_similarity(user_vector, h.embedding)
                vector_sim = max(0.0, min(1.0, raw_sim))  # Clamp between 0 and 1

            # B. Exact Tech Stack Overlap & Skill Gap
            matched_skills: List[str] = []
            missing_skills: List[str] = []

            if h.tech_stack:
                for req_tech in h.tech_stack:
                    clean_tech = req_tech.strip().lower()
                    if clean_tech in user_skills_normalized:
                        matched_skills.append(user_skills_normalized[clean_tech])
                    else:
                        missing_skills.append(req_tech.strip())

                tech_ratio = len(matched_skills) / len(h.tech_stack)
            else:
                # Neutral 0.7 score if the hackathon has no strict tech requirements
                tech_ratio = 0.7

            # C. Keyword BM25 Score
            bm25_score = norm_bm25[idx]

            # D. Timeline Feasibility Multiplier
            deadline_weight = calculate_deadline_multiplier(h.current_deadline)

            # E. Weighted Composite Formula
            # 40% Vector Semantics + 30% Tech Coverage + 20% BM25 Keywords + 10% Deadline
            composite_base = (
                (0.40 * vector_sim) +
                (0.30 * tech_ratio) +
                (0.20 * bm25_score) +
                (0.10 * deadline_weight)
            )

            # Convert to a 0-100 percentage
            final_percentage = round(composite_base * 100, 1)

            # F. Automated Fit Explanation
            fit_summary = None
            if tech_ratio == 1.0 and vector_sim > 0.75:
                fit_summary = "Outstanding match. You possess all required technical skills and domain alignment."
            elif missing_skills:
                fit_summary = f"Strong potential match. Consider recruiting teammates proficient in: {', '.join(missing_skills[:2])}."
            else:
                fit_summary = "Good domain fit based on problem statement and project context."

            scored_results.append(
                ScoredHackathon(
                    id=str(h.id) if h.id else "",
                    title=h.title,
                    link=h.link,
                    prize=h.prize,
                    final_score=final_percentage,
                    vector_similarity=round(vector_sim, 3),
                    tech_match_ratio=round(tech_ratio, 2),
                    matched_skills=matched_skills,
                    missing_skills=missing_skills,
                    fit_summary=fit_summary,
                )
            )

        # -------------------------------------------------------------
        # 4. Sort Descending by Final Score & Slice Top K
        # -------------------------------------------------------------
        scored_results.sort(key=lambda item: item.final_score, reverse=True)
        return scored_results[: request.top_k]