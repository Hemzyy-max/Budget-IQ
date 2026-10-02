from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetWithProgressResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetWithProgressResponse])
def get_budgets(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve budgets with live spent amount, remaining amount, and progress warnings."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == target_month,
            Budget.year == target_year
        )
        .all()
    )

    # Calculate current spending for these categories in the target month
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense"
        )
        .all()
    )

    spent_map = {}
    for t in transactions:
        t_date = t.transaction_date
        try:
            t_month = t_date.month if hasattr(t_date, "month") else int(str(t_date).split("-")[1])
            t_year = t_date.year if hasattr(t_date, "year") else int(str(t_date).split("-")[0])
            if t_month == target_month and t_year == target_year:
                spent_map[t.category] = spent_map.get(t.category, 0.0) + float(t.amount)
        except Exception:
            continue

    results = []
    for b in budgets:
        spent = spent_map.get(b.category, 0.0)
        budget_amt = float(b.budget_amount)
        pct = (spent / budget_amt * 100.0) if budget_amt > 0 else 0.0
        remaining = budget_amt - spent
        is_exceeded = spent > budget_amt
        is_warning = (pct >= 80.0) and not is_exceeded

        if is_exceeded:
            msg = f"{b.category} budget exceeded by ₹{round(abs(remaining)):,}."
        elif is_warning:
            msg = f"Approaching {b.category} budget limit ({round(pct)}% used)."
        else:
            msg = f"₹{round(remaining):,} remaining for this month."

        results.append(BudgetWithProgressResponse(
            id=b.id,
            user_id=b.user_id,
            category=b.category,
            budget_amount=budget_amt,
            month=b.month,
            year=b.year,
            created_at=b.created_at,
            spent_amount=round(spent, 2),
            remaining_amount=round(remaining, 2),
            percentage_used=round(pct, 1),
            is_exceeded=is_exceeded,
            is_warning=is_warning,
            status_message=msg
        ))
    return results

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category budget."""
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget_in.category,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    ).first()

    if existing:
        # Update existing budget instead of duplicating
        existing.budget_amount = budget_in.budget_amount
        db.commit()
        db.refresh(existing)
        return existing

    new_budget = Budget(
        user_id=current_user.id,
        category=budget_in.category,
        budget_amount=budget_in.budget_amount,
        month=budget_in.month,
        year=budget_in.year
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget

@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a budget amount or category."""
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found.")

    if budget_update.category is not None:
        b.category = budget_update.category
    if budget_update.budget_amount is not None:
        b.budget_amount = budget_update.budget_amount
    if budget_update.month is not None:
        b.month = budget_update.month
    if budget_update.year is not None:
        b.year = budget_update.year

    db.commit()
    db.refresh(b)
    return b

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a budget entry."""
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found.")
    db.delete(b)
    db.commit()
    return None
