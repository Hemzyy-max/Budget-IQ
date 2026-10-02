from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class TimelinePoint(BaseModel):
    date: str
    balance: float
    is_projected: bool
    label: Optional[str] = None

class PressureTimelinePoint(BaseModel):
    day_label: str  # e.g., "Today", "Day 4", "Day 8", "Payday"
    days_from_now: int
    date: str
    status: str     # "Normal", "Stable", "Pressure Increasing", "Income Expected", "Critical"
    projected_buffer: float

class PressureScoreResponse(BaseModel):
    score: int                     # 0 - 100
    level: str                     # "Very Low", "Low", "Moderate", "High", "Critical"
    trend: str                     # "improving", "stable", "increasing"
    days_until_pressure: Optional[int] = None
    headline: str
    explanation: str
    factors: List[str]
    timeline: List[PressureTimelinePoint]

class ForecastResponse(BaseModel):
    predicted_month_end_balance: float
    current_balance: float
    expected_remaining_spending: float
    upcoming_recurring: float
    expected_income: float
    confidence_percentage: int
    forecast_timeline: List[TimelinePoint]
    status_summary: str

class CategoryTrendItem(BaseModel):
    category: str
    current_month_spending: float
    historical_average: float
    percentage_change: float
    is_increasing: bool
    insight_text: str

class SpendingVelocityResponse(BaseModel):
    current_daily_spending: float
    historical_daily_spending: float
    velocity_ratio: float
    percentage_difference: float
    is_higher: bool
    status_message: str

class SpendingBehaviorResponse(BaseModel):
    velocity: SpendingVelocityResponse
    trends: List[CategoryTrendItem]
    breakdown: List[Dict[str, Any]]

class HealthScoreBreakdown(BaseModel):
    spending_discipline: int
    savings_rate: int
    budget_control: int
    emergency_buffer: int
    recurring_expense_load: int

class FinancialHealthResponse(BaseModel):
    overall_score: int
    rating: str
    summary_message: str
    breakdown: HealthScoreBreakdown

class InsightCard(BaseModel):
    id: Optional[str] = None
    insight_type: str  # "warning", "pressure", "positive", "recurring", "budget", "spending"
    title: str
    what_happened: str
    why_it_matters: str
    what_you_can_do: str
    severity: str      # "critical", "warning", "info", "positive"
    created_at: Optional[datetime] = None

class UpcomingExpenseItem(BaseModel):
    id: int
    name: str
    amount: float
    category: str
    next_due_date: str
    days_remaining: int
    is_due_soon: bool

class BudgetStreakResponse(BaseModel):
    current_streak: int
    best_streak: int
    daily_budget: float
    streak_message: str
    streak_status: str  # "legendary", "on_fire", "strong", "building", "starting", "broken", "inactive"

class DashboardResponse(BaseModel):
    user_name: str
    greeting: str
    current_balance: float
    total_income: float
    total_expenses: float
    savings: float
    savings_rate: float
    
    # Financial Pressure Score
    pressure_score: int
    pressure_level: str
    pressure_headline: str
    pressure_explanation: str
    pressure_factors: List[str]
    days_until_pressure: Optional[int] = None
    pressure_timeline: List[PressureTimelinePoint]

    # Forecast & Velocity
    predicted_month_end_balance: float
    prediction_confidence: int
    forecast_timeline: List[TimelinePoint]
    spending_velocity: SpendingVelocityResponse

    # Categories & Budgets
    category_breakdown: List[Dict[str, Any]]
    category_trends: List[CategoryTrendItem]
    upcoming_expenses: List[UpcomingExpenseItem]

    # Health & Insights
    financial_health: FinancialHealthResponse
    insights: List[InsightCard]

    # Budget Streak
    budget_streak: BudgetStreakResponse
