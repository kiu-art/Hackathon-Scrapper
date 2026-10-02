import asyncio
from datetime import datetime
import httpx

BASE_URL = "http://localhost:8000/api"

# Working public sample software developer resume
SAMPLE_RESUME_URL = "https://ik.imagekit.io/kiusinh/Professional%20Resume.pdf"

# --------------------------------------------------------------------------
# Exact Unstop Hackathon Documents from MongoDB
# --------------------------------------------------------------------------
HACKATHON_CODE_VOYAGE = {
    "title": "The Code Voyage",
    "organizer": "Guru Tegh Bahadur Institute of Technology (GTBIT), New Delhi",
    "link": "https://unstop.com/hackathons/the-code-voyage-ieee-day-2026-guru-tegh-bahadur-institute-of-technology-gtbit-new-delhi-1760415",
    "location": "Guru Tegh Bahadur Institute of Technology, West Delhi, Delhi, India",
    "categories": [
        "Software Development",
        "Quizzes & Treasure Hunt"
    ],
    "techStack": ["AI"],
    "eligibility": [
        "Engineering Students",
        "Postgraduate"
    ],
    "fee": None,
    "prize": None,
    "teamSize": {
        "min": 2,
        "max": 4
    },
    "currentDeadline": "2026-10-17T18:29:59.999Z",
    "contextText": (
        "CODE VOYAGE is a pirate-themed technical challenge testing logic, pseudocode, "
        "technical knowledge, and strategy across two rounds. Teams navigate a grid-based "
        "problem and battle through a high-stakes technical bidding round, where every decision "
        "shapes their final score. Round 1: Grid Navigation - Teams solve a grid-based logical "
        "challenge by determining the correct path or sequence of instructions in pseudocode."
    )
}

HACKATHON_CODESPRINT = {
    "id": "6ab61ad8fd9d412b025c927e",
    "title": "Codesprint 2026",
    "organizer": "Elite Coders",
    "link": "https://unstop.com/hackathons/codesprint-2026-elite-coders-1761190",
    "location": "Software Development",
    "categories": [
        "Quizzes & Treasure Hunt",
        "Open Source"
    ],
    "techStack": ["AI"],
    "eligibility": ["Everyone can apply"],
    "fee": None,
    "prize": 30000.0,
    "teamSize": {
        "min": 1,
        "max": 5
    },
    "currentDeadline": "2026-10-10T18:29:00.000Z",
    "contextText": (
        "Elite Coders CodeSprint 2026 hosted on Unstop is a month-long open-source building "
        "challenge designed to take participants from Idea -> MVP -> Open Source -> Pitch. "
        "Participants will build their projects online from 15 October to 15 November 2026, "
        "with mentorship and project reviews. The Final Pitching Day will be held offline in "
        "Dehradun on 22 November 2026. What You'll Do: Submit original idea, build functional MVP, "
        "make project open source, deploy and showcase. Cash prizes worth Rs 30,000."
    )
}


