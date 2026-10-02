from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TeamSize(BaseModel):
    """Sub-document for team size bounds."""
    min: Optional[int] = Field(default=None, description="Minimum team size")
    max: Optional[int] = Field(default=None, description="Maximum team size")


class Hackathon(BaseModel):
    """
    Direct representation of the MongoDB Hackathons collection document.
    """
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={datetime: lambda dt: dt.isoformat()}
    )

    # MongoDB Identifier
    id: Optional[str] = Field(default=None, alias="_id", description="MongoDB ObjectId string")

    # Core Listing Fields
    title: str = Field(..., description="Title of the hackathon")
    organizer: str = Field(..., description="College, organization, or company hosting")
    link: str = Field(..., description="Unique URL to the Unstop competition")
    fee: Optional[float] = Field(default=None, description="Registration fee in INR (null if free)")
    team_size: Optional[TeamSize] = Field(default=None, alias="teamSize")
    location: Optional[str] = Field(default=None, description="Physical venue or 'Online'")
    categories: List[str] = Field(default_factory=list, description="Competition tags/categories")
    eligibility: List[str] = Field(default_factory=list, description="Target participants")
    prize: Optional[float] = Field(default=None, description="Total cash prize pool")
    status: Optional[str] = Field(default=None, description="e.g. 'Open', 'Expired'")
    posted_date: Optional[str] = Field(default=None, alias="postedDate")

    # Enriched Fields & Vector Data
    current_deadline: Optional[datetime] = Field(
        default=None,
        alias="currentDeadline",
        description="Next upcoming submission deadline"
    )
    tech_stack: List[str] = Field(
        default_factory=list,
        alias="techStack",
        description="Detected technologies (e.g. ['React', 'Python'])"
    )
    context_text: str = Field(
        default="",
        alias="contextText",
        description="Clean, dense description used for vector embedding generation"
    )
    embedding: Optional[List[float]] = Field(
        default=None,
        description="768-dimensional text-embedding-004 vector"
    )

    # Timestamps
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")

    def prepare_embedding_text(self) -> str:
        """
        Combines metadata and context into a structured string optimized 
        for 768-dimension vector search if contextText alone is incomplete.
        """
        parts = [
            f"Title: {self.title}",
            f"Organizer: {self.organizer}",
        ]
        if self.categories:
            parts.append(f"Categories: {', '.join(self.categories)}")
        if self.tech_stack:
            parts.append(f"Technologies: {', '.join(self.tech_stack)}")
        if self.context_text:
            parts.append(f"Description:\n{self.context_text}")

        return "\n".join(parts)


class GenerateEmbeddingRequest(BaseModel):
    """Payload sent by Node.js to compute an embedding for a hackathon."""
    model_config = ConfigDict(populate_by_name=True)

    link: str = Field(description="Unique link identifier for the hackathon")
    text: Optional[str] = Field(
        default=None,
        alias="contextText",
        description="Raw context text to embed (if sending only text)"
    )
    hackathon: Optional[Hackathon] = Field(
        default=None,
        description="Full hackathon document (if sending the entire object)"
    )


class GenerateEmbeddingResponse(BaseModel):
    """Returned back to Node.js for MongoDB storage."""
    link: str
    embedding: List[float] = Field(description="Generated 768-dim float array")