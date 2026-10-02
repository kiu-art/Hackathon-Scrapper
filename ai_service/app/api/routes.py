import logging
from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import LLMDep, EmbeddingsDep, HybridEngineDep
from app.schemas.resume import ParsedResume
from app.schemas.hackathon import (
    Hackathon,
    GenerateEmbeddingRequest,
    GenerateEmbeddingResponse,
)
from app.schemas.match import MatchRequest, ScoredHackathon
from app.schemas.pitch import PitchRequest, HackathonPitch
from app.utils.pdf_extractor import extract_text_from_pdf_url, PDFExtractionError
from app.chains.resume_chain import process_and_embed_resume
from app.chains.hackathon_chain import (
    generate_hackathon_embedding,
    build_hackathon_embedding_text,
)
from app.chains.pitch_chain import generate_hackathon_pitch

logger = logging.getLogger(__name__)

router = APIRouter()


# --------------------------------------------------------------------------
# Request / Response Models for Resume Parsing
# --------------------------------------------------------------------------
class ParseResumeRequest(BaseModel):
    resume_url: str = Field(
        ...,
        alias="resumeUrl",
        description="Public ImageKit URL to the candidate's PDF resume"
    )

    model_config = {"populate_by_name": True}


class ParseResumeResponse(BaseModel):
    profile: ParsedResume
    user_embedding: List[float] = Field(
        ...,
        alias="userEmbedding",
        description="768-dimensional text-embedding-004 vector"
    )

    model_config = {"populate_by_name": True}


# --------------------------------------------------------------------------
# Health Check
# --------------------------------------------------------------------------
@router.get("/health", status_code=status.HTTP_200_OK, tags=["System"])
async def health_check():
    """Confirms AI service is alive and ready to accept requests."""
    return {"status": "ok", "service": "hackathon-ai-service"}


# --------------------------------------------------------------------------
# 1. Resume Parsing & Profile Vectorization
# --------------------------------------------------------------------------
@router.post(
    "/parse-resume",
    response_model=ParseResumeResponse,
    status_code=status.HTTP_200_OK,
    tags=["Resume"]
)
async def parse_resume_endpoint(
    payload: ParseResumeRequest,
    llm: LLMDep,
    embeddings: EmbeddingsDep
):
    """
    Downloads a resume PDF from ImageKit, runs structured parsing via Gemini Flash,
    and returns both the candidate profile and 768-dim user embedding for MongoDB storage.
    """
    try:
        raw_text = await extract_text_from_pdf_url(payload.resume_url)
    except PDFExtractionError as exc:
        logger.warning(f"PDF extraction failed for URL {payload.resume_url}: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
    except Exception as exc:
        logger.error(f"Unexpected error fetching PDF: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve or read the resume document."
        )

    try:
        profile, user_vector = await process_and_embed_resume(raw_text, llm, embeddings)
        return ParseResumeResponse(profile=profile, user_embedding=user_vector)
    except Exception as exc:
        logger.error(f"Resume extraction chain failed: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini processing error during resume analysis: {str(exc)}"
        )


# --------------------------------------------------------------------------
# 2. Hackathon Embedding Generation (Scraper Pipeline)
# --------------------------------------------------------------------------
@router.post(
    "/embed-hackathon",
    response_model=GenerateEmbeddingResponse,
    status_code=status.HTTP_200_OK,
    tags=["Hackathons"]
)
async def embed_hackathon_endpoint(
    payload: GenerateEmbeddingRequest,
    embeddings: EmbeddingsDep
):
    """
    Generates a 768-dim vector embedding for a scraped hackathon document or context text.
    Called by Node.js during scraping before writing to Atlas.
    """
    try:
        if payload.text and payload.text.strip():
            content_to_embed = payload.text.strip()
        elif payload.hackathon:
            content_to_embed = build_hackathon_embedding_text(payload.hackathon)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'contextText' or a 'hackathon' object must be provided."
            )

        vector = await embeddings.aembed_query(content_to_embed)

        return GenerateEmbeddingResponse(
            link=payload.link,
            embedding=vector
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to generate hackathon embedding: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Embedding generation failed: {str(exc)}"
        )


# --------------------------------------------------------------------------
# 3. Hybrid Matchmaking Engine
# --------------------------------------------------------------------------
@router.post(
    "/match-hackathons",
    response_model=List[ScoredHackathon],
    status_code=status.HTTP_200_OK,
    tags=["Matching"]
)
async def match_hackathons_endpoint(
    payload: MatchRequest,
    engine: HybridEngineDep
):
    """
    Executes hybrid scoring (Vector Cosine + BM25 Keywords + Tech Stack Overlap + Deadline)
    across candidate hackathons and returns the ranked top_k list with gap analysis.
    """
    try:
        ranked_hackathons = await engine.execute_match(payload)
        return ranked_hackathons
    except Exception as exc:
        logger.error(f"Hybrid matching failed: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during match scoring: {str(exc)}"
        )


# --------------------------------------------------------------------------
# 4. Personalized Hackathon Strategy & Pitch Generator
# --------------------------------------------------------------------------
@router.post(
    "/generate-pitch",
    response_model=HackathonPitch,
    status_code=status.HTTP_200_OK,
    tags=["Pitch Strategy"]
)
async def generate_pitch_endpoint(
    payload: PitchRequest,
    llm: LLMDep
):
    """
    Generates a structured, demo-ready hackathon proposal, feature MVP roadmap,
    and teammate recruitment recommendations using Gemini.
    """
    try:
        pitch = await generate_hackathon_pitch(payload, llm)
        return pitch
    except Exception as exc:
        logger.error(f"Pitch generation failed: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate pitch proposal: {str(exc)}"
        )