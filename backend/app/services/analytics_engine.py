import calendar
from datetime import date, datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.recurring_expense import RecurringExpense

class AnalyticsEngine:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.today = date.today()
        self.current_year = self.today.year
        self.current_month = self.today.month
        self.days_in_current_month = calendar.monthrange(self.current_year, self.current_month)[1]
        self.days_elapsed = max(1, self.today.day)
        self.days_remaining = max(0, self.days_in_current_month - self.days_elapsed)

    def _get_transactions_df(self) -> pd.DataFrame:
        """Loads user transactions into a pandas DataFrame."""
        transactions = (
            self.db.query(Transaction)
            .filter(Transaction.user_id == self.user.id)
            .order_by(Transaction.transaction_date.asc())
            .all()
        )
        if not transactions:
            return pd.DataFrame(columns=[
                "id", "amount", "transaction_type", "category",
                "description", "payment_method", "transaction_date", "is_recurring"
            ])

        data = [{
            "id": t.id,
            "amount": float(t.amount),
            "transaction_type": t.transaction_type.lower(),
            "category": t.category,
            "description": t.description or "",
            "payment_method": t.payment_method,
            "transaction_date": pd.to_datetime(t.transaction_date),
            "is_recurring": t.is_recurring
        } for t in transactions]
        df = pd.DataFrame(data)
        df["month"] = df["transaction_date"].dt.month
        df["year"] = df["transaction_date"].dt.year
        return df

    def get_summary_metrics(self, df: Optional[pd.DataFrame] = None) -> Dict[str, float]:
        """Calculates current month income, expenses, savings and balance."""
        if df is None:
            df = self._get_transactions_df()

        if df.empty:
            return {
                "current_balance": float(self.user.current_balance),
                "total_income": float(self.user.monthly_income),
                "total_expenses": 0.0,
                "savings": float(self.user.monthly_income),
                "savings_rate": 100.0 if self.user.monthly_income > 0 else 0.0
            }

        # Current month transactions
        cur_mask = (df["year"] == self.current_year) & (df["month"] == self.current_month)
        cur_df = df[cur_mask]

        income_tx = cur_df[cur_df["transaction_type"] == "income"]["amount"].sum()
        expense_tx = cur_df[cur_df["transaction_type"] == "expense"]["amount"].sum()

        # If user has a defined monthly_income and no explicit salary transaction logged yet this month,
        # count the monthly_income as expected income.
        total_income = float(income_tx) if income_tx > 0 else float(self.user.monthly_income)
        total_expenses = float(expense_tx)
        savings = max(0.0, total_income - total_expenses)
        savings_rate = (savings / total_income * 100.0) if total_income > 0 else 0.0

        return {
            "current_balance": float(self.user.current_balance),
            "total_income": total_income,
            "total_expenses": total_expenses,
            "savings": savings,
            "savings_rate": round(savings_rate, 1)
        }

    def get_spending_velocity(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Calculates:
        - daily_spending = current_month_expenses / days_elapsed
        - historical_daily_spending = historical_expenses / historical_days
        - spending_velocity = daily_spending / historical_daily_spending
        """
        if df is None:
            df = self._get_transactions_df()

        if df.empty:
            return {
                "current_daily_spending": 0.0,
                "historical_daily_spending": 0.0,
                "velocity_ratio": 1.0,
                "percentage_difference": 0.0,
                "is_higher": False,
                "status_message": "No transaction history available yet."
            }

        expense_df = df[df["transaction_type"] == "expense"]

        # Current month spending
        cur_mask = (expense_df["year"] == self.current_year) & (expense_df["month"] == self.current_month)
        cur_expenses = expense_df[cur_mask]["amount"].sum()
        daily_spending = cur_expenses / self.days_elapsed

        # Historical spending (prior to this month, or past 90 days)
        hist_mask = ~cur_mask
        hist_df = expense_df[hist_mask]

        if not hist_df.empty:
            min_date = hist_df["transaction_date"].min()
            max_date = hist_df["transaction_date"].max()
            hist_days = max(1, (max_date - min_date).days + 1)
            historical_daily_spending = hist_df["amount"].sum() / hist_days
        else:
            # Fallback baseline: expected monthly spending from user profile or current rate
            historical_daily_spending = max(100.0, (self.user.monthly_income * 0.7) / 30.0)

        if historical_daily_spending > 0:
            velocity_ratio = daily_spending / historical_daily_spending
            diff_pct = ((daily_spending - historical_daily_spending) / historical_daily_spending) * 100.0
        else:
            velocity_ratio = 1.0
            diff_pct = 0.0

        is_higher = diff_pct > 5.0
        if diff_pct > 20.0:
            status_msg = f"You are spending {abs(round(diff_pct))}% faster than your usual pattern."
        elif diff_pct < -15.0:
            status_msg = f"You are spending {abs(round(diff_pct))}% slower than your usual pattern."
        else:
            status_msg = "Your daily spending is in line with your normal baseline."

        return {
            "current_daily_spending": round(daily_spending, 2),
            "historical_daily_spending": round(historical_daily_spending, 2),
            "velocity_ratio": round(velocity_ratio, 2),
            "percentage_difference": round(diff_pct, 1),
            "is_higher": is_higher,
            "status_message": status_msg
        }

    def get_category_breakdown(self, df: Optional[pd.DataFrame] = None) -> List[Dict[str, Any]]:
        """Returns category breakdown for current month."""
        if df is None:
            df = self._get_transactions_df()

        if df.empty:
            return []

        cur_mask = (df["year"] == self.current_year) & (df["month"] == self.current_month) & (df["transaction_type"] == "expense")
        cur_expenses = df[cur_mask]

        if cur_expenses.empty:
            return []

        cat_summary = cur_expenses.groupby("category")["amount"].sum().reset_index()
        total = cat_summary["amount"].sum()

        results = []
        for _, row in cat_summary.sort_values(by="amount", ascending=False).iterrows():
            amt = float(row["amount"])
            pct = (amt / total * 100.0) if total > 0 else 0.0
            results.append({
                "category": row["category"],
                "amount": round(amt, 2),
                "percentage": round(pct, 1)
            })
        return results

    def get_category_trends(self, df: Optional[pd.DataFrame] = None) -> List[Dict[str, Any]]:
        """
        Compares current month category spending with historical monthly average.
        Generates percentage changes like: Food +32%, Transport -14%.
        """
        if df is None:
            df = self._get_transactions_df()

        if df.empty:
            return []

        expense_df = df[df["transaction_type"] == "expense"]
        cur_mask = (expense_df["year"] == self.current_year) & (expense_df["month"] == self.current_month)
        cur_df = expense_df[cur_mask]
        hist_df = expense_df[~cur_mask]

        cur_by_cat = cur_df.groupby("category")["amount"].sum().to_dict()

        # Calculate historical monthly average per category
        if not hist_df.empty:
            # Group by year, month, category
            monthly_cat = hist_df.groupby(["year", "month", "category"])["amount"].sum().reset_index()
            hist_avg_by_cat = monthly_cat.groupby("category")["amount"].mean().to_dict()
        else:
            hist_avg_by_cat = {}

        trends = []
        all_categories = set(cur_by_cat.keys()) | set(hist_avg_by_cat.keys())

        for cat in sorted(all_categories):
            cur_amt = float(cur_by_cat.get(cat, 0.0))
            hist_avg = float(hist_avg_by_cat.get(cat, cur_amt))

            if hist_avg > 0:
                pct_change = ((cur_amt - hist_avg) / hist_avg) * 100.0
            else:
                pct_change = 0.0

            is_inc = pct_change > 0

            if pct_change >= 20.0:
                insight = f"{cat} spending is {round(pct_change)}% above your usual monthly average."
            elif pct_change <= -15.0:
                insight = f"{cat} spending decreased by {abs(round(pct_change))}% compared to past months."
            else:
                insight = f"{cat} spending is stable and aligned with past patterns."

            trends.append({
                "category": cat,
                "current_month_spending": round(cur_amt, 2),
                "historical_average": round(hist_avg, 2),
                "percentage_change": round(pct_change, 1),
                "is_increasing": is_inc,
                "insight_text": insight
            })

        # Sort with most significant changes first
        trends.sort(key=lambda x: abs(x["percentage_change"]), reverse=True)
        return trends

    def get_upcoming_recurring_expenses(self, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """Returns scheduled recurring expenses due within days_ahead."""
        recurrings = (
            self.db.query(RecurringExpense)
            .filter(RecurringExpense.user_id == self.user.id)
            .order_by(RecurringExpense.next_due_date.asc())
            .all()
        )
        results = []
        cutoff = self.today + timedelta(days=days_ahead)

        for r in recurrings:
            days_left = (r.next_due_date - self.today).days
            if 0 <= days_left <= days_ahead:
                results.append({
                    "id": r.id,
                    "name": r.name,
                    "amount": float(r.amount),
                    "category": r.category,
                    "next_due_date": r.next_due_date.isoformat(),
                    "days_remaining": days_left,
                    "is_due_soon": days_left <= 5
                })
        return results

    def get_budget_utilization(self) -> List[Dict[str, Any]]:
        """Returns budget performance and alerts for each category."""
        budgets = (
            self.db.query(Budget)
            .filter(
                Budget.user_id == self.user.id,
                Budget.month == self.current_month,
                Budget.year == self.current_year
            )
            .all()
        )
        if not budgets:
            return []

        df = self._get_transactions_df()
        cur_mask = (df["year"] == self.current_year) & (df["month"] == self.current_month) & (df["transaction_type"] == "expense")
        spent_by_cat = df[cur_mask].groupby("category")["amount"].sum().to_dict() if not df.empty else {}

        results = []
        for b in budgets:
            spent = float(spent_by_cat.get(b.category, 0.0))
            budget_amt = float(b.budget_amount)
            pct = (spent / budget_amt * 100.0) if budget_amt > 0 else 0.0
            remaining = budget_amt - spent
            is_exceeded = spent > budget_amt
            is_warning = (pct >= 80.0) and not is_exceeded

            if is_exceeded:
                msg = f"{b.category} budget exceeded by ₹{round(abs(remaining)):,}."
            elif is_warning:
                msg = f"Approaching {b.category} budget limit ({round(pct)}% used)."
            else:
                msg = f"₹{round(remaining):,} remaining in {b.category}."

            results.append({
                "id": b.id,
                "category": b.category,
                "budget_amount": budget_amt,
                "spent_amount": round(spent, 2),
                "remaining_amount": round(remaining, 2),
                "percentage_used": round(pct, 1),
                "is_exceeded": is_exceeded,
                "is_warning": is_warning,
                "status_message": msg
            })
        return results

    def get_financial_health_score(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Calculates the Financial Health Score (0-100) across 5 pillars:
        - Spending Discipline
        - Savings Rate
        - Budget Control
        - Emergency Buffer
        - Recurring Expense Load
        """
        if df is None:
            df = self._get_transactions_df()

        metrics = self.get_summary_metrics(df)
        velocity = self.get_spending_velocity(df)
        budgets = self.get_budget_utilization()
        recurrings = (
            self.db.query(RecurringExpense)
            .filter(RecurringExpense.user_id == self.user.id)
            .all()
        )

        monthly_income = max(1000.0, float(self.user.monthly_income))
        current_balance = float(self.user.current_balance)

        # 1. Savings Rate Score (0 - 100)
        # 30%+ savings = 95-100, 20% = 80, 10% = 60, 0% = 30
        savings_rate = metrics["savings_rate"]
        savings_score = int(min(100, max(20, (savings_rate / 30.0) * 85.0 + 15.0)))

        # 2. Spending Discipline Score (0 - 100)
        # Based on spending velocity diff: lower diff / slower = higher discipline
        diff_pct = velocity["percentage_difference"]
        if diff_pct <= 0:
            discipline_score = int(min(100, 80 + abs(diff_pct) * 0.5))
        else:
            discipline_score = int(max(20, 80 - (diff_pct * 0.9)))

        # 3. Budget Control Score (0 - 100)
        if budgets:
            exceeded = sum(1 for b in budgets if b["is_exceeded"])
            warnings = sum(1 for b in budgets if b["is_warning"])
            control_score = int(max(25, 95 - (exceeded * 25) - (warnings * 10)))
        else:
            control_score = 70  # Neutral baseline if no budgets set

        # 4. Emergency Buffer Score (0 - 100)
        # Ratio of current balance to monthly income
        buffer_ratio = current_balance / monthly_income
        if buffer_ratio >= 3.0:
            buffer_score = 95
        elif buffer_ratio >= 1.0:
            buffer_score = int(65 + (buffer_ratio - 1.0) * 15)
        elif buffer_ratio >= 0.3:
            buffer_score = int(40 + (buffer_ratio - 0.3) * 35)
        else:
            buffer_score = int(max(15, buffer_ratio * 100))

        # 5. Recurring Expense Load Score (0 - 100)
        # Lower recurring burden relative to income = higher score
        total_monthly_recurring = 0.0
        for r in recurrings:
            freq = r.frequency.lower()
            if freq == "weekly":
                total_monthly_recurring += float(r.amount) * 4.33
            elif freq == "quarterly":
                total_monthly_recurring += float(r.amount) / 3.0
            elif freq == "yearly":
                total_monthly_recurring += float(r.amount) / 12.0
            else:
                total_monthly_recurring += float(r.amount)

        recur_burden_ratio = total_monthly_recurring / monthly_income
        if recur_burden_ratio <= 0.15:
            recurring_score = 90
        elif recur_burden_ratio <= 0.30:
            recurring_score = int(90 - ((recur_burden_ratio - 0.15) / 0.15) * 25)
        elif recur_burden_ratio <= 0.50:
            recurring_score = int(65 - ((recur_burden_ratio - 0.30) / 0.20) * 30)
        else:
            recurring_score = max(20, int(35 - (recur_burden_ratio - 0.50) * 30))

        # Overall Weighted Score
        overall = int(round(
            (savings_score * 0.25) +
            (discipline_score * 0.25) +
            (buffer_score * 0.20) +
            (control_score * 0.15) +
            (recurring_score * 0.15)
        ))
        overall = max(10, min(98, overall))

        if overall >= 80:
            rating = "Strong"
            summary = "Excellent — your financial discipline and buffers are solid."
        elif overall >= 65:
            rating = "Good"
            summary = "Good — but there is room to improve your spending consistency."
        elif overall >= 50:
            rating = "Moderate"
            summary = "Moderate — spending velocity and recurring burdens require conscious pacing."
        else:
            rating = "Strained"
            summary = "Strained — focus on building liquid reserves and trimming discretionary velocity."

        return {
            "overall_score": overall,
            "rating": rating,
            "summary_message": summary,
            "breakdown": {
                "spending_discipline": discipline_score,
                "savings_rate": savings_score,
                "budget_control": control_score,
                "emergency_buffer": buffer_score,
                "recurring_expense_load": recurring_score
            }
        }

    def get_budget_streak(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Calculates the user's budget streak — consecutive days where daily
        spending stayed within the daily budget threshold.
        
        Daily budget = monthly_income / days_in_month
        A day counts as 'on-budget' if total expense spending <= daily_budget * 1.1
        (10% tolerance to avoid frustration from tiny overages).
        """
        if df is None:
            df = self._get_transactions_df()

        monthly_income = float(self.user.monthly_income or 0)
        if monthly_income <= 0:
            return {
                "current_streak": 0,
                "best_streak": 0,
                "daily_budget": 0,
                "streak_message": "Set your monthly income to start tracking your budget streak!",
                "streak_status": "inactive",
            }

        daily_budget = monthly_income / self.days_in_current_month

        # Get expenses only
        expenses = df[df["transaction_type"] == "expense"].copy() if not df.empty else pd.DataFrame()

        # Calculate daily spending for last 90 days
        start_date = pd.Timestamp(self.today - timedelta(days=90))
        if not expenses.empty:
            recent_expenses = expenses[expenses["transaction_date"] >= start_date].copy()
            daily_spend = recent_expenses.groupby(
                recent_expenses["transaction_date"].dt.date
            )["amount"].sum()
        else:
            daily_spend = pd.Series(dtype=float)

        # Walk backwards from yesterday to count current streak
        current_streak = 0
        check_date = self.today - timedelta(days=1)
        threshold = daily_budget * 1.1  # 10% tolerance

        while check_date >= (self.today - timedelta(days=90)):
            day_total = daily_spend.get(check_date, 0)
            if day_total <= threshold:
                current_streak += 1
            else:
                break
            check_date -= timedelta(days=1)

        # Calculate best streak over the 90-day window
        best_streak = 0
        temp_streak = 0
        for d in range(90):
            check = self.today - timedelta(days=d + 1)
            day_total = daily_spend.get(check, 0)
            if day_total <= threshold:
                temp_streak += 1
                best_streak = max(best_streak, temp_streak)
            else:
                temp_streak = 0

        # Generate motivational message
        if current_streak >= 30:
            message = f"🏆 Incredible! {current_streak}-day streak — you're a financial champion!"
            status = "legendary"
        elif current_streak >= 14:
            message = f"🔥 Amazing! {current_streak} days of discipline — keep it burning!"
            status = "on_fire"
        elif current_streak >= 7:
            message = f"💪 Great week! {current_streak}-day streak building strong habits."
            status = "strong"
        elif current_streak >= 3:
            message = f"✨ Nice! {current_streak}-day streak — momentum is building."
            status = "building"
        elif current_streak >= 1:
            message = f"👍 {current_streak} day on budget — every day counts!"
            status = "starting"
        else:
            message = "Start fresh today — stay within your daily budget to begin a streak!"
            status = "broken"

        return {
            "current_streak": current_streak,
            "best_streak": best_streak,
            "daily_budget": round(daily_budget, 2),
            "streak_message": message,
            "streak_status": status,
        }

