from datetime import datetime
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import (
    DashboardResponse,
    PressureScoreResponse,
    ForecastResponse,
    SpendingBehaviorResponse,
    FinancialHealthResponse,
    InsightCard,
    CategoryTrendItem,
    SpendingVelocityResponse,
    BudgetStreakResponse
)
from app.services.analytics_engine import AnalyticsEngine
from app.services.forecasting_engine import ForecastingEngine
from app.services.pressure_engine import PressureEngine
from app.services.insight_engine import InsightEngine
from app.services.demo_seeder import seed_demo_data
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Intelligence"])

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Optimized consolidated endpoint returning all key financial intelligence
    metrics for high-performance dashboard loading.
    """
    # Initialize shared engine instances
    analytics = AnalyticsEngine(db, current_user)
    df = analytics._get_transactions_df()

    forecasting = ForecastingEngine(db, current_user, analytics)
    pressure = PressureEngine(db, current_user, analytics)
    insight_eng = InsightEngine(db, current_user, analytics, pressure, forecasting)

    # 1. Core Summary Metrics
    summary = analytics.get_summary_metrics(df)

    # 2. Financial Pressure Score
    pressure_data = pressure.calculate_pressure(df)

    # 3. Forecast
    forecast_data = forecasting.forecast_month_end(df)

    # 4. Spending Velocity
    velocity_data = analytics.get_spending_velocity(df)

    # 5. Category Breakdown & Trends
    category_breakdown = analytics.get_category_breakdown(df)
    category_trends = analytics.get_category_trends(df)

    # 6. Upcoming Recurring
    upcoming_expenses = analytics.get_upcoming_recurring_expenses(days_ahead=20)

    # 7. Financial Health
    health_data = analytics.get_financial_health_score(df)

    # 8. Actionable Insights
    insights = insight_eng.generate_insights(df)

    # Friendly greeting based on hour
    hour = datetime.now().hour
    if hour < 12:
        time_greeting = "Good morning"
    elif hour < 17:
        time_greeting = "Good afternoon"
    else:
        time_greeting = "Good evening"

    greeting = f"{time_greeting}, {current_user.name.split()[0]}"

    return DashboardResponse(
        user_name=current_user.name,
        greeting=greeting,
        current_balance=summary["current_balance"],
        total_income=summary["total_income"],
        total_expenses=summary["total_expenses"],
        savings=summary["savings"],
        savings_rate=summary["savings_rate"],
        pressure_score=pressure_data["score"],
        pressure_level=pressure_data["level"],
        pressure_headline=pressure_data["headline"],
        pressure_explanation=pressure_data["explanation"],
        pressure_factors=pressure_data["factors"],
        days_until_pressure=pressure_data.get("days_until_pressure"),
        pressure_timeline=pressure_data["timeline"],
        predicted_month_end_balance=forecast_data["predicted_month_end_balance"],
        prediction_confidence=forecast_data["confidence_percentage"],
        forecast_timeline=forecast_data["forecast_timeline"],
        spending_velocity=SpendingVelocityResponse(**velocity_data),
        category_breakdown=category_breakdown,
        category_trends=[CategoryTrendItem(**t) for t in category_trends],
        upcoming_expenses=upcoming_expenses,
        financial_health=FinancialHealthResponse(**health_data),
        insights=[InsightCard(**i) for i in insights],
        budget_streak=BudgetStreakResponse(**analytics.get_budget_streak(df))
    )

@router.get("/pressure-score", response_model=PressureScoreResponse)
def get_pressure_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve detailed Financial Pressure Score and progression timeline."""
    pressure = PressureEngine(db, current_user)
    return pressure.calculate_pressure()

@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve month-end balance forecast and dual-mode chart trajectory."""
    forecasting = ForecastingEngine(db, current_user)
    return forecasting.forecast_month_end()

@router.get("/spending-behavior")
def get_spending_behavior(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve category trend percentages and velocity indicators."""
    analytics = AnalyticsEngine(db, current_user)
    df = analytics._get_transactions_df()
    return {
        "velocity": analytics.get_spending_velocity(df),
        "trends": analytics.get_category_trends(df),
        "breakdown": analytics.get_category_breakdown(df)
    }

@router.get("/financial-health", response_model=FinancialHealthResponse)
def get_financial_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve 5-pillar financial health score."""
    analytics = AnalyticsEngine(db, current_user)
    return analytics.get_financial_health_score()

@router.get("/insights")
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all smart actionable insights."""
    insight_eng = InsightEngine(db, current_user)
    return insight_eng.generate_insights()

@router.post("/seed-demo", status_code=status.HTTP_200_OK)
def trigger_seed_demo(db: Session = Depends(get_db)):
    """Seeds the realistic 3-month demo user dataset for hackathon judges."""
    user = seed_demo_data(db, force_reset=True)
    return {
        "message": "Demo data successfully seeded!",
        "email": user.email,
        "password": "password123",
        "balance": user.current_balance
    }

@router.post("/reset-demo", status_code=status.HTTP_200_OK)
def trigger_reset_demo(db: Session = Depends(get_db)):
    """Resets the demo data to its pristine demonstration state."""
    user = seed_demo_data(db, force_reset=True)
    return {
        "message": "Demo environment reset to baseline.",
        "email": user.email,
        "balance": user.current_balance
    }
