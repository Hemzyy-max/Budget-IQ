from datetime import date, timedelta
import logging
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.recurring_expense import RecurringExpense
from app.models.savings_goal import SavingsGoal
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

DEMO_USER_EMAIL = "demo@budgetiq.app"
DEMO_USER_PASSWORD = "password123"

def seed_demo_data(db: Session, force_reset: bool = True) -> User:
    """
    Seeds a rich, realistic 3-month dataset designed specifically
    to showcase Budget IQ's predictive financial intelligence.
    """
    existing_user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if existing_user and force_reset:
        # Delete existing demo user data cleanly via cascade
        db.delete(existing_user)
        db.commit()
        existing_user = None

    if existing_user and not force_reset:
        return existing_user

    today = date.today()
    cur_year = today.year
    cur_month = today.month

    # 1. Create the Demo User
    # Next income in ~12 days
    income_day = (today.day + 12) if (today.day + 12) <= 28 else 1
    demo_user = User(
        name="Hemachandran",
        email=DEMO_USER_EMAIL,
        password_hash=get_password_hash(DEMO_USER_PASSWORD),
        monthly_income=35000.0,
        income_type="Salary",
        expected_income_date=income_day,
        current_balance=24580.0
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    user_id = demo_user.id

    # 2. Seed Budgets for the Current Month
    budgets = [
        Budget(user_id=user_id, category="Food", budget_amount=6000.0, month=cur_month, year=cur_year),
        Budget(user_id=user_id, category="Shopping", budget_amount=3000.0, month=cur_month, year=cur_year),
        Budget(user_id=user_id, category="Transport", budget_amount=3500.0, month=cur_month, year=cur_year),
        Budget(user_id=user_id, category="Entertainment", budget_amount=2000.0, month=cur_month, year=cur_year),
        Budget(user_id=user_id, category="Bills", budget_amount=4000.0, month=cur_month, year=cur_year),
    ]
    db.add_all(budgets)

    # 3. Seed Recurring Expenses
    recurring_expenses = [
        RecurringExpense(
            user_id=user_id,
            name="Netflix",
            amount=649.0,
            category="Subscriptions",
            frequency="Monthly",
            next_due_date=today + timedelta(days=3)
        ),
        RecurringExpense(
            user_id=user_id,
            name="Internet (Airtel Fiber)",
            amount=999.0,
            category="Bills",
            frequency="Monthly",
            next_due_date=today + timedelta(days=7)
        ),
        RecurringExpense(
            user_id=user_id,
            name="Cult.fit Gym",
            amount=1500.0,
            category="Health",
            frequency="Monthly",
            next_due_date=today + timedelta(days=12)
        ),
        RecurringExpense(
            user_id=user_id,
            name="Spotify Premium",
            amount=119.0,
            category="Subscriptions",
            frequency="Monthly",
            next_due_date=today + timedelta(days=18)
        ),
        RecurringExpense(
            user_id=user_id,
            name="House Rent",
            amount=10000.0,
            category="Bills",
            frequency="Monthly",
            next_due_date=today + timedelta(days=22)
        )
    ]
    db.add_all(recurring_expenses)

    # 4. Seed Savings Goals
    savings_goals = [
        SavingsGoal(
            user_id=user_id,
            name="New Laptop (MacBook M3)",
            target_amount=65000.0,
            saved_amount=24000.0,
            target_date=today + timedelta(days=270)  # ~9 months
        ),
        SavingsGoal(
            user_id=user_id,
            name="Emergency Fund",
            target_amount=100000.0,
            saved_amount=42000.0,
            target_date=today + timedelta(days=365)  # 1 year
        ),
        SavingsGoal(
            user_id=user_id,
            name="Goa Trip with Friends",
            target_amount=15000.0,
            saved_amount=9500.0,
            target_date=today + timedelta(days=90)
        )
    ]
    db.add_all(savings_goals)

    # 5. Generate 3 Months of Realistic Transactions
    transactions = []

    # Helper to append transactions
    def add_tx(amt, t_type, cat, desc, method, t_date, is_rec=False):
        transactions.append(Transaction(
            user_id=user_id,
            amount=amt,
            transaction_type=t_type,
            category=cat,
            description=desc,
            payment_method=method,
            transaction_date=t_date,
            is_recurring=is_rec
        ))

    # Month -2 (60-80 days ago)
    m2_start = today - timedelta(days=70)
    add_tx(35000.0, "income", "Salary", "Monthly Salary Credit", "Bank Transfer", m2_start)
    add_tx(10000.0, "expense", "Bills", "House Rent", "UPI", m2_start + timedelta(days=1), True)
    add_tx(999.0, "expense", "Bills", "Internet", "UPI", m2_start + timedelta(days=5), True)
    add_tx(649.0, "expense", "Subscriptions", "Netflix", "Card", m2_start + timedelta(days=7), True)
    add_tx(1500.0, "expense", "Health", "Gym Membership", "UPI", m2_start + timedelta(days=10), True)
    add_tx(3800.0, "expense", "Food", "Supermarket Groceries & Dinners", "Card", m2_start + timedelta(days=12))
    add_tx(2100.0, "expense", "Transport", "Metro SmartCard & Fuel", "UPI", m2_start + timedelta(days=16))
    add_tx(1800.0, "expense", "Shopping", "Clothing - Myntra", "UPI", m2_start + timedelta(days=20))
    add_tx(1200.0, "expense", "Entertainment", "Weekend Movies & Cafe", "UPI", m2_start + timedelta(days=24))

    # Month -1 (30-50 days ago)
    m1_start = today - timedelta(days=40)
    add_tx(35000.0, "income", "Salary", "Monthly Salary Credit", "Bank Transfer", m1_start)
    add_tx(10000.0, "expense", "Bills", "House Rent", "UPI", m1_start + timedelta(days=1), True)
    add_tx(999.0, "expense", "Bills", "Internet", "UPI", m1_start + timedelta(days=5), True)
    add_tx(649.0, "expense", "Subscriptions", "Netflix", "Card", m1_start + timedelta(days=7), True)
    add_tx(1500.0, "expense", "Health", "Gym Membership", "UPI", m1_start + timedelta(days=10), True)
    add_tx(3900.0, "expense", "Food", "Groceries & Swiggy orders", "UPI", m1_start + timedelta(days=11))
    add_tx(2200.0, "expense", "Transport", "Metro & Cab expenses", "UPI", m1_start + timedelta(days=15))
    add_tx(2400.0, "expense", "Shopping", "Amazon electronics", "Card", m1_start + timedelta(days=18))
    add_tx(1500.0, "expense", "Entertainment", "Dining out & bowling", "Cash", m1_start + timedelta(days=22))

    # Current Month (from 1st of month to today)
    # Calibrated so Food is +32% higher, Transport is lower (-14%), Shopping is +18%!
    # Daily spending velocity is ~₹720/day
    cur_month_start = date(cur_year, cur_month, 1)
    days_in_cur = (today - cur_month_start).days

    # Salary credit on 1st if today >= 1st
    add_tx(35000.0, "income", "Salary", "Monthly Salary Credit", "Bank Transfer", cur_month_start)
    add_tx(10000.0, "expense", "Bills", "House Rent", "UPI", cur_month_start + timedelta(days=1), True)

    # Spread out food expenses representing the food surge (+32%)
    sample_intervals = max(1, days_in_cur)
    step = max(1, days_in_cur // 5)
    for i in range(1, days_in_cur + 1, step):
        t_d = cur_month_start + timedelta(days=i)
        if t_d <= today:
            add_tx(950.0, "expense", "Food", "Swiggy & Weekend Dinner", "UPI", t_d)

    # Transport (disciplined, lower than normal -14%)
    if days_in_cur >= 3:
        add_tx(700.0, "expense", "Transport", "Metro SmartCard Recharge", "UPI", cur_month_start + timedelta(days=3))
    if days_in_cur >= 7:
        add_tx(650.0, "expense", "Transport", "Fuel / Petrol", "UPI", cur_month_start + timedelta(days=7))

    # Shopping (higher +18%)
    if days_in_cur >= 5:
        add_tx(1400.0, "expense", "Shopping", "Zara Weekend Sale", "Card", cur_month_start + timedelta(days=5))
    if days_in_cur >= 10:
        add_tx(1200.0, "expense", "Shopping", "Amazon Home Decors", "Card", cur_month_start + timedelta(days=min(10, days_in_cur)))

    # Entertainment
    if days_in_cur >= 6:
        add_tx(850.0, "expense", "Entertainment", "PVR Cinemas Movie Tickets", "UPI", cur_month_start + timedelta(days=6))
    if days_in_cur >= 12:
        add_tx(550.0, "expense", "Entertainment", "Board Game Cafe", "UPI", cur_month_start + timedelta(days=min(12, days_in_cur)))

    # Repeating subscription transaction that is UNREGISTERED in recurring_expenses table
    # This proves the recurring_detector algorithm works live on the demo!
    add_tx(499.0, "expense", "Subscriptions", "Amazon Prime", "Card", today - timedelta(days=62))
    add_tx(499.0, "expense", "Subscriptions", "Amazon Prime", "Card", today - timedelta(days=31))
    add_tx(499.0, "expense", "Subscriptions", "Amazon Prime", "Card", today - timedelta(days=1))

    db.add_all(transactions)
    db.commit()

    logger.info(f"Demo data successfully seeded for user: {demo_user.email}")
    return demo_user
