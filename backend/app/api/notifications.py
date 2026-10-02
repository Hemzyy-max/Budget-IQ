import asyncio
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db, SessionLocal
from app.core.security import decode_access_token
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.api.deps import get_current_user
from app.services.notification_service import notification_manager

logger = logging.getLogger("budget_iq.api.notifications")
router = APIRouter(prefix="/notifications", tags=["Real-Time Notifications"])

@router.get("", response_model=NotificationListResponse)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100)
):
    """Retrieve all notifications for the current user with unread count."""
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
        .all()
    )
    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .count()
    )
    total_count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .count()
    )
    return NotificationListResponse(
        unread_count=unread_count,
        total_count=total_count,
        notifications=[NotificationResponse.model_validate(n) for n in notifications]
    )

@router.get("/stream")
async def stream_notifications(
    request: Request,
    token: Optional[str] = Query(None)
):
    """
    Real-time Server-Sent Events (SSE) stream.
    Pushes live alerts, security login notifications, and budget warnings instantly.
    """
    auth_header = request.headers.get("Authorization")
    actual_token = token
    if not actual_token and auth_header and auth_header.startswith("Bearer "):
        actual_token = auth_header.split(" ")[1]

    if not actual_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth token for SSE stream")

    user_id_str = decode_access_token(actual_token)
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token for SSE stream")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    # Verify user exists in database
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        # Trigger background bill check
        notification_manager.check_and_notify_upcoming_bills(db, user_id)
    finally:
        db.close()

    queue = notification_manager.register_listener(user_id)

    async def event_generator():
        try:
            # Send initial connection confirmation event
            init_event = {
                "type": "connection",
                "status": "connected",
                "message": "Real-time notifications connected successfully."
            }
            yield f"data: {json.dumps(init_event)}\n\n"

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                try:
                    # Wait for next notification with timeout for keepalive ping
                    notification_data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(notification_data)}\n\n"
                except asyncio.TimeoutError:
                    # Send periodic SSE keepalive comment to keep connection alive
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            notification_manager.unregister_listener(user_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )

@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return NotificationResponse.model_validate(notif)

@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read for current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a notification."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notif)
    db.commit()
    return None

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear all notifications for current user."""
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.commit()
    return None

@router.post("/test", response_model=NotificationResponse)
def send_test_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dispatch an instant test notification to verify real-time alerts."""
    notif = notification_manager.create_notification(
        db=db,
        user_id=current_user.id,
        type="system",
        title="Live Test Alert ⚡",
        message="Budget IQ real-time notification engine is working with 100% fidelity!",
        severity="success",
        link_view="dashboard"
    )
    return NotificationResponse.model_validate(notif)