async def run_tests():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=60.0) as client:
        print("\n" + "=" * 65)
        print("🚀 STARTING E2E TEST WITH REAL UNSTOP MONGODB DATA")
        print("=" * 65)

        # ------------------------------------------------------------------
        # 1. Health Check
        # ------------------------------------------------------------------
        print("\n[1/5] Testing GET /health ...")
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print(f"✅ Health OK: {res.json()}")

        # ------------------------------------------------------------------
        # 2. Parse Resume and Extract Embedding
        # ------------------------------------------------------------------
        print(f"\n[2/5] Testing POST /parse-resume with sample PDF ...")
        print(f"      Fetching: {SAMPLE_RESUME_URL}")
        
        res = await client.post("/parse-resume", json={"resumeUrl": SAMPLE_RESUME_URL})
        assert res.status_code == 200, f"Resume parse failed: {res.text}"
        resume_data = res.json()
        
        parsed_profile = resume_data["profile"]
        user_vector = resume_data["userEmbedding"]
        dims = len(user_vector)

        print("✅ Resume Parsed Successfully:")
        print(f"   • Candidate Name:    {parsed_profile.get('name')}")
        print(f"   • Experience Level:  {parsed_profile.get('experience_level')}")
        print(f"   • Primary Skills:    {', '.join(parsed_profile.get('primary_skills', [])[:6])}")
        print(f"   • User Vector Size:  {dims} dimensions")

        # ------------------------------------------------------------------
        # 3. Vectorize Both Unstop Hackathons
        # ------------------------------------------------------------------
        print("\n[3/5] Testing POST /embed-hackathon for both MongoDB docs ...")
        
        # Embed The Code Voyage
        res1 = await client.post(
            "/embed-hackathon",
            json={"link": HACKATHON_CODE_VOYAGE["link"], "hackathon": HACKATHON_CODE_VOYAGE}
        )
        assert res1.status_code == 200, f"Embed 1 failed: {res1.text}"
        HACKATHON_CODE_VOYAGE["embedding"] = res1.json()["embedding"]
        print(f"✅ Embedded 'The Code Voyage' ({len(HACKATHON_CODE_VOYAGE['embedding'])} dims)")

        # Embed Codesprint 2026
        res2 = await client.post(
            "/embed-hackathon",
            json={"link": HACKATHON_CODESPRINT["link"], "hackathon": HACKATHON_CODESPRINT}
        )
        assert res2.status_code == 200, f"Embed 2 failed: {res2.text}"
        HACKATHON_CODESPRINT["embedding"] = res2.json()["embedding"]
        print(f"✅ Embedded 'Codesprint 2026' ({len(HACKATHON_CODESPRINT['embedding'])} dims)")

        # ------------------------------------------------------------------
        # 4. Hybrid Matchmaking Engine
        # ------------------------------------------------------------------
        print("\n[4/5] Testing POST /match-hackathons ...")
        
        match_payload = {
            "userSkills": parsed_profile.get("primary_skills", []) + parsed_profile.get("secondary_skills", []),
            "userSummary": parsed_profile.get("summary", ""),
            "userEmbedding": user_vector,
            "topK": 2,
            "hackathons": [
                HACKATHON_CODE_VOYAGE,
                HACKATHON_CODESPRINT
            ],
        }

        res = await client.post("/match-hackathons", json=match_payload)
        assert res.status_code == 200, f"Match failed: {res.text}"
        ranked = res.json()

        print(f"✅ Ranked {len(ranked)} Unstop Hackathons:")
        for idx, item in enumerate(ranked, 1):
            print(
                f"   {idx}. {item['title']} -> Final Score: {item['final_score']}%\n"
                f"      • Semantic Similarity: {item['vector_similarity']:.2f}\n"
                f"      • Matched Skills:     {item['matched_skills']}\n"
                f"      • Missing Skills:     {item['missing_skills']}"
            )

        # ------------------------------------------------------------------
        # 5. Tailored Pitch Generation (For Codesprint 2026)
        # ------------------------------------------------------------------
        print("\n[5/5] Testing POST /generate-pitch for 'Codesprint 2026' ...")
        pitch_payload = {
            "userSkills": parsed_profile.get("primary_skills", []),
            "userExperience": parsed_profile.get("experience_level", "INTERMEDIATE"),
            "userSummary": parsed_profile.get("summary", ""),
            "preferredTrack": "AI / Open Source MVP",
            "hackathon": HACKATHON_CODESPRINT,
        }

        res = await client.post("/generate-pitch", json=pitch_payload)
        assert res.status_code == 200, f"Pitch failed: {res.text}"
        pitch = res.json()

        print("✅ Gemini Hackathon Strategy Generated:")
        print(f"   • Project Title:  {pitch.get('project_title')}")
        print(f"   • Tagline:        {pitch.get('tagline')}")
        print(f"   • Problem:        {pitch.get('problem_statement')}")
        print(f"   • Solution:       {pitch.get('solution_overview')}")
        print(f"   • MVP Features:   {pitch.get('key_features')}")
        print(f"   • Stack:          {', '.join(pitch.get('recommended_stack', []))}")
        print(f"   • Demo Strategy:  {pitch.get('demo_strategy')}")
        print(f"   • Teammate Gap:   {pitch.get('teammate_recommendation')}")

        print("\n" + "=" * 65)
        print("🎉 ALL 5 PIPELINE TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    asyncio.run(run_tests())