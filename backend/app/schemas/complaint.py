from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any, Union

class ComplaintRequest(BaseModel):
    """Request schema for submitting a complaint"""
    name: Optional[str] = ""
    email: Optional[str] = ""
    subject: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = "Network Connectivity"

class ComplaintResponse(BaseModel):
    """Response schema with AI analysis results"""
    is_sufficient: Optional[bool] = True
    ticket_id: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = "Network Connectivity"
    confidence: Optional[float] = 90.0
    priority: Optional[str] = "MEDIUM"
    sentiment: Optional[str] = "Neutral"
    sentiment_score: Optional[float] = 0.0
    escalation_required: Optional[bool] = False
    escalation_risk_score: Optional[float] = 25.0
    escalation_reasons: Optional[List[str]] = []
    response: Optional[str] = ""
    solution: Optional[str] = ""
    ticket_summary: Optional[str] = ""
    action: Optional[str] = ""
    satisfaction: Optional[str] = "Medium"
    similar_issues: Optional[Any] = []
    kb_sources: Optional[List[str]] = []
    steps: Optional[List[dict]] = []

class ComplaintDB(BaseModel):
    """Database schema for storing complaint"""
    id: int
    ticket_id: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    category: str
    priority: str
    sentiment: Optional[str]
    sentiment_score: Optional[float] = 0.0
    response: Optional[str]
    solution: Optional[str]
    satisfaction_prediction: Optional[str]
    action: Optional[str]
    similar_complaints: Optional[str]
    ai_analysis_steps: Optional[str]
    user_rating: Optional[int]
    user_feedback: Optional[str]
    user_resolution_feedback: Optional[bool]
    user_resolution_comment: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_resolved: bool

    class Config:
        from_attributes = True

class BulkDeleteRequest(BaseModel):
    """Request schema for bulk deleting complaints"""
    ids: list[int]