from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    monthly_income: float = Field(default=0.0, ge=0)
    income_type: str = "Salary"
    expected_income_date: int = Field(default=1, ge=1, le=31)
    current_balance: float = Field(default=0.0)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    monthly_income: Optional[float] = None
    income_type: Optional[str] = None
    expected_income_date: Optional[int] = None
    current_balance: Optional[float] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
