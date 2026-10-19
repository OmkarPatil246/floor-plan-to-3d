from pydantic import BaseModel
from typing import List, Optional, Dict

class Room(BaseModel):
    name: str
    roomType: str
    area: float
    doors: int
    windows: int
    wallLength: float
    orientation: str
    connectedRooms: List[str]

class FloorPlan(BaseModel):
    rooms: List[Room]

class Issue(BaseModel):
    room: str
    problem: str
    severity: str
    actual: str
    expected: str
    reason: str

class Suggestion(BaseModel):
    issue: str
    improvement: str

class AnalysisResult(BaseModel):
    issues: List[Issue]
    ai_recommendations: str
    top_suggestions: List[Suggestion]
    overall_score: int
    room_scores: Dict[str, int]

class QuestionRequest(BaseModel):
    question: str
    floor_plan: Optional[FloorPlan] = None
    issues: Optional[List[Issue]] = None

class QuestionResponse(BaseModel):
    answer: str
