from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationBase(BaseModel):
    type: str = "system"
    title: str
    message: str
    severity: str = "info"
    link_view: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    unread_count: int
    total_count: int
    notifications: List[NotificationResponse]
