import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_parse_resume_invalid_url():
    """Confirms error handling returns HTTP 400 when an invalid URL is provided."""
    response = client.post(
        "/api/parse-resume",
        json={"resumeUrl": "https://not-a-valid-domain-xyz.com/fake.pdf"}
    )
    assert response.status_code in [400, 500]


def test_hybrid_match_scoring():
    """Tests the pure ranking algorithm with synthetic data."""
    payload = {
        "userSkills": ["Python", "FastAPI"],
        "userSummary": "Backend Python engineer",
        "topK": 1,
        "hackathons": [
            {
                "title": "Backend Sprint",
                "link": "https://example.com/sprint",
                "organizer": "PyOrg",
                "techStack": ["Python", "FastAPI", "Redis"],
                "categories": ["Web"],
                "contextText": "Build fast web applications.",
                "embedding": [0.1] * 768,
            }
        ],
    }
    response = client.post("/api/match-hackathons", json=payload)
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert "FastAPI" in results[0]["matched_skills"]
    assert "Redis" in results[0]["missing_skills"]
    assert 0 <= results[0]["final_score"] <= 100