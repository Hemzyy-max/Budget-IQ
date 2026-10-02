from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50), nullable=False)  # 'income' or 'expense'
    category = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    payment_method = Column(String(50), default="UPI")  # Cash, UPI, Card, Bank Transfer, Other
    transaction_date = Column(Date, nullable=False, default=date.today, index=True)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
