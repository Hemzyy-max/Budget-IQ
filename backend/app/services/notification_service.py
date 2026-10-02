import asyncio
import json
import logging
from typing import Dict, List
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.recurring_expense import RecurringExpense
from app.models.savings_goal import SavingsGoal

logger = logging.getLogger("budget_iq.notifications")

class NotificationManager:
    def __init__(self):
        # Maps user_id -> List[asyncio.Queue] for active SSE streams
        self._user_listeners: Dict[int, List[asyncio.Queue]] = {}

    def register_listener(self, user_id: int) -> asyncio.Queue:
        queue = asyncio.Queue()
        if user_id not in self._user_listeners:
            self._user_listeners[user_id] = []
        self._user_listeners[user_id].append(queue)
        logger.info(f"Registered SSE listener for user {user_id}. Active listeners: {len(self._user_listeners[user_id])}")
        return queue

    def unregister_listener(self, user_id: int, queue: asyncio.Queue):
        if user_id in self._user_listeners:
            try:
                self._user_listeners[user_id].remove(queue)
                if not self._user_listeners[user_id]:
                    del self._user_listeners[user_id]
                logger.info(f"Unregistered SSE listener for user {user_id}")
            except ValueError:
                pass

    async def broadcast_to_user(self, user_id: int, notification_data: dict):
        listeners = self._user_listeners.get(user_id, [])
        for queue in listeners:
            await queue.put(notification_data)

    def create_notification(
        self,
        db: Session,
        user_id: int,
        type: str,
        title: str,
        message: str,
        severity: str = "info",
        link_view: str = None
    ) -> Notification:
        """Create notification in DB and push to live SSE queues."""
        notif = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            severity=severity,
            link_view=link_view,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        payload = {
            "id": notif.id,
            "user_id": notif.user_id,
            "type": notif.type,
            "title": notif.title,
            "message": notif.message,
            "severity": notif.severity,
            "link_view": notif.link_view,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat()
        }

        # Non-blocking async queue dispatch
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast_to_user(user_id, payload))
        except RuntimeError:
            pass

        return notif

    def notify_login(self, db: Session, user_id: int, user_name: str, client_host: str = "Browser"):
        """Real-time security notification on account login."""
        now_str = datetime.now().strftime("%I:%M %p")
        return self.create_notification(
            db=db,
            user_id=user_id,
            type="login",
            title="Real-Time Sign-In Detected",
            message=f"Welcome {user_name}! Signed in at {now_str} from {client_host}.",
            severity="success",
            link_view="dashboard"
        )

    def check_and_notify_budget_threshold(self, db: Session, user_id: int, category: str):
        """Check if an expense pushed category budget to warning (>80%) or exceeded (>100%)."""
        today = date.today()
        budget = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category == category,
            Budget.month == today.month,
            Budget.year == today.year
        ).first()

        if not budget:
            return None

        # Compute total spent
        txs = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.category == category,
            Transaction.transaction_type == "expense"
        ).all()

        spent = sum(
            float(t.amount) for t in txs
            if getattr(t.transaction_date, "month", None) == today.month
            and getattr(t.transaction_date, "year", None) == today.year
        )

        budget_amt = float(budget.budget_amount)
        if budget_amt <= 0:
            return None

        ratio = spent / budget_amt
        if ratio > 1.0:
            over = spent - budget_amt
            return self.create_notification(
                db=db,
                user_id=user_id,
                type="budget_alert",
                title=f"Budget Exceeded: {category}",
                message=f"You exceeded your {category} budget by ₹{over:,.0f} (Total spent: ₹{spent:,.0f} / ₹{budget_amt:,.0f}).",
                severity="critical",
                link_view="budgets"
            )
        elif ratio >= 0.8:
            pct = round(ratio * 100)
            return self.create_notification(
                db=db,
                user_id=user_id,
                type="budget_alert",
                title=f"Budget Warning: {category}",
                message=f"You have reached {pct}% of your {category} monthly budget (₹{spent:,.0f} / ₹{budget_amt:,.0f}).",
                severity="warning",
                link_view="budgets"
            )
        return None

    def check_and_notify_upcoming_bills(self, db: Session, user_id: int):
        """Notify for recurring bills due in next 3 days."""
        today = date.today()
        bills = db.query(RecurringExpense).filter(RecurringExpense.user_id == user_id).all()
        for b in bills:
            days_left = (b.next_due_date - today).days
            if 0 <= days_left <= 3:
                # Check if already notified recently to prevent spam
                recent = db.query(Notification).filter(
                    Notification.user_id == user_id,
                    Notification.type == "bill_reminder",
                    Notification.title.like(f"%{b.name}%")
                ).order_by(Notification.created_at.desc()).first()

                if not recent or (datetime.utcnow() - recent.created_at).total_seconds() > 86400:
                    due_label = "today" if days_left == 0 else f"in {days_left} day{'s' if days_left > 1 else ''}"
                    self.create_notification(
                        db=db,
                        user_id=user_id,
                        type="bill_reminder",
                        title=f"Bill Reminder: {b.name}",
                        message=f"{b.name} (₹{b.amount:,.0f}) is due {due_label}. Ensure your account is funded.",
                        severity="warning",
                        link_view="recurring"
                    )

    def check_and_notify_goal_milestone(self, db: Session, user_id: int, goal_id: int):
        """Notify when savings goal reaches milestone."""
        goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id).first()
        if not goal or goal.target_amount <= 0:
            return None

        pct = (goal.saved_amount / goal.target_amount) * 100
        if pct >= 100:
            return self.create_notification(
                db=db,
                user_id=user_id,
                type="goal_milestone",
                title=f"Goal Achieved! 🏆 {goal.name}",
                message=f"Congratulations! You successfully reached your goal of ₹{goal.target_amount:,.0f} for {goal.name}!",
                severity="success",
                link_view="goals"
            )
        elif pct >= 50:
            return self.create_notification(
                db=db,
                user_id=user_id,
                type="goal_milestone",
                title=f"Milestone Reached: {goal.name}",
                message=f"You're {round(pct)}% of the way to your {goal.name} target (₹{goal.saved_amount:,.0f} / ₹{goal.target_amount:,.0f}).",
                severity="info",
                link_view="goals"
            )
        return None

notification_manager = NotificationManager()
