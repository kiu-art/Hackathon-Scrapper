from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.hackathon import Hackathon  # Reuse the DB model here!


class MatchRequest(BaseModel):
    """Payload sent by Node.js when a user requests recommendations."""
    model_config = ConfigDict(populate_by_name=True)

    user_skills: List[str] = Field(
        alias="userSkills",
        description="Technologies known by the user (extracted from resume)"
    )
    user_summary: Optional[str] = Field(
        default="",
        alias="userSummary",
        description="Candidate technical summary for vector search"
    )
    user_embedding: Optional[List[float]] = Field(
        default=None,
        alias="userEmbedding",
        description="Candidate resume embedding"
    )
    hackathons: List[Hackathon] = Field(
        description="List of active hackathons fetched from MongoDB"
    )
    top_k: int = Field(
        default=5,
        alias="topK",
        description="Number of ranked results to return"
    )


class ScoredHackathon(BaseModel):
    """The result after running hybrid ranking math."""
    id: str
    title: str
    link: str
    prize: Optional[float] = None
    final_score: float = Field(description="Weighted match percentage (0 - 100)")
    vector_similarity: float = Field(description="Semantic score (0.0 - 1.0)")
    tech_match_ratio: float = Field(description="Skill coverage ratio")
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    fit_summary: str = Field(description="Small verdict of hackathon similarity")