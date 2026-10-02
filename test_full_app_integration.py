import sys
import os
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def main():
    print("==================================================")
    print("      BUDGET IQ FULL-STACK API VERIFICATION       ")
    print("==================================================")

    # 1. Reset Demo Data
    print("\n[Step 1] Seeding pristine 3-month demo data...")
    status, res = make_request("/analytics/reset-demo", method="POST")
    assert status == 200, f"Demo reset failed: {res}"
    print(f"  ✓ Demo data reset: {res['email']} | Balance: ₹{res['balance']:,.2f}")

    # 2. Login as Demo User
    print("\n[Step 2] Authenticating demo user (JWT Login)...")
    status, auth_res = make_request("/auth/login", method="POST", data={
        "email": "demo@budgetiq.app",
        "password": "password123"
    })
    assert status == 200, f"Login failed: {auth_res}"
    token = auth_res["access_token"]
    user = auth_res["user"]
    print(f"  ✓ Authenticated as: {user['name']} ({user['email']})")
    print(f"  ✓ Access Token received: {token[:20]}...")

    # 3. Fetch Master Dashboard API
    print("\n[Step 3] Fetching Master Consolidated Dashboard...")
    status, dash_before = make_request("/analytics/dashboard", token=token)
    assert status == 200, f"Dashboard fetch failed: {dash_before}"
    
    bal_before = dash_before["current_balance"]
    score_before = dash_before["pressure_score"]
    pred_before = dash_before["predicted_month_end_balance"]
    vel_before = dash_before["spending_velocity"]["current_daily_spending"]

    print(f"  ✓ Current Balance:             ₹{bal_before:,.2f}")
    print(f"  ✓ Total Income:                ₹{dash_before['total_income']:,.2f}")
    print(f"  ✓ Total Expenses:              ₹{dash_before['total_expenses']:,.2f}")
    print(f"  ✓ Financial Pressure Score:    {score_before}/100 ({dash_before['pressure_level']})")
    print(f"  ✓ Predicted Month-End Balance: ₹{pred_before:,.2f} (Confidence: {dash_before['prediction_confidence']}%)")
    print(f"  ✓ Spending Velocity:           ₹{vel_before:,.2f}/day ({dash_before['spending_velocity']['percentage_difference']:+,.1f}% vs baseline)")
    print(f"  ✓ Financial Health Score:      {dash_before['financial_health']['overall_score']}/100 ({dash_before['financial_health']['rating']})")
    print(f"  ✓ Generated Insights Count:    {len(dash_before['insights'])}")

    # 4. Critical Differentiator Test (Section 31 & Section 48):
    # Add a new Food expense of ₹1,200 and verify instant dynamic recalculation!
    print("\n[Step 4] DYNAMIC FEEDBACK LOOP TEST (Section 31 & 48)")
    print("  Adding new Food expense: ₹1,200.00 ('Dinner with Team')...")
    status, tx_res = make_request("/transactions", method="POST", token=token, data={
        "amount": 1200.0,
        "transaction_type": "expense",
        "category": "Food",
        "description": "Dinner with Team",
        "payment_method": "UPI"
    })
    assert status == 201, f"Create transaction failed: {tx_res}"
    print(f"  ✓ Transaction created: ID {tx_res['id']} | Amount: ₹{tx_res['amount']:,.2f}")

    # Re-fetch dashboard to verify dynamic recalculation chain
    print("  Re-fetching Master Dashboard to observe dynamic ripple effect...")
    status, dash_after = make_request("/analytics/dashboard", token=token)
    assert status == 200
    bal_after = dash_after["current_balance"]
    score_after = dash_after["pressure_score"]
    pred_after = dash_after["predicted_month_end_balance"]
    vel_after = dash_after["spending_velocity"]["current_daily_spending"]

    print(f"\n  --- DYNAMIC RECALCULATION VERIFICATION ---")
    print(f"  Balance:      ₹{bal_before:,.2f}  ──>  ₹{bal_after:,.2f}  (Δ: ₹{bal_after - bal_before:,.2f})")
    print(f"  Velocity:     ₹{vel_before:,.2f}/day  ──>  ₹{vel_after:,.2f}/day")
    print(f"  Forecast:     ₹{pred_before:,.2f}  ──>  ₹{pred_after:,.2f}")
    print(f"  Pressure:     {score_before}/100  ──>  {score_after}/100")

    assert bal_after == bal_before - 1200.0, f"Balance did not drop by exactly 1200! Expected {bal_before - 1200}, got {bal_after}"
    assert vel_after > vel_before, "Daily spending velocity did not increase!"
    print(f"  ✓ SUCCESS: Dynamic feedback loop fully verified!")

    # 5. Budgets Verification
    print("\n[Step 5] Checking Budgets Endpoint...")
    status, budgets = make_request("/budgets", token=token)
    assert status == 200
    print(f"  ✓ Active Budgets Count: {len(budgets)}")
    for b in budgets:
        print(f"    • {b['category']:<15} Budget: ₹{b['budget_amount']:,.0f} | Spent: ₹{b['spent_amount']:,.0f} ({b['percentage_used']:.0f}%) | {b['status_message']}")

    # 6. Recurring Expenses & Pattern Detection
    print("\n[Step 6] Checking Recurring Commitments & ML/Pattern Detector...")
    status, recurrings = make_request("/recurring-expenses", token=token)
    assert status == 200
    print(f"  ✓ Active Recurring Commitments: {len(recurrings)}")
    for r in recurrings:
        print(f"    • {r['name']:<25} ₹{r['amount']:,.0f} ({r['frequency']}) | Due in {r['days_until_due']} days")

    status, detected = make_request("/recurring-expenses/detected", token=token)
    assert status == 200
    print(f"  ✓ Detected Unregistered Subscriptions: {len(detected)}")
    for d in detected:
        print(f"    • [DETECTED] {d['name']} - ₹{d['amount']:,.0f} ({d['frequency']}) | Confidence: {d['confidence']*100:.0f}%")
        print(f"      Reason: {d['detected_reason']}")

    # 7. Savings Goals
    print("\n[Step 7] Checking Savings Goals Endpoint...")
    status, goals = make_request("/goals", token=token)
    assert status == 200
    print(f"  ✓ Active Savings Goals: {len(goals)}")
    for g in goals:
        print(f"    • {g['name']:<25} Saved: ₹{g['saved_amount']:,.0f} / ₹{g['target_amount']:,.0f} ({g['progress_percentage']:.0f}%) | {g['status_summary']}")

    print("\n==================================================")
    print("   ALL FULL-STACK SYSTEM CHECKS PASSED 100%!     ")
    print("==================================================")

if __name__ == "__main__":
    main()
