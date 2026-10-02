from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class FinancialInsight(Base):
    __tablename__ = "financial_insights"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    insight_type = Column(String(50), nullable=False)  # warning, pressure, positive, recurring, budget, spending
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), default="info")  # low, medium, high, critical, positive
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="insights")
