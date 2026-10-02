from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

class GoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_amount: float = Field(..., gt=0)
    saved_amount: float = Field(default=0.0, ge=0)
    target_date: date

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = Field(None, gt=0)
    saved_amount: Optional[float] = Field(None, ge=0)
    target_date: Optional[date] = None

class GoalResponse(GoalBase):
    id: int
    user_id: int
    created_at: datetime
    remaining_amount: float = 0.0
    progress_percentage: float = 0.0
    required_monthly_saving: float = 0.0
    estimated_months_to_complete: Optional[int] = None
    status_summary: str = ""

    class Config:
        from_attributes = True
