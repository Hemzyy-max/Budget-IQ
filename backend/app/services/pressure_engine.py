import calendar
from datetime import date, datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.recurring_expense import RecurringExpense
from app.models.budget import Budget
from app.services.analytics_engine import AnalyticsEngine

class PressureEngine:
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

    def calculate_pressure(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Dynamically calculates the Financial Pressure Score (0-100),
        the timeline progression, and contributing factors.
        """
        if df is None:
            df = self.analytics._get_transactions_df()

        current_balance = float(self.user.current_balance)
        monthly_income = max(1000.0, float(self.user.monthly_income))
        expected_income_day = self.user.expected_income_date or 1

        # 1. Days remaining until next income
        if self.today.day <= expected_income_day:
            days_to_income = expected_income_day - self.today.day
        else:
            # Income in next month
            days_to_income = (self.days_in_month - self.today.day) + expected_income_day

        # 2. Daily spending and velocity
        velocity_data = self.analytics.get_spending_velocity(df)
        current_daily = velocity_data["current_daily_spending"]
        hist_daily = velocity_data["historical_daily_spending"]
        diff_pct = velocity_data["percentage_difference"]

        effective_daily = current_daily if current_daily > 0 else (monthly_income * 0.7) / 30.0

        # 3. Upcoming recurring expenses due before next income
        target_income_date = self.today + timedelta(days=days_to_income)
        upcoming_recurrings = (
            self.db.query(RecurringExpense)
            .filter(
                RecurringExpense.user_id == self.user.id,
                RecurringExpense.next_due_date >= self.today,
                RecurringExpense.next_due_date <= target_income_date
            )
            .all()
        )
        upcoming_recurring_sum = sum(float(r.amount) for r in upcoming_recurrings)

        # 4. Projected remaining spending before next income
        projected_spend_before_income = effective_daily * days_to_income
        projected_balance_at_income = (
            current_balance
            - projected_spend_before_income
            - upcoming_recurring_sum
        )

        # 5. Core score calculation (Explainable Weighted System)
        # Factor A: Buffer Adequacy Score (0 to 50 points)
        # Target safe buffer is at least 15% of monthly income or ₹5,000
        safe_buffer = max(5000.0, monthly_income * 0.15)
        if projected_balance_at_income <= 0:
            buffer_pressure = 50.0
        elif projected_balance_at_income < safe_buffer:
            # Scale from 30 to 50
            ratio = projected_balance_at_income / safe_buffer
            buffer_pressure = 30.0 + (1.0 - ratio) * 20.0
        elif projected_balance_at_income < (monthly_income * 0.4):
            # Scale from 15 to 30
            ratio = (projected_balance_at_income - safe_buffer) / (monthly_income * 0.25)
            buffer_pressure = 15.0 + (1.0 - min(1.0, ratio)) * 15.0
        else:
            # Ample buffer: 0 to 15 points
            buffer_pressure = max(0.0, 15.0 - (projected_balance_at_income / monthly_income) * 10.0)

        # Factor B: Spending Velocity Score (0 to 25 points)
        # diff_pct: 0% diff -> 10 pts, +30% diff -> 20 pts, +50%+ -> 25 pts, -20% -> 3 pts
        if diff_pct > 0:
            velocity_pressure = min(25.0, 10.0 + (diff_pct / 50.0) * 15.0)
        else:
            velocity_pressure = max(2.0, 10.0 - (abs(diff_pct) / 40.0) * 8.0)

        # Factor C: Recurring Expense Burden (0 to 15 points)
        # Upcoming recurring compared to current balance
        if current_balance > 0:
            recur_ratio = upcoming_recurring_sum / current_balance
            recurring_pressure = min(15.0, recur_ratio * 30.0)
        else:
            recurring_pressure = 15.0

        # Factor D: Budget Utilization (0 to 10 points)
        budget_utilization = self.analytics.get_budget_utilization()
        budget_pressure = 0.0
        if budget_utilization:
            exceeded_count = sum(1 for b in budget_utilization if b["is_exceeded"])
            warning_count = sum(1 for b in budget_utilization if b["is_warning"])
            budget_pressure = min(10.0, (exceeded_count * 5.0) + (warning_count * 2.5))

        raw_score = buffer_pressure + velocity_pressure + recurring_pressure + budget_pressure
        final_score = int(max(5, min(95, round(raw_score))))

        # 6. Pressure Level Mapping
        if final_score <= 20:
            level = "Very Low Pressure"
            headline = "Comfortable & Resilient"
            trend = "improving"
        elif final_score <= 40:
            level = "Low Pressure"
            headline = "Stable Financial Position"
            trend = "stable"
        elif final_score <= 60:
            level = "Moderate Pressure"
            headline = "Manageable with Moderate Strain"
            trend = "increasing" if diff_pct > 10 else "stable"
        elif final_score <= 80:
            level = "High Pressure"
            headline = "Heightened Financial Strain"
            trend = "increasing"
        else:
            level = "Critical Pressure"
            headline = "Immediate Attention Required"
            trend = "increasing"

        # 7. Contributing Factors Generation
        factors = []
        # Category trend factor
        category_trends = self.analytics.get_category_trends(df)
        high_growth_cats = [c for c in category_trends if c["percentage_change"] >= 15.0 and c["current_month_spending"] > 500]
        if high_growth_cats:
            top_cat = high_growth_cats[0]
            factors.append(f"{top_cat['category']} spending is {round(top_cat['percentage_change'])}% above your normal average")

        if upcoming_recurring_sum > 0:
            factors.append(f"₹{round(upcoming_recurring_sum):,} in upcoming recurring expenses due before next income")

        if diff_pct > 10.0:
            factors.append(f"Daily spending rate is {round(diff_pct)}% faster than your historical baseline")
        elif diff_pct < -10.0:
            factors.append(f"Daily spending is {abs(round(diff_pct))}% below your historical baseline (positive buffer)")

        factors.append(f"Next income expected in {days_to_income} day{'s' if days_to_income != 1 else ''}")

        if any(b["is_exceeded"] for b in budget_utilization):
            exceeded_names = [b["category"] for b in budget_utilization if b["is_exceeded"]]
            factors.append(f"Exceeded monthly budget in: {', '.join(exceeded_names)}")

        # 8. Pressure Timeline Generation & Days Until Pressure Increases
        timeline, days_until_pressure = self._generate_pressure_timeline(
            current_balance=current_balance,
            daily_spending=effective_daily,
            upcoming_recurrings=upcoming_recurrings,
            days_to_income=days_to_income,
            safe_buffer=safe_buffer
        )

        # Dynamic explanation
        if diff_pct > 15:
            explanation = f"Your spending rate is {round(diff_pct)}% above your normal pattern, drawing down your buffer ahead of payday."
        elif final_score > 60:
            explanation = f"Projected balance approaches your safety margin before your next expected income in {days_to_income} days."
        else:
            explanation = "Your spending rate is healthy and your projected cash buffer remains sufficient through your next income cycle."

        return {
            "score": final_score,
            "level": level,
            "trend": trend,
            "days_until_pressure": days_until_pressure,
            "headline": headline,
            "explanation": explanation,
            "factors": factors[:4],
            "timeline": timeline
        }

    def _generate_pressure_timeline(
        self,
        current_balance: float,
        daily_spending: float,
        upcoming_recurrings: List[RecurringExpense],
        days_to_income: int,
        safe_buffer: float
    ) -> (List[Dict[str, Any]], Optional[int]):
        """
        Projects daily balance for the next 14 days and detects
        the first future date when the projected buffer crosses below threshold.
        """
        recurring_map = {}
        for r in upcoming_recurrings:
            delta_days = (r.next_due_date - self.today).days
            if 0 <= delta_days <= 14:
                recurring_map[delta_days] = recurring_map.get(delta_days, 0.0) + float(r.amount)

        timeline = []
        days_until_pressure = None
        running_bal = current_balance

        # We'll sample key milestones: Day 0 (Today), Day 3/4, Day 7/8, Day 11/12, Day of Income
        checkpoints = [0, 4, 8, 12]
        if days_to_income not in checkpoints and days_to_income <= 14:
            checkpoints.append(days_to_income)
        checkpoints = sorted(list(set([c for c in checkpoints if c <= max(14, days_to_income)])))

        # Simulate day-by-day
        for day in range(0, max(checkpoints) + 1):
            if day > 0:
                running_bal -= daily_spending
                if day in recurring_map:
                    running_bal -= recurring_map[day]
                if day == days_to_income:
                    running_bal += float(self.user.monthly_income)

            # Detect first day of strain
            if days_until_pressure is None and day > 0:
                if running_bal < safe_buffer:
                    days_until_pressure = day

            if day in checkpoints:
                dt = self.today + timedelta(days=day)
                if day == 0:
                    status = "Normal" if running_bal > safe_buffer else "Caution"
                    label = "Today"
                elif day == days_to_income:
                    status = "Income Expected"
                    label = f"Day {day} (Payday)"
                elif running_bal < 0:
                    status = "Critical"
                    label = f"Day {day}"
                elif running_bal < safe_buffer:
                    status = "Pressure Increasing"
                    label = f"Day {day}"
                else:
                    status = "Stable"
                    label = f"Day {day}"

                timeline.append({
                    "day_label": label,
                    "days_from_now": day,
                    "date": dt.strftime("%b %d"),
                    "status": status,
                    "projected_buffer": round(running_bal, 2)
                })

        return timeline, days_until_pressure
