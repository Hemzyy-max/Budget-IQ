from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.savings_goal import SavingsGoal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from app.services.analytics_engine import AnalyticsEngine
from app.services.notification_service import notification_manager
from app.api.deps import get_current_user

router = APIRouter(prefix="/goals", tags=["Savings Goals"])

def _format_goal_response(goal: SavingsGoal, current_monthly_savings: float) -> GoalResponse:
    today = date.today()
    remaining = max(0.0, float(goal.target_amount) - float(goal.saved_amount))
    progress = (float(goal.saved_amount) / float(goal.target_amount) * 100.0) if goal.target_amount > 0 else 0.0

    # Calculate months left until target date
    days_left = (goal.target_date - today).days
    months_left = max(1.0, days_left / 30.4)
    required_monthly = remaining / months_left if remaining > 0 else 0.0

    # Estimate timeline based on current savings rate
    est_months = None
    if remaining == 0:
        summary = "Goal achieved! 🎉"
    elif current_monthly_savings > 0:
        est_months = max(1, round(remaining / current_monthly_savings))
        summary = f"At your current savings rate, you'll reach this goal in approx {est_months} month{'s' if est_months != 1 else ''}."
    else:
        summary = f"Requires ₹{round(required_monthly):,}/month to reach target on schedule."

    return GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=goal.target_amount,
        saved_amount=goal.saved_amount,
        target_date=goal.target_date,
        created_at=goal.created_at,
        remaining_amount=round(remaining, 2),
        progress_percentage=round(progress, 1),
        required_monthly_saving=round(required_monthly, 2),
        estimated_months_to_complete=est_months,
        status_summary=summary
    )

@router.get("", response_model=List[GoalResponse])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all savings goals with progress and timeline calculations."""
    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == current_user.id)
        .order_by(SavingsGoal.target_date.asc())
        .all()
    )
    analytics = AnalyticsEngine(db, current_user)
    metrics = analytics.get_summary_metrics()
    current_monthly_savings = metrics["savings"]

    return [_format_goal_response(g, current_monthly_savings) for g in goals]

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new savings goal."""
    new_goal = SavingsGoal(
        user_id=current_user.id,
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        saved_amount=goal_in.saved_amount,
        target_date=goal_in.target_date
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    analytics = AnalyticsEngine(db, current_user)
    metrics = analytics.get_summary_metrics()
    return _format_goal_response(new_goal, metrics["savings"])

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update target amount, saved balance, or target date."""
    g = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found.")

    if goal_update.name is not None:
        g.name = goal_update.name
    if goal_update.target_amount is not None:
        g.target_amount = goal_update.target_amount
    if goal_update.saved_amount is not None:
        g.saved_amount = goal_update.saved_amount
    if goal_update.target_date is not None:
        g.target_date = goal_update.target_date

    db.commit()
    db.refresh(g)

    # Trigger real-time milestone notification
    notification_manager.check_and_notify_goal_milestone(db, current_user.id, g.id)

    analytics = AnalyticsEngine(db, current_user)
    metrics = analytics.get_summary_metrics()
    return _format_goal_response(g, metrics["savings"])

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a savings goal."""
    g = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found.")
    db.delete(g)
    db.commit()
    return None
