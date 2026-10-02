from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

class RecurringBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    category: str
    frequency: str = Field(default="Monthly", description="Weekly, Monthly, Quarterly, Yearly")
    next_due_date: date

class RecurringCreate(RecurringBase):
    pass

class RecurringUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    frequency: Optional[str] = None
    next_due_date: Optional[date] = None

class RecurringResponse(RecurringBase):
    id: int
    user_id: int
    created_at: datetime
    days_until_due: int = 0
    is_due_soon: bool = False

    class Config:
        from_attributes = True

class DetectedRecurringResponse(BaseModel):
    name: str
    amount: float
    category: str
    frequency: str = "Monthly"
    confidence: float
    occurrences_count: int
    estimated_next_date: date
    detected_reason: str
