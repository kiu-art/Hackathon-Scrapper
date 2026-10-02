from typing import List
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.schemas.hackathon import Hackathon


def build_hackathon_embedding_text(hackathon: Hackathon) -> str:
    """
    Constructs a structured, high-signal representation of a hackathon.
    Combines title, organizer, tech stack, categories, and problem statement
    into a format optimized for text-embedding-004 vector search.
    """
    sections = [
        f"Hackathon Title: {hackathon.title.strip()}",
        f"Organizer: {hackathon.organizer.strip()}",
    ]

    if hackathon.categories:
        clean_categories = [cat.strip() for cat in hackathon.categories if cat.strip()]
        if clean_categories:
            sections.append(f"Categories & Themes: {', '.join(clean_categories)}")

    if hackathon.tech_stack:
        clean_stack = [tech.strip() for tech in hackathon.tech_stack if tech.strip()]
        if clean_stack:
            sections.append(f"Required Technologies: {', '.join(clean_stack)}")

    if hackathon.eligibility:
        clean_eligibility = [el.strip() for el in hackathon.eligibility if el.strip()]
        if clean_eligibility:
            sections.append(f"Eligibility: {', '.join(clean_eligibility)}")

    # Include scraped problem statements and tracks (capping at 5,000 characters)
    if hackathon.context_text and hackathon.context_text.strip():
        clean_context = hackathon.context_text.strip()[:5000]
        sections.append(f"Problem Statement & Overview:\n{clean_context}")

    return "\n".join(sections).strip()


async def generate_hackathon_embedding(
    hackathon: Hackathon,
    embeddings: GoogleGenerativeAIEmbeddings
) -> List[float]:
    """
    Generates a 768-dimensional embedding vector for a single hackathon document.
    """
    embedding_text = build_hackathon_embedding_text(hackathon)
    return await embeddings.aembed_query(embedding_text)


async def generate_batch_hackathon_embeddings(
    hackathons: List[Hackathon],
    embeddings: GoogleGenerativeAIEmbeddings
) -> List[List[float]]:
    """
    Generates 768-dimensional embedding vectors for multiple hackathons in a single batch.
    Use this when the Node.js scraper completes a run to vectorize all new items at once.
    """
    texts = [build_hackathon_embedding_text(h) for h in hackathons]
    return await embeddings.aembed_documents(texts)