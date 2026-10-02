from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in Indian Rupees")
    transaction_type: str = Field(..., description="'income' or 'expense'")
    category: str = Field(..., description="e.g. Food, Transport, Shopping, Entertainment, Bills, Education, Health, Subscriptions, Other")
    description: Optional[str] = None
    payment_method: str = Field(default="UPI", description="Cash, UPI, Card, Bank Transfer, Other")
    transaction_date: date = Field(default_factory=date.today)
    is_recurring: bool = False

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_date: Optional[date] = None
    is_recurring: Optional[bool] = None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
