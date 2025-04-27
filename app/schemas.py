# schemas.py
from typing import List, Optional
from pydantic import BaseModel


class MessageRequest(BaseModel):
    message: str
    button: str | None = None
    session_id: str | None = None


class FeedbackRequest(BaseModel):
    feedback: int


class JobSchema(BaseModel):
    id: int
    title: str
    company_name: str
    location: str
    category: str
    tags: List[str]
    url: str
    description: str
    published_at: str
    source: str
    employment_type: Optional[str] = ""
    experience_level: Optional[str] = ""

    class Config:
        orm_mode = True
