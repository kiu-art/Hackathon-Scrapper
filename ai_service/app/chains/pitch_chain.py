from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.schemas.pitch import PitchRequest, HackathonPitch


def get_pitch_generation_chain(llm: ChatGoogleGenerativeAI):
    """
    Constructs an LCEL chain bound to the HackathonPitch Pydantic schema.
    """
    structured_llm = llm.with_structured_output(HackathonPitch)

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are an elite hackathon mentor, startup founder, and technical judge.\n"
            "Your objective is to synthesize a candidate's background with a specific hackathon's "
            "problem statement to engineer a high-impact, realistic MVP project strategy.\n\n"
            "Strategic Directives:\n"
            "1. **Viability & Scope**: Calibrate project scope to candidate experience ({user_experience}). "
            "For 'BEGINNER', ensure the MVP is achievable in 24-36 hours. "
            "For 'ADVANCED', introduce architectural depth (e.g., distributed queues, edge inference, real-time pipelines).\n"
            "2. **Skill Synergies**: Prioritize candidate strengths ({user_skills}) while integrating "
            "technologies requested by the organizers.\n"
            "3. **Track Focus**: If a specific track is targeted, anchor the pitch strictly around that domain.\n"
            "4. **Winning Demo Strategy**: Formulate a high-impact presentation hook. Specify what "
            "visual or interactive feature the team should demonstrate in the first 30 seconds to impress judges.\n"
            "5. **Teammate Gap**: Identify exactly what complementary roles or missing skill sets "
            "the candidate must recruit to execute this MVP."
        ),
        (
            "human",
            "### CANDIDATE PROFILE\n"
            "- Experience Tier: {user_experience}\n"
            "- Known Technologies: {user_skills}\n"
            "- Profile Summary: {user_summary}\n\n"
            "### HACKATHON CONTEXT\n"
            "- Title: {hackathon_title}\n"
            "- Host/Organizer: {hackathon_organizer}\n"
            "- Selected Target Track: {preferred_track}\n"
            "- General Categories: {hackathon_categories}\n"
            "- Required / Preferred Stack: {hackathon_tech_stack}\n"
            "- Problem Statement & Overview:\n{hackathon_context}\n\n"
            "Generate an end-to-end hackathon project proposal matching the required schema."
        )
    ])

    return prompt | structured_llm


async def generate_hackathon_pitch(
    request: PitchRequest,
    llm: ChatGoogleGenerativeAI
) -> HackathonPitch:
    """
    Executes the pitch generation chain.

    Args:
        request: PitchRequest containing candidate skills, experience tier, and hackathon data.
        llm: Injected Gemini chat model instance.

    Returns:
        Structured HackathonPitch containing project title, tagline, MVP features, stack, and demo advice.
    """
    h = request.hackathon
    chain = get_pitch_generation_chain(llm)

    # Format inputs with safe fallbacks
    categories_str = ", ".join(h.categories) if h.categories else "General Software Engineering"
    tech_stack_str = ", ".join(h.tech_stack) if h.tech_stack else "Open Stack / Modern Frameworks"
    context_str = h.context_text.strip()[:4000] if h.context_text else "No detailed problem statement provided."
    user_skills_str = ", ".join(request.user_skills) if request.user_skills else "General Programming"
    user_summary_str = request.user_summary.strip() if request.user_summary else "Software developer ready to build hackathon MVPs."
    preferred_track_str = request.preferred_track.strip() if request.preferred_track else "Open / General Theme"

    input_payload = {
        "user_experience": request.user_experience,
        "user_skills": user_skills_str,
        "user_summary": user_summary_str,
        "hackathon_title": h.title,
        "hackathon_organizer": h.organizer,
        "preferred_track": preferred_track_str,
        "hackathon_categories": categories_str,
        "hackathon_tech_stack": tech_stack_str,
        "hackathon_context": context_str,
    }

    pitch_result: HackathonPitch = await chain.ainvoke(input_payload)
    return pitch_result