from datetime import date, timedelta
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.transaction import Transaction
from app.models.recurring_expense import RecurringExpense

class RecurringDetector:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def detect_recurring_candidates(self) -> List[Dict[str, Any]]:
        """
        Scans transaction history for repeated similar expenses occurring
        at periodic intervals (Weekly, Monthly, etc.) that are NOT already
        registered in the user's recurring_expenses table.
        """
        # 1. Fetch all expense transactions
        transactions = (
            self.db.query(Transaction)
            .filter(
                Transaction.user_id == self.user.id,
                Transaction.transaction_type == "expense"
            )
            .order_by(Transaction.transaction_date.asc())
            .all()
        )
        if len(transactions) < 2:
            return []

        # 2. Existing recurring names / amounts to avoid recommending duplicates
        existing_recurring = (
            self.db.query(RecurringExpense)
            .filter(RecurringExpense.user_id == self.user.id)
            .all()
        )
        existing_signatures = set((r.name.lower(), round(r.amount, 0)) for r in existing_recurring)

        # 3. Group by description or category
        # Clean description
        tx_data = []
        for t in transactions:
            desc = (t.description or t.category).strip()
            tx_data.append({
                "id": t.id,
                "desc": desc,
                "amount": float(t.amount),
                "category": t.category,
                "date": t.transaction_date
            })

        df = pd.DataFrame(tx_data)
        candidates = []

        # Group by description or similar amount in category
        for desc, group in df.groupby("desc"):
            if len(group) < 2:
                continue

            group = group.sort_values(by="date")
            amounts = group["amount"].values
            # Check amount consistency (coefficient of variation <= 0.08, or all within 5%)
            mean_amt = float(np.mean(amounts))
            if mean_amt <= 0:
                continue
            std_amt = float(np.std(amounts))
            cv = std_amt / mean_amt

            if cv > 0.10:
                continue  # Amount fluctuates too much

            # Check intervals between consecutive transactions
            dates = list(group["date"])
            intervals = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
            if not intervals:
                continue

            mean_interval = float(np.mean(intervals))

            frequency = None
            if 25 <= mean_interval <= 35:
                frequency = "Monthly"
            elif 6 <= mean_interval <= 9:
                frequency = "Weekly"
            elif 85 <= mean_interval <= 95:
                frequency = "Quarterly"
            elif 350 <= mean_interval <= 380:
                frequency = "Yearly"

            if frequency:
                # Check if already in recurring list
                sig = (desc.lower(), round(mean_amt, 0))
                if sig in existing_signatures:
                    continue

                last_date = dates[-1]
                if frequency == "Monthly":
                    est_next = last_date + timedelta(days=30)
                elif frequency == "Weekly":
                    est_next = last_date + timedelta(days=7)
                elif frequency == "Quarterly":
                    est_next = last_date + timedelta(days=90)
                else:
                    est_next = last_date + timedelta(days=365)

                # Confidence calculation
                consistency_score = max(0.6, 1.0 - cv)
                count_bonus = min(0.3, len(group) * 0.08)
                confidence = round(min(0.98, consistency_score + count_bonus), 2)

                candidates.append({
                    "name": desc,
                    "amount": round(mean_amt, 2),
                    "category": group["category"].iloc[-1],
                    "frequency": frequency,
                    "confidence": confidence,
                    "occurrences_count": len(group),
                    "estimated_next_date": est_next.isoformat(),
                    "detected_reason": f"Detected {len(group)} regular charges averaging ₹{round(mean_amt):,} every ~{round(mean_interval)} days."
                })

        return candidates
