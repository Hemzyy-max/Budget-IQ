from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.core.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.api.deps import get_current_user
from app.services.notification_service import notification_manager

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search description or category"),
    category: Optional[str] = Query(None, description="Filter by category"),
    transaction_type: Optional[str] = Query(None, description="Filter by 'income' or 'expense'"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    sort_by: str = Query("date_desc", description="date_desc, date_asc, amount_desc, amount_asc"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Retrieve all transactions for the current user with filtering, search, and sorting."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_pattern),
                Transaction.category.ilike(search_pattern),
                Transaction.payment_method.ilike(search_pattern)
            )
        )

    if category and category.lower() != "all":
        query = query.filter(Transaction.category == category)

    if transaction_type and transaction_type.lower() != "all":
        query = query.filter(Transaction.transaction_type == transaction_type.lower())

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)

    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    if sort_by == "date_asc":
        query = query.order_by(asc(Transaction.transaction_date), asc(Transaction.id))
    elif sort_by == "amount_desc":
        query = query.order_by(desc(Transaction.amount))
    elif sort_by == "amount_asc":
        query = query.order_by(asc(Transaction.amount))
    else:  # default date_desc
        query = query.order_by(desc(Transaction.transaction_date), desc(Transaction.id))

    return query.offset(offset).limit(limit).all()

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction and dynamically update the user's current balance."""
    new_tx = Transaction(
        user_id=current_user.id,
        amount=tx_in.amount,
        transaction_type=tx_in.transaction_type.lower(),
        category=tx_in.category,
        description=tx_in.description,
        payment_method=tx_in.payment_method,
        transaction_date=tx_in.transaction_date,
        is_recurring=tx_in.is_recurring
    )
    db.add(new_tx)

    # Dynamically adjust user current_balance
    if new_tx.transaction_type == "income":
        current_user.current_balance += new_tx.amount
    else:
        current_user.current_balance -= new_tx.amount

    db.commit()
    db.refresh(new_tx)
    db.refresh(current_user)

    # Check budget thresholds and alert in real time if exceeded or approaching
    if new_tx.transaction_type == "expense":
        notification_manager.check_and_notify_budget_threshold(db, current_user.id, new_tx.category)

    return new_tx

@router.get("/{tx_id}", response_model=TransactionResponse)
def get_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a single transaction by ID."""
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return tx

@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(
    tx_id: int,
    tx_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a transaction and adjust the user's balance accordingly."""
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    # Revert old balance effect
    if tx.transaction_type == "income":
        current_user.current_balance -= tx.amount
    else:
        current_user.current_balance += tx.amount

    # Apply updates
    if tx_update.amount is not None:
        tx.amount = tx_update.amount
    if tx_update.transaction_type is not None:
        tx.transaction_type = tx_update.transaction_type.lower()
    if tx_update.category is not None:
        tx.category = tx_update.category
    if tx_update.description is not None:
        tx.description = tx_update.description
    if tx_update.payment_method is not None:
        tx.payment_method = tx_update.payment_method
    if tx_update.transaction_date is not None:
        tx.transaction_date = tx_update.transaction_date
    if tx_update.is_recurring is not None:
        tx.is_recurring = tx_update.is_recurring

    # Apply new balance effect
    if tx.transaction_type == "income":
        current_user.current_balance += tx.amount
    else:
        current_user.current_balance -= tx.amount

    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a transaction and restore balance."""
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    # Revert balance effect
    if tx.transaction_type == "income":
        current_user.current_balance -= tx.amount
    else:
        current_user.current_balance += tx.amount

    db.delete(tx)
    db.commit()
    return None
