from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse, Token
from app.api.deps import get_current_user
from app.services.notification_service import notification_manager

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        monthly_income=user_in.monthly_income,
        income_type=user_in.income_type,
        expected_income_date=user_in.expected_income_date,
        current_balance=user_in.current_balance
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Real-time welcome & login alert
    notification_manager.notify_login(db, user.id, user.name, "Web Client")

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate a user and return JWT access token."""
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect."
        )

    # Real-time login notification
    notification_manager.notify_login(db, user.id, user.name, "Web Client")

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated user profile."""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user income, payday or balance settings."""
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.monthly_income is not None:
        current_user.monthly_income = user_update.monthly_income
    if user_update.income_type is not None:
        current_user.income_type = user_update.income_type
    if user_update.expected_income_date is not None:
        current_user.expected_income_date = user_update.expected_income_date
    if user_update.current_balance is not None:
        current_user.current_balance = user_update.current_balance

    db.commit()
    db.refresh(current_user)
    return current_user
