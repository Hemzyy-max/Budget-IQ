from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.recurring_expense import RecurringExpense
from app.schemas.recurring import (
    RecurringCreate,
    RecurringUpdate,
    RecurringResponse,
    DetectedRecurringResponse
)
from app.services.recurring_detector import RecurringDetector
from app.api.deps import get_current_user

router = APIRouter(prefix="/recurring-expenses", tags=["Recurring Expenses"])

@router.get("", response_model=List[RecurringResponse])
def get_recurring_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve recurring expenses sorted by next due date."""
    recurrings = (
        db.query(RecurringExpense)
        .filter(RecurringExpense.user_id == current_user.id)
        .order_by(RecurringExpense.next_due_date.asc())
        .all()
    )
    today = date.today()
    results = []
    for r in recurrings:
        days_left = (r.next_due_date - today).days
        results.append(RecurringResponse(
            id=r.id,
            user_id=r.user_id,
            name=r.name,
            amount=r.amount,
            category=r.category,
            frequency=r.frequency,
            next_due_date=r.next_due_date,
            created_at=r.created_at,
            days_until_due=days_left,
            is_due_soon=0 <= days_left <= 5
        ))
    return results

@router.get("/detected", response_model=List[DetectedRecurringResponse])
def get_detected_recurring_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scans past transactions and detects potential recurring charges
    that have not yet been registered (e.g. Netflix, Amazon Prime).
    """
    detector = RecurringDetector(db, current_user)
    return detector.detect_recurring_candidates()

@router.post("", response_model=RecurringResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_expense(
    rec_in: RecurringCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new recurring commitment."""
    new_rec = RecurringExpense(
        user_id=current_user.id,
        name=rec_in.name,
        amount=rec_in.amount,
        category=rec_in.category,
        frequency=rec_in.frequency,
        next_due_date=rec_in.next_due_date
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)

    days_left = (new_rec.next_due_date - date.today()).days
    return RecurringResponse(
        id=new_rec.id,
        user_id=new_rec.user_id,
        name=new_rec.name,
        amount=new_rec.amount,
        category=new_rec.category,
        frequency=new_rec.frequency,
        next_due_date=new_rec.next_due_date,
        created_at=new_rec.created_at,
        days_until_due=days_left,
        is_due_soon=0 <= days_left <= 5
    )

@router.put("/{rec_id}", response_model=RecurringResponse)
def update_recurring_expense(
    rec_id: int,
    rec_update: RecurringUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update recurring expense details or next due date."""
    r = db.query(RecurringExpense).filter(
        RecurringExpense.id == rec_id,
        RecurringExpense.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recurring expense not found.")

    if rec_update.name is not None:
        r.name = rec_update.name
    if rec_update.amount is not None:
        r.amount = rec_update.amount
    if rec_update.category is not None:
        r.category = rec_update.category
    if rec_update.frequency is not None:
        r.frequency = rec_update.frequency
    if rec_update.next_due_date is not None:
        r.next_due_date = rec_update.next_due_date

    db.commit()
    db.refresh(r)
    days_left = (r.next_due_date - date.today()).days
    return RecurringResponse(
        id=r.id,
        user_id=r.user_id,
        name=r.name,
        amount=r.amount,
        category=r.category,
        frequency=r.frequency,
        next_due_date=r.next_due_date,
        created_at=r.created_at,
        days_until_due=days_left,
        is_due_soon=0 <= days_left <= 5
    )

@router.delete("/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_expense(
    rec_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a recurring expense."""
    r = db.query(RecurringExpense).filter(
        RecurringExpense.id == rec_id,
        RecurringExpense.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recurring expense not found.")
    db.delete(r)
    db.commit()
    return None
