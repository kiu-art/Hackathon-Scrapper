from typing import List, Optional
from pydantic import BaseModel, Field


class ProjectItem(BaseModel):
    title: str = Field(
        description="Name of the project"
    )
    description: str = Field(
        description="Brief 1-2 sentence description of what the project does and its impact"
    )
    tech_stack: List[str] = Field(
        default_factory=list,
        description="List of technologies, frameworks, libraries, or tools used in this project"
    )


class WorkExperience(BaseModel):
    role: str = Field(
        description="Job or internship title (e.g., Software Engineer Intern, Backend Developer)"
    )
    company: str = Field(
        description="Name of the company or organization"
    )
    duration: Optional[str] = Field(
        default=None,
        description="Duration of employment (e.g., 'June 2024 - Aug 2024' or '6 months')"
    )
    summary: Optional[str] = Field(
        default=None,
        description="Key responsibilities and technical achievements"
    )


class EducationItem(BaseModel):
    degree: str = Field(
        description="Degree or certification (e.g., B.Tech in Computer Engineering)"
    )
    institution: str = Field(
        description="University, college, or school name"
    )
    graduation_year: Optional[str] = Field(
        default=None,
        description="Year of graduation or expected completion (e.g., '2026')"
    )


class ParsedResume(BaseModel):
    name: str = Field(
        default="Candidate",
        description="Full name of the candidate"
    )
    email: Optional[str] = Field(
        default=None,
        description="Email address extracted from the resume"
    )
    github: Optional[str] = Field(
        default=None,
        description="GitHub profile URL or username if present"
    )
    linkedin: Optional[str] = Field(
        default=None,
        description="LinkedIn profile URL if present"
    )
    experience_level: str = Field(
        description="Estimated experience tier: 'BEGINNER' (0-1 yrs/student), 'INTERMEDIATE' (1-3 yrs), or 'ADVANCED' (3+ yrs)"
    )
    primary_skills: List[str] = Field(
        description=(
            "Normalized list of core technical skills, programming languages, and frameworks. "
            "Normalize aliases (e.g., map 'React.js' -> 'React', 'NodeJS' -> 'Node.js', 'py' -> 'Python')."
        )
    )
    secondary_skills: List[str] = Field(
        default_factory=list,
        description="Secondary tools, libraries, databases, devops tools, or concepts (e.g., Git, Docker, Postman, REST APIs, Tailwind CSS)"
    )
    domains: List[str] = Field(
        description="Technical domains the candidate has experience in (e.g., 'Web Development', 'Machine Learning', 'Cloud', 'Cybersecurity', 'Mobile App Development')"
    )
    projects: List[ProjectItem] = Field(
        default_factory=list,
        description="Notable personal, academic, or open-source projects"
    )
    experience: List[WorkExperience] = Field(
        default_factory=list,
        description="Work experiences or internships"
    )
    education: List[EducationItem] = Field(
        default_factory=list,
        description="Academic qualifications"
    )
    summary: str = Field(
        description="A concise 3-4 sentence technical profile summary highlighting their strengths, main stack, and project focus. Ideal for vector embedding generation."
    )