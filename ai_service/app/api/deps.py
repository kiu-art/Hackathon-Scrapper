from functools import lru_cache
from typing import Annotated
from fastapi import Depends
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from app.config import Settings, get_settings
from app.chains.hybrid_chain import HybridMatchEngine


# -------------------------------------------------------------------------
# Settings Dependency
# -------------------------------------------------------------------------
SettingsDep = Annotated[Settings, Depends(get_settings)]


# -------------------------------------------------------------------------
# LangChain Gemini LLM Client (Cached Singleton)
# -------------------------------------------------------------------------
@lru_cache
def get_llm() -> ChatGoogleGenerativeAI:
    """
    Provides a cached, thread-safe ChatGoogleGenerativeAI client.
    Default: Gemini 2.5 Flash with low temperature for consistent JSON extraction.
    """
    settings = get_settings()
    return ChatGoogleGenerativeAI(
        model=getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash"),
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.2,
        max_retries=2,
    )


LLMDep = Annotated[ChatGoogleGenerativeAI, Depends(get_llm)]


# -------------------------------------------------------------------------
# LangChain Embeddings Client (Cached Singleton)
# -------------------------------------------------------------------------
@lru_cache
def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """
    Provides a cached, thread-safe GoogleGenerativeAIEmbeddings client.
    Default: models/text-embedding-004 (produces 768-dimensional vectors).
    """
    settings = get_settings()
    return GoogleGenerativeAIEmbeddings(
        model=getattr(settings, "EMBEDDING_MODEL", "models/text-embedding-004"),
        google_api_key=settings.GEMINI_API_KEY,
    )


EmbeddingsDep = Annotated[GoogleGenerativeAIEmbeddings, Depends(get_embeddings)]


# -------------------------------------------------------------------------
# Hybrid Match Engine Dependency
# -------------------------------------------------------------------------
def get_hybrid_engine(
    embeddings: EmbeddingsDep
) -> HybridMatchEngine:
    """
    Instantiates the HybridMatchEngine injecting the cached embedding model.
    """
    return HybridMatchEngine(embeddings_model=embeddings)


HybridEngineDep = Annotated[HybridMatchEngine, Depends(get_hybrid_engine)]