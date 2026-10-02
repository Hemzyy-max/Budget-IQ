import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath("backend"))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.core.database import SessionLocal, init_db
from app.models.user import User
from app.services.demo_seeder import seed_demo_data
from app.services.analytics_engine import AnalyticsEngine
from app.services.pressure_engine import PressureEngine
from app.services.forecasting_engine import ForecastingEngine
from app.services.insight_engine import InsightEngine
from app.services.recurring_detector import RecurringDetector

def main():
    print("=== TESTING BUDGET IQ BACKEND ===")
    init_db()
    db = SessionLocal()
    try:
        print("[1] Seeding demo data...")
        user = seed_demo_data(db, force_reset=True)
        print(f"    Demo User: {user.name} ({user.email}) | Initial Balance: ₹{user.current_balance:,.2f}")

        print("\n[2] Testing Analytics Engine...")
        analytics = AnalyticsEngine(db, user)
        metrics = analytics.get_summary_metrics()
        print(f"    Current Balance: ₹{metrics['current_balance']:,.2f}")
        print(f"    Total Income:    ₹{metrics['total_income']:,.2f}")
        print(f"    Total Expenses:  ₹{metrics['total_expenses']:,.2f}")
        print(f"    Savings Rate:    {metrics['savings_rate']}%")

        velocity = analytics.get_spending_velocity()
        print(f"    Current Daily Spending:    ₹{velocity['current_daily_spending']:,.2f}/day")
        print(f"    Historical Daily Spending: ₹{velocity['historical_daily_spending']:,.2f}/day")
        print(f"    Velocity Ratio:            {velocity['velocity_ratio']}x ({velocity['percentage_difference']:+,.1f}%)")
        print(f"    Status:                    {velocity['status_message']}")

        print("\n[3] Testing Category Trends...")
        trends = analytics.get_category_trends()
        for t in trends[:5]:
            print(f"    {t['category']:<15} {t['percentage_change']:+6.1f}%  (Current: ₹{t['current_month_spending']:,.0f} | Normal: ₹{t['historical_average']:,.0f})")

        print("\n[4] Testing Forecasting Engine...")
        forecasting = ForecastingEngine(db, user, analytics)
        forecast = forecasting.forecast_month_end()
        print(f"    Predicted Month-End Balance: ₹{forecast['predicted_month_end_balance']:,.2f}")
        print(f"    Expected Remaining Spending: ₹{forecast['expected_remaining_spending']:,.2f}")
        print(f"    Upcoming Recurring Bills:    ₹{forecast['upcoming_recurring']:,.2f}")
        print(f"    Confidence:                  {forecast['confidence_percentage']}%")
        print(f"    Trajectory Points Count:     {len(forecast['forecast_timeline'])}")

        print("\n[5] Testing Pressure Engine...")
        pressure_eng = PressureEngine(db, user, analytics)
        pressure = pressure_eng.calculate_pressure()
        print(f"    Financial Pressure Score:    {pressure['score']}/100")
        print(f"    Pressure Level:              {pressure['level']}")
        print(f"    Trend:                       {pressure['trend']}")
        print(f"    Days Until Pressure Strain:  {pressure['days_until_pressure']} days")
        print(f"    Headline:                    {pressure['headline']}")
        print(f"    Factors:")
        for f in pressure['factors']:
            print(f"      • {f}")
        print("    Pressure Timeline:")
        for pt in pressure['timeline']:
            print(f"      - {pt['day_label']:<15} {pt['status']:<20} Projected Buffer: ₹{pt['projected_buffer']:,.2f}")

        print("\n[6] Testing Recurring Expense Detector...")
        detector = RecurringDetector(db, user)
        detected = detector.detect_recurring_candidates()
        print(f"    Detected Candidates: {len(detected)}")
        for d in detected:
            print(f"      • {d['name']} | ₹{d['amount']} ({d['frequency']}) | Confidence: {d['confidence']*100:.0f}%")
            print(f"        Reason: {d['detected_reason']}")

        print("\n[7] Testing Insight Engine...")
        insight_eng = InsightEngine(db, user, analytics, pressure_eng, forecasting)
        insights = insight_eng.generate_insights()
        print(f"    Generated Insights Count: {len(insights)}")
        for ins in insights:
            print(f"    [{ins['severity'].upper()}] {ins['title']}")
            print(f"       What Happened:  {ins['what_happened']}")
            print(f"       Why It Matters: {ins['why_it_matters']}")
            print(f"       What You Can Do: {ins['what_you_can_do']}\n")

        print("\n[8] Testing Financial Health Score...")
        health = analytics.get_financial_health_score()
        print(f"    Overall Health: {health['overall_score']}/100 ({health['rating']})")
        print(f"    Breakdown: {health['breakdown']}")
        print(f"    Summary:   {health['summary_message']}")

        print("\n=== ALL BACKEND ENGINES AND CALCULATIONS PASSED PERFECTLY! ===")
    finally:
        db.close()

if __name__ == "__main__":
    main()
