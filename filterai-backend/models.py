from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class User(BaseModel):
    email: str
    password_hash: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Batch(BaseModel):
    job_title: str
    job_description: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "processing"

class Candidate(BaseModel):
    batch_id: str
    candidate_id: str
    name: str
    email: Optional[str] = None
    resume_text: str
    match_score: Optional[float] = None
    skill_breakdown: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    red_flags: Optional[List[str]] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ActivityLog(BaseModel):
    user_id: str
    user_name: str
    action_type: str
    batch_id: Optional[str] = None
    candidate_id: Optional[str] = None
    details: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AnalyzeRequest(BaseModel):
    batch_id: str

class CandidateInsightsRequest(BaseModel):
    batch_id: Optional[str] = None
    candidate_id: Optional[str] = None
    file_name: Optional[str] = None

class GenerateLetterRequest(BaseModel):
    batch_id: Optional[str] = None
    candidate_id: Optional[str] = None
    file_name: Optional[str] = None
    letter_type: str = "offer"

class SendLetterRequest(BaseModel):
    batch_id: Optional[str] = None
    candidate_id: Optional[str] = None
    file_name: Optional[str] = None
    letter_type: str = "offer"
    to_email: str
    subject: str
    body: str

