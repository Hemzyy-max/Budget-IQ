from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class BudgetBase(BaseModel):
    category: str
    budget_amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    budget_amount: Optional[float] = Field(None, gt=0)
    month: Optional[int] = Field(None, ge=1, le=12)
    year: Optional[int] = Field(None, ge=2020)

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BudgetWithProgressResponse(BudgetResponse):
    spent_amount: float = 0.0
    remaining_amount: float = 0.0
    percentage_used: float = 0.0
    is_exceeded: bool = False
    is_warning: bool = False
    status_message: str = ""
