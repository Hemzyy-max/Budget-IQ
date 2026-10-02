# BUDGET IQ

> **Tagline**: *"Don't just track your money. Understand where it's going."*  
> **Core Loop**: `Track → Understand → Predict → Warn → Improve`

---

## 💡 Overview & Problem Statement

Most personal finance apps act as **passive historical ledger books**. They tell users after the fact:
> *"You spent ₹8,000 this month."*

Budget IQ is built on a fundamentally different premise: **Predictive Financial Intelligence**. Instead of merely cataloging past expenses, Budget IQ answers the question that actually matters to students, young professionals, and middle-class households:
> *"What am I likely to have left before next payday, and when will cash flow become tight?"*

Budget IQ provides:
- **"You are spending 32% more on food than your normal baseline."**
- **"At your current velocity, your predicted month-end balance is ₹8,420 (Confidence: 82%)."**
- **"Financial pressure may increase in 8 days because of ₹2,499 in scheduled debits."**

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **Financial Pressure Score (0–100)** | Real-time gauge of liquidity strain (Very Low, Low, Moderate, High, Critical) computed dynamically from buffer adequacy, spending velocity, recurring load, and days to next income. |
| **Pressure Timeline Forecast** | A day-by-day cash flow simulation pinpointing the exact future date when your financial buffer will breach comfort thresholds. |
| **Month-End Balance Forecasting** | Hybrid explainable forecast calculating projected balance with confidence ratings based on spending volatility and history depth. |
| **Cash Flow Trajectory Chart** | Interactive Recharts area chart showing historical actual balance transitioning smoothly into projected run-rate. |
| **Spending Velocity Monitor** | Compares current daily burn rate (₹/day) against historical baseline (₹/day) with percentage variance. |
| **Behavioral Shift Tracking** | Detects category-level surges (e.g. Food +32%, Shopping +18%) compared to 3-month averages. |
| **Recurring Expense Detector** | Unsupervised interval and amount pattern matching that discovers unrecorded subscriptions (e.g. Amazon Prime, Netflix) with 1-click addition. |
| **Proactive Actionable Insights** | Constructive, non-judgmental cards detailing: *What Happened*, *Why It Matters*, and *What You Can Do*. |
| **Financial Health Score (0–100)** | 5-pillar assessment evaluating Spending Discipline, Savings Rate, Budget Control, Emergency Buffer, and Recurring Load. |
| **Full Financial CRUD** | Transactions, category budgets with overrun alerts, recurring bills with countdowns, and savings goals with completion dates. |

---

## 🏗️ System Architecture

```
                    BUDGET IQ
                        │
              React + Vite Frontend
            (Tailwind CSS + Recharts)
                        │ REST API (JWT)
                        ▼
                 Python FastAPI
                        │
          ┌─────────────┴─────────────┐
          │                           │
    Authentication              Intelligence
       Service                     Engine
   (Bcrypt + JWT)                     │
          │               ┌───────────┼───────────┐
          │               │           │           │
          │           Analytics   Forecasting  Pressure
          │            Engine       Engine      Engine
          │               │           │           │
          │               ├───────────┼───────────┤
          │               │           │           │
          │            Insight    Recurring   Financial
          │            Engine     Detector     Health
          │               │           │           │
          │               └───────────┼───────────┘
          │                           │
          └──────────────┬────────────┘
                         │ SQLAlchemy ORM
                         ▼
                MySQL / SQLite Fallback
```

---

## 🧮 How the Intelligence Engines Work

### 1. Financial Pressure Score Formula
The Financial Pressure Score is an explainable composite index from 0 to 100:

$$\text{Daily Spending} = \frac{\text{Current Month Expenses}}{\text{Days Elapsed}}$$

$$\text{Spending Velocity} = \frac{\text{Current Daily Spending}}{\text{Historical Daily Spending}}$$

$$\text{Projected Balance at Income} = \text{Current Balance} - (\text{Daily Spending} \times \text{Days to Income}) - \text{Upcoming Recurring Bills}$$

The pressure engine aggregates four transparent factors:
1. **Buffer Adequacy Factor (50%)**: Proximity of projected balance to safety reserve (15% of income or ₹5,000).
2. **Velocity Factor (25%)**: Percentage deviation above normal daily spending rate.
3. **Recurring Expense Burden (15%)**: Ratio of scheduled debits to liquid account balance.
4. **Budget Utilization Factor (10%)**: Number of categories approaching or exceeding monthly limits.

### 2. End-of-Month Balance Prediction
$$\text{Forecasted Balance} = \text{Current Balance} - (\text{Blended Daily Spend} \times \text{Remaining Days}) - \text{Upcoming Recurring} + \text{Expected Income}$$

