from typing import List, Dict, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.analytics_engine import AnalyticsEngine
from app.services.pressure_engine import PressureEngine
from app.services.forecasting_engine import ForecastingEngine

class InsightEngine:
    def __init__(
        self,
        db: Session,
        user: User,
        analytics: Optional[AnalyticsEngine] = None,
        pressure: Optional[PressureEngine] = None,
        forecasting: Optional[ForecastingEngine] = None
    ):
        self.db = db
        self.user = user
        self.analytics = analytics or AnalyticsEngine(db, user)
        self.pressure = pressure or PressureEngine(db, user, self.analytics)
        self.forecasting = forecasting or ForecastingEngine(db, user, self.analytics)

    def generate_insights(self, df: Optional[pd.DataFrame] = None) -> List[Dict[str, Any]]:
        """Generates explainable, actionable financial insights without an LLM."""
        if df is None:
            df = self.analytics._get_transactions_df()

        insights = []

        # 1. Category Trends Analysis
        category_trends = self.analytics.get_category_trends(df)
        for trend in category_trends:
            pct = trend["percentage_change"]
            cat = trend["category"]
            cur = trend["current_month_spending"]
            hist = trend["historical_average"]

            if pct >= 25.0 and cur >= 800:
                diff_amt = cur - hist
                weekly_rec = max(100, round(diff_amt / 4))
                insights.append({
                    "id": f"surge_{cat.lower()}",
                    "insight_type": "spending",
                    "title": f"{cat.upper()} SPENDING SURGE",
                    "what_happened": f"{cat} spending is {round(pct)}% above your usual monthly average (₹{round(cur):,} vs ₹{round(hist):,}).",
                    "why_it_matters": f"This category alone accounts for an extra ₹{round(diff_amt):,} in spending this month, accelerating your daily burn rate.",
                    "what_you_can_do": f"Trimming {cat.lower()} expenses by approximately ₹{weekly_rec:,}/week will help stabilize your month-end projection.",
                    "severity": "warning" if pct < 50 else "critical"
                })
                break  # Pick the most significant surge

            elif pct <= -20.0 and hist >= 1000:
                savings_amt = hist - cur
                insights.append({
                    "id": f"saving_{cat.lower()}",
                    "insight_type": "positive",
                    "title": f"{cat.upper()} SPENDING CURTAILED",
                    "what_happened": f"You spent {abs(round(pct))}% less on {cat} this month compared to your usual average.",
                    "why_it_matters": f"You preserved ₹{round(savings_amt):,} that would normally have been spent in this category.",
                    "what_you_can_do": "Consider routing this unspent amount directly into your emergency buffer or savings goals.",
                    "severity": "positive"
                })
                break

        # 2. Spending Velocity Insight
        velocity_data = self.analytics.get_spending_velocity(df)
        cur_daily = velocity_data["current_daily_spending"]
        hist_daily = velocity_data["historical_daily_spending"]
        diff_pct = velocity_data["percentage_difference"]

        if diff_pct >= 20.0 and cur_daily > 200:
            diff_daily = cur_daily - hist_daily
            target_cut = round(diff_daily * 0.7)
            insights.append({
                "id": "velocity_high",
                "insight_type": "spending",
                "title": "ELEVATED SPENDING VELOCITY",
                "what_happened": f"You're spending ₹{round(cur_daily):,}/day, which is ₹{round(diff_daily):,}/day faster than your usual pace (₹{round(hist_daily):,}/day).",
                "why_it_matters": "Sustained high velocity quickly depletes discretionary reserves before scheduled income arrives.",
                "what_you_can_do": f"Reducing discretionary purchases by ₹{target_cut:,}/day over the next 10 days will bring velocity back to baseline.",
                "severity": "warning"
            })
        elif diff_pct <= -15.0 and hist_daily > 200:
            insights.append({
                "id": "velocity_low",
                "insight_type": "positive",
                "title": "DISCIPLINED SPENDING PACE",
                "what_happened": f"Your daily expenditure rate (₹{round(cur_daily):,}/day) is {abs(round(diff_pct))}% below your historical average.",
                "why_it_matters": "You are building stronger liquid cushions ahead of upcoming commitments.",
                "what_you_can_do": "Keep this rhythm going to boost your month-end surplus.",
                "severity": "positive"
            })

        # 3. Financial Pressure & Timeline Warning
        pressure_data = self.pressure.calculate_pressure(df)
        score = pressure_data["score"]
        days_until = pressure_data.get("days_until_pressure")

        if days_until is not None and days_until <= 10:
            insights.append({
                "id": "pressure_timeline",
                "insight_type": "pressure",
                "title": "TIMELINE PRESSURE FORECAST",
                "what_happened": f"Financial pressure may increase in {days_until} days based on your current run-rate and upcoming obligations.",
                "why_it_matters": f"Your projected balance is expected to decline below your comfort buffer threshold around Day {days_until}.",
                "what_you_can_do": "Postpone major non-essential outlays until your next salary credit to avoid cash-flow tightness.",
                "severity": "critical" if days_until <= 5 else "warning"
            })
        elif score >= 65:
            insights.append({
                "id": "pressure_high",
                "insight_type": "pressure",
                "title": "HIGH FINANCIAL PRESSURE DETECTED",
                "what_happened": f"Your Financial Pressure Score is {score}/100, indicating tightening liquidity.",
                "why_it_matters": "Fixed commitments combined with recent spending leave a slimmer margin for unexpected expenses.",
                "what_you_can_do": "Review upcoming scheduled bills and cap daily discretionary spending.",
                "severity": "critical"
            })

        # 4. Upcoming Recurring Expenses Warning
        upcoming = self.analytics.get_upcoming_recurring_expenses(days_ahead=7)
        if upcoming:
            total_due_soon = sum(u["amount"] for u in upcoming)
            names = [u["name"] for u in upcoming]
            insights.append({
                "id": "upcoming_recurring",
                "insight_type": "recurring",
                "title": "RECURRING EXPENSES DUE SOON",
                "what_happened": f"₹{round(total_due_soon):,} in recurring commitments ({', '.join(names)}) are scheduled within 7 days.",
                "why_it_matters": "Automated debits without sufficient balance can trigger failed payment fees or bank charges.",
                "what_you_can_do": f"Ensure a minimum balance of ₹{round(total_due_soon * 1.1):,} remains untouched in your linked account.",
                "severity": "info" if total_due_soon < (self.user.current_balance * 0.3) else "warning"
            })

        # 5. Budget Utilization Warnings
        budgets = self.analytics.get_budget_utilization()
        for b in budgets:
            if b["is_exceeded"]:
                insights.append({
                    "id": f"budget_exceeded_{b['category'].lower()}",
                    "insight_type": "budget",
                    "title": f"{b['category'].upper()} BUDGET EXCEEDED",
                    "what_happened": f"You exceeded your {b['category']} monthly budget by ₹{round(abs(b['remaining_amount'])):,}.",
                    "why_it_matters": "Budget overruns in discretionary categories reduce available savings for other priorities.",
                    "what_you_can_do": f"Reallocate ₹{round(abs(b['remaining_amount'])):,} from an under-utilized category or freeze further spending in this category.",
                    "severity": "warning"
                })
                break
            elif b["is_warning"]:
                insights.append({
                    "id": f"budget_warning_{b['category'].lower()}",
                    "insight_type": "budget",
                    "title": f"{b['category'].upper()} BUDGET NEARING LIMIT",
                    "what_happened": f"You have utilized {round(b['percentage_used'])}% of your {b['category']} budget with ₹{round(b['remaining_amount']):,} left.",
                    "why_it_matters": "With days still remaining in the month, at current pace this category will overrun.",
                    "what_you_can_do": f"Limit spending to ₹{max(50, round(b['remaining_amount'] / max(1, self.analytics.days_remaining)))}/day in this category.",
                    "severity": "info"
                })
                break

        # If no insights generated yet (e.g. empty account), add an onboarding insight
        if not insights:
            insights.append({
                "id": "welcome_insight",
                "insight_type": "positive",
                "title": "FINANCIAL TRACKING ACTIVE",
                "what_happened": "Budget IQ has initialized your financial intelligence engine.",
                "why_it_matters": "As you log transactions, Budget IQ learns your spending baseline to predict pressure.",
                "what_you_can_do": "Log your daily transactions or load realistic demo data to explore full predictive features.",
                "severity": "info"
            })

        return insights
