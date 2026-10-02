from typing import List, Tuple
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from app.schemas.resume import ParsedResume


def build_user_embedding_text(profile: ParsedResume) -> str:
    """
    Constructs a high-signal, noise-free text representation of the candidate profile.
    This string is what gets converted into the 768-dimensional vector for Atlas vector search.
    """
    sections = [
        f"Technical Profile: {profile.summary}",
        f"Primary Skills: {', '.join(profile.primary_skills)}",
    ]

    if profile.secondary_skills:
        sections.append(f"Tools & Secondary Skills: {', '.join(profile.secondary_skills)}")

    if profile.domains:
        sections.append(f"Target Domains: {', '.join(profile.domains)}")

    # Include project highlights for additional semantic context
    if profile.projects:
        project_summaries = [
            f"{p.title} ({', '.join(p.tech_stack)}): {p.description}"
            for p in profile.projects[:3]
        ]
        sections.append(f"Notable Projects:\n- " + "\n- ".join(project_summaries))

    return "\n".join(sections).strip()


def get_resume_extraction_chain(llm: ChatGoogleGenerativeAI):
    """
    Binds the Gemini LLM to the ParsedResume Pydantic model using structured outputs.
    """
    structured_llm = llm.with_structured_output(ParsedResume)

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are a specialized technical recruiter and hackathon advisor.\n"
            "Analyze the candidate's resume text and extract their profile strictly according to the requested schema.\n\n"
            "Guidelines:\n"
            "1. Normalize all skill names (e.g., convert 'ReactJS'/'react.js' to 'React', 'NodeJS' to 'Node.js', 'py' to 'Python').\n"
            "2. Separate core languages/frameworks into 'primary_skills' and dev tools/databases/libraries into 'secondary_skills'.\n"
            "3. Assess 'experience_level' objectively as 'BEGINNER' (student / 0-1 years), 'INTERMEDIATE' (1-3 years), or 'ADVANCED' (3+ years).\n"
            "4. Write a concise, 3-4 sentence technical 'summary' highlighting engineering strengths, primary stack, and domain focus. "
            "Do NOT include contact details, personal pronouns, or filler fluff in the summary—keep it dense and focused on technical capabilities."
        ),
        (
            "human",
            "Resume Plain Text:\n\n{text}"
        )
    ])

    return prompt | structured_llm


async def process_and_embed_resume(
    raw_text: str,
    llm: ChatGoogleGenerativeAI,
    embeddings: GoogleGenerativeAIEmbeddings
) -> Tuple[ParsedResume, List[float]]:
    """
    Orchestrates the entire resume ingestion pipeline:
    1. Runs the LangChain LCEL chain to extract structured profile JSON via Gemini.
    2. Builds an optimized text payload from the extracted technical profile.
    3. Generates the 768-dimensional vector embedding.

    Returns:
        A tuple of (ParsedResume, user_embedding_vector).
    """
    # 1. Structured extraction via Gemini (truncating extreme length to fit token window)
    chain = get_resume_extraction_chain(llm)
    profile: ParsedResume = await chain.ainvoke({"text": raw_text[:8000]})

    # 2. Build dense, noise-free text representation
    embedding_text = build_user_embedding_text(profile)

    # 3. Generate 768-dim vector using models/text-embedding-004
    user_vector = await embeddings.aembed_query(embedding_text)

    return profile, user_vector