- **Blended Daily Spend**: $0.70 \times \text{Current Velocity} + 0.30 \times \text{Historical Baseline}$
- **Confidence Rating**: Base confidence scales from 60% on Day 1 to 90% at month-end, adjusted dynamically by the Coefficient of Variation ($CV = \frac{\sigma}{\mu}$) of daily expenses.

---

## 💾 Database Schema

- `users`: `id`, `name`, `email`, `password_hash`, `monthly_income`, `income_type`, `expected_income_date`, `current_balance`, `created_at`
- `transactions`: `id`, `user_id`, `amount`, `transaction_type`, `category`, `description`, `payment_method`, `transaction_date`, `is_recurring`, `created_at`
- `budgets`: `id`, `user_id`, `category`, `budget_amount`, `month`, `year`, `created_at`
- `recurring_expenses`: `id`, `user_id`, `name`, `amount`, `category`, `frequency`, `next_due_date`, `created_at`
- `savings_goals`: `id`, `user_id`, `name`, `target_amount`, `saved_amount`, `target_date`, `created_at`
- `financial_insights`: `id`, `user_id`, `insight_type`, `title`, `description`, `severity`, `created_at`

---

## 🔌 API Endpoints Summary

### Authentication
- `POST /api/auth/register` — Create new user
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/auth/profile` — Fetch authenticated user profile
- `PUT /api/auth/profile` — Update income, payday, or balance

### Transactions
- `GET /api/transactions` — Filter, search, and sort transactions
- `POST /api/transactions` — Add transaction (dynamically updates balance & intelligence)
- `GET /api/transactions/{id}` — Single transaction
- `PUT /api/transactions/{id}` — Update transaction
- `DELETE /api/transactions/{id}` — Delete transaction

### Budgets & Recurring
- `GET /api/budgets` — List budgets with live spend percentage & alert status
- `POST /api/budgets` — Create/update budget
- `GET /api/recurring-expenses` — List recurring bills & days remaining
- `GET /api/recurring-expenses/detected` — Unsupervised pattern detection of repeating bills

### Predictive Analytics
- `GET /api/analytics/dashboard` — Master consolidated dashboard endpoint
- `GET /api/analytics/pressure-score` — Detailed pressure breakdown & timeline
- `GET /api/analytics/forecast` — Trajectory chart data & confidence metrics
- `GET /api/analytics/spending-behavior` — Category shifts & burn rate
- `GET /api/analytics/financial-health` — 5-pillar health score
- `GET /api/analytics/insights` — Actionable heuristic alerts
- `POST /api/analytics/seed-demo` — Load rich 3-month realistic demo dataset
- `POST /api/analytics/reset-demo` — Reset demo scenario to pristine baseline

---

## ⚡ Quickstart Guide

### Prerequisites
- Python 3.12+ (or UV package manager)
- Node.js v18+ & npm
- MySQL (Optional: app automatically falls back to SQLite if MySQL is unconfigured)

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
uv venv --python 3.12 .venv
# or python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive API documentation will be live at: **http://127.0.0.1:8000/docs**

### 2. Frontend Setup
```bash
cd frontend

# Install npm packages
npm install

# Start development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Frontend will be live at: **http://127.0.0.1:5173/**

---

## 🎬 Hackathon Demo Credentials & Scenario

### Demo Login:
- **Email**: `demo@budgetiq.app`
- **Password**: `password123`
*(Or simply click the **"Explore Live Demo"** button on the landing page for 1-click login!)*

### The 10-Second Hackathon Judge Flow:
1. **Initial Baseline**: Notice the starting balance of **₹24,580**, spending velocity of **₹1,657/day**, and **Financial Pressure Score of 83/100**.
2. **Observe Insights**: Notice the detected pattern of **Amazon Prime (₹499/mo)** identified from past transactions with 98% confidence.
3. **The Dynamic Test**: Click **"Record Transaction"**, log a **₹1,200 Food expense** ("Team Dinner at Bistro").
4. **Immediate Reaction**: Watch the system immediately:
   - Deduct balance to **₹23,380**
   - Accelerate daily velocity to **₹1,749/day**
   - Recalculate month-end forecast
   - Elevate pressure score to **89/100**
   - Trigger a budget exceeded warning on the Food category!

---

## 🔮 Future ML Architecture
The intelligence layer is cleanly isolated from API routers. Future production releases can plug in:
- Linear regression & XGBoost models for seasonal expense prediction
- ARIMA / Prophet time series models in `forecasting_engine.py`
- DBSCAN clustering for automated merchant and subscription grouping in `recurring_detector.py`
#   B u d g e t - I Q  
 