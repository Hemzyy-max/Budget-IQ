import calendar
from datetime import date, datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.transaction import Transaction
from app.models.recurring_expense import RecurringExpense
from app.services.analytics_engine import AnalyticsEngine

class ForecastingEngine:
    def __init__(self, db: Session, user: User, analytics: Optional[AnalyticsEngine] = None):
        self.db = db
        self.user = user
        self.analytics = analytics or AnalyticsEngine(db, user)
        self.today = date.today()
        self.current_year = self.today.year
        self.current_month = self.today.month
        self.days_in_month = calendar.monthrange(self.current_year, self.current_month)[1]
        self.days_elapsed = max(1, self.today.day)
        self.days_remaining = max(0, self.days_in_month - self.days_elapsed)

    def forecast_month_end(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Calculates:
        predicted_month_end_balance = current_balance
                                      - expected_remaining_spending
                                      - upcoming_recurring
                                      + expected_income
        """
        if df is None:
            df = self.analytics._get_transactions_df()

        velocity_data = self.analytics.get_spending_velocity(df)
        current_daily = velocity_data["current_daily_spending"]
        hist_daily = velocity_data["historical_daily_spending"]

        # Blended daily estimate (weighted towards recent velocity, smoothed by history)
        if hist_daily > 0 and current_daily > 0:
            blended_daily = (0.70 * current_daily) + (0.30 * hist_daily)
        elif current_daily > 0:
            blended_daily = current_daily
        elif hist_daily > 0:
            blended_daily = hist_daily
        else:
            blended_daily = max(100.0, (self.user.monthly_income * 0.6) / 30.0)

        expected_remaining_spending = blended_daily * self.days_remaining

        # Find recurring expenses due between today and month end
        month_end_date = date(self.current_year, self.current_month, self.days_in_month)
        upcoming_recurring_expenses = (
            self.db.query(RecurringExpense)
            .filter(
                RecurringExpense.user_id == self.user.id,
                RecurringExpense.next_due_date >= self.today,
                RecurringExpense.next_due_date <= month_end_date
            )
            .all()
        )
        upcoming_recurring_total = sum(float(r.amount) for r in upcoming_recurring_expenses)

        # Check if next income date falls between today and month-end
        expected_income_day = self.user.expected_income_date or 1
        income_expected_this_month = 0.0
        if self.today.day < expected_income_day <= self.days_in_month:
            income_expected_this_month = float(self.user.monthly_income)

        current_balance = float(self.user.current_balance)

        predicted_balance = (
            current_balance
            - expected_remaining_spending
            - upcoming_recurring_total
            + income_expected_this_month
        )

        # Confidence calculation based on month progression and variance
        confidence = self._calculate_confidence(df, current_daily)

        # Summary text
        if predicted_balance > (current_balance * 0.9):
            summary = "Your spending trajectory indicates a healthy, stable month-end balance."
        elif predicted_balance > (0.2 * self.user.monthly_income):
            summary = "Your predicted month-end balance is moderate based on current velocity."
        elif predicted_balance > 0:
            summary = "Caution: Your balance may dip significantly before the next income cycle."
        else:
            summary = "Alert: At current velocity, expenses may exceed available balance before month-end."

        timeline_chart = self.generate_forecast_timeline(
            df=df,
            current_balance=current_balance,
            daily_spending=blended_daily,
            upcoming_recurring=upcoming_recurring_expenses,
            expected_income_day=expected_income_day,
            expected_income_amount=float(self.user.monthly_income)
        )

        return {
            "predicted_month_end_balance": round(predicted_balance, 2),
            "current_balance": round(current_balance, 2),
            "expected_remaining_spending": round(expected_remaining_spending, 2),
            "upcoming_recurring": round(upcoming_recurring_total, 2),
            "expected_income": round(income_expected_this_month, 2),
            "confidence_percentage": confidence,
            "forecast_timeline": timeline_chart,
            "status_summary": summary
        }

    def _calculate_confidence(self, df: pd.DataFrame, current_daily: float) -> int:
        """
        Calculates confidence score (55% - 95%) based on:
        - Elapsed days in month (progressively higher confidence as month nears end)
        - Consistency of daily spending
        - Total transaction history depth
        """
        # Time factor: 1st day = 60%, 30th day = 88%
        progress_ratio = self.days_elapsed / self.days_in_month
        base_confidence = 60.0 + (progress_ratio * 28.0)

        # Stability factor
        if not df.empty:
            cur_month_expenses = df[
                (df["year"] == self.current_year) &
                (df["month"] == self.current_month) &
                (df["transaction_type"] == "expense")
            ]
            if len(cur_month_expenses) >= 5:
                std = cur_month_expenses["amount"].std()
                mean = cur_month_expenses["amount"].mean()
                if mean > 0:
                    cv = std / mean
                    if cv < 0.8:
                        base_confidence += 6.0  # High consistency
                    elif cv > 1.8:
                        base_confidence -= 6.0  # High volatility
            # History depth bonus
            if len(df) > 30:
                base_confidence += 4.0

        return int(max(55, min(95, round(base_confidence))))

    def generate_forecast_timeline(
        self,
        df: pd.DataFrame,
        current_balance: float,
        daily_spending: float,
        upcoming_recurring: List[RecurringExpense],
        expected_income_day: int,
        expected_income_amount: float
    ) -> List[Dict[str, Any]]:
        """
        Generates day-by-day actual + projected balance series for Recharts.
        Transitions smoothly from historical actual balance to projected future balance.
        """
        timeline = []

        # 1. Historical Actual Points for current month (Day 1 to Today)
        # Compute daily net change for past days
        daily_net = {}
        if not df.empty:
            cur_month_df = df[(df["year"] == self.current_year) & (df["month"] == self.current_month)]
            for _, row in cur_month_df.iterrows():
                d_day = row["transaction_date"].day
                net = row["amount"] if row["transaction_type"] == "income" else -row["amount"]
                daily_net[d_day] = daily_net.get(d_day, 0.0) + net

        # Reconstruct backward or forward balance
        # We start from Day 1 to Today
        # Approximate Day 1 start balance
        total_change_so_far = sum(daily_net.get(d, 0.0) for d in range(1, self.days_elapsed + 1))
        approx_start_balance = current_balance - total_change_so_far

        running_balance = approx_start_balance
        for d in range(1, self.days_elapsed + 1):
            dt = date(self.current_year, self.current_month, d)
            running_balance += daily_net.get(d, 0.0)
            timeline.append({
                "date": dt.strftime("%b %d"),
                "balance": round(running_balance, 2),
                "is_projected": False,
                "label": "Actual Balance"
            })

        # Ensure today's actual balance matches current_balance
        if timeline:
            timeline[-1]["balance"] = round(current_balance, 2)
            timeline[-1]["label"] = "Today"

        # 2. Projected Future Points from Today + 1 to End of Month
        projected_balance = current_balance
        recurring_by_day = {}
        for r in upcoming_recurring:
            day_num = r.next_due_date.day
            recurring_by_day[day_num] = recurring_by_day.get(day_num, 0.0) + float(r.amount)

        for d in range(self.days_elapsed + 1, self.days_in_month + 1):
            dt = date(self.current_year, self.current_month, d)
            # Subtract projected daily spending
            projected_balance -= daily_spending
            # Subtract any scheduled recurring expense for this day
            if d in recurring_by_day:
                projected_balance -= recurring_by_day[d]
            # Add expected income if this is payday
            if d == expected_income_day and expected_income_amount > 0:
                projected_balance += expected_income_amount

            timeline.append({
                "date": dt.strftime("%b %d"),
                "balance": round(projected_balance, 2),
                "is_projected": True,
                "label": "Projected Balance"
            })

        return timeline
