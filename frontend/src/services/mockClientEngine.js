/**
 * Client-Side Intelligence & Mock Engine for Budget IQ
 * 
 * Provides 100% offline & static-hosting fallback when deployed to Firebase Hosting
 * without a live remote backend server. Emulates all financial intelligence formulas:
 * - Financial Pressure Score (0-100)
 * - Spending Velocity & Behavioral Shifts
 * - Trajectory & Forecast Timeline
 * - Real-time In-App Notifications
 * - Category Budgets, Recurring Commitments, and Goals
 */

const STORAGE_KEYS = {
  USER: 'budget_iq_demo_user',
  TRANSACTIONS: 'budget_iq_demo_txs',
  BUDGETS: 'budget_iq_demo_budgets',
  RECURRING: 'budget_iq_demo_recurring',
  GOALS: 'budget_iq_demo_goals',
  NOTIFICATIONS: 'budget_iq_demo_notifications',
};

// Event emitter for client-side real-time notifications
class RealtimeNotificationEmitter {
  constructor() {
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(notification) {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (err) {
        console.error('Error in notification listener:', err);
      }
    });
  }
}

export const realtimeEmitter = new RealtimeNotificationEmitter();

export function getInitialDemoState() {
  const user = {
    id: 1,
    name: 'Hemachandran',
    email: 'demo@budgetiq.app',
    monthly_income: 35000,
    income_type: 'Salary',
    expected_income_date: 1,
    current_balance: 24580,
    created_at: new Date().toISOString()
  };

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const transactions = [
    { id: 1, amount: 35000, transaction_type: 'income', category: 'Salary', description: 'Monthly Salary Credit', payment_method: 'Bank Transfer', transaction_date: `${year}-${String(month).padStart(2, '0')}-01`, is_recurring: false },
    { id: 2, amount: 8000, transaction_type: 'expense', category: 'Bills', description: 'Apartment Rent Advance', payment_method: 'UPI', transaction_date: `${year}-${String(month).padStart(2, '0')}-02`, is_recurring: true },
    { id: 3, amount: 950, transaction_type: 'expense', category: 'Food', description: 'Weekly Groceries & Staples', payment_method: 'UPI', transaction_date: `${year}-${String(month).padStart(2, '0')}-03`, is_recurring: false },
    { id: 4, amount: 1500, transaction_type: 'expense', category: 'Bills', description: 'Electricity Bill', payment_method: 'UPI', transaction_date: `${year}-${String(month).padStart(2, '0')}-04`, is_recurring: true },
    { id: 5, amount: 999, transaction_type: 'expense', category: 'Subscriptions', description: 'Airtel Fiber Broadband', payment_method: 'UPI', transaction_date: `${year}-${String(month).padStart(2, '0')}-05`, is_recurring: true },
  ];

  const budgets = [
    { id: 1, user_id: 1, category: 'Food', budget_amount: 5000, month, year },
    { id: 2, user_id: 1, category: 'Bills', budget_amount: 3500, month, year },
    { id: 3, user_id: 1, category: 'Shopping', budget_amount: 3000, month, year },
    { id: 4, user_id: 1, category: 'Transport', budget_amount: 2500, month, year },
    { id: 5, user_id: 1, category: 'Entertainment', budget_amount: 2000, month, year },
  ];

  const recurring = [
    { id: 1, user_id: 1, name: 'Apartment Rent', amount: 8000, category: 'Bills', frequency: 'Monthly', next_due_date: `${year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}-01` },
    { id: 2, user_id: 1, name: 'Netflix Premium', amount: 649, category: 'Subscriptions', frequency: 'Monthly', next_due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] },
    { id: 3, user_id: 1, name: 'Internet (Airtel Fiber)', amount: 999, category: 'Bills', frequency: 'Monthly', next_due_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0] },
    { id: 4, user_id: 1, name: 'Spotify Duo', amount: 149, category: 'Subscriptions', frequency: 'Monthly', next_due_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] },
  ];

  const goals = [
    { id: 1, user_id: 1, name: 'Emergency Buffer Fund', target_amount: 50000, saved_amount: 32000, target_date: `${year}-12-31` },
    { id: 2, user_id: 1, name: 'MacBook Pro M-Series', target_amount: 120000, saved_amount: 45000, target_date: `${year + 1}-03-31` },
    { id: 3, user_id: 1, name: 'Goa Vacation', target_amount: 25000, saved_amount: 18500, target_date: `${year}-11-15` },
  ];

  const notifications = [
    { id: 1, user_id: 1, type: 'login', title: 'Real-Time Sign-In Detected', message: 'Signed in safely to Budget IQ from Chrome on Windows.', severity: 'success', link_view: 'dashboard', is_read: false, created_at: new Date(Date.now() - 300000).toISOString() },
    { id: 2, user_id: 1, type: 'bill_reminder', title: 'Upcoming Bill: Netflix', message: 'Netflix (₹649) is due in 2 days. Ensure account balance is sufficient.', severity: 'warning', link_view: 'recurring', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, user_id: 1, type: 'budget_alert', title: 'Bills Budget Exceeded', message: 'You have exceeded your monthly Bills limit by ₹6,000.', severity: 'critical', link_view: 'budgets', is_read: true, created_at: new Date(Date.now() - 7200000).toISOString() },
  ];

  return { user, transactions, budgets, recurring, goals, notifications };
}

export function initStorageIfEmpty() {
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    const data = getInitialDemoState();
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(data.budgets));
    localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(data.recurring));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data.goals));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
  }
}

export function resetDemoStorage() {
  const data = getInitialDemoState();
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(data.budgets));
  localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(data.recurring));
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data.goals));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
  return data;
}

export const mockStorage = {
  getUser: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'),
  setUser: (u) => localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u)),
  getTransactions: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'),
  setTransactions: (t) => localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(t)),
  getBudgets: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '[]'),
  setBudgets: (b) => localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(b)),
  getRecurring: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURRING) || '[]'),
  setRecurring: (r) => localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(r)),
  getGoals: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || '[]'),
  setGoals: (g) => localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(g)),
  getNotifications: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]'),
  setNotifications: (n) => localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(n)),
};

// Compute dynamic intelligence metrics client-side
export function computeDashboardIntelligence() {
  initStorageIfEmpty();
  const user = mockStorage.getUser();
  const txs = mockStorage.getTransactions();
  const budgets = mockStorage.getBudgets();
  const recurring = mockStorage.getRecurring();
  const today = new Date();
  const curMonth = today.getMonth() + 1;
  const curYear = today.getFullYear();

  const mtdExpenses = txs.filter(t => {
    const d = new Date(t.transaction_date);
    return t.transaction_type === 'expense' && d.getMonth() + 1 === curMonth && d.getFullYear() === curYear;
  });

  const mtdIncome = txs.filter(t => {
    const d = new Date(t.transaction_date);
    return t.transaction_type === 'income' && d.getMonth() + 1 === curMonth && d.getFullYear() === curYear;
  });

  const totalSpent = mtdExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = mtdIncome.reduce((sum, t) => sum + Number(t.amount), 0);
  const savings = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? Math.round((Math.max(0, savings) / totalIncome) * 100) : 0;

  const daysElapsed = Math.max(1, today.getDate());
  const dailyVelocity = totalSpent / daysElapsed;
  const historicalBaseline = 888.35;
  const velocityDiff = ((dailyVelocity - historicalBaseline) / historicalBaseline) * 100;

  const daysInMonth = new Date(curYear, curMonth, 0).getDate();
  const remainingDays = Math.max(0, daysInMonth - daysElapsed);

  // Pressure score
  let score = 50;
  if (velocityDiff > 50) score += 20;
  if (totalSpent > (user?.monthly_income || 35000) * 0.7) score += 15;
  score = Math.min(95, Math.max(15, Math.round(score)));

  const level = score >= 80 ? 'Critical Pressure' : score >= 60 ? 'Moderate Pressure' : 'Healthy Comfort';

  // Predicted balance
  const upcomingRecurringAmt = recurring.reduce((s, r) => s + Number(r.amount), 0);
  const predictedMonthEndBalance = Math.round(user.current_balance - (dailyVelocity * remainingDays));

  // Trajectory timeline
  const timeline = [];
  let simBalance = user.current_balance;
  for (let d = 1; d <= daysInMonth; d++) {
    const isPast = d <= daysElapsed;
    if (!isPast) {
      simBalance -= dailyVelocity;
    }
    timeline.push({
      day: d,
      date_label: `${d} ${today.toLocaleString('default', { month: 'short' })}`,
      actual_balance: isPast ? Math.round(user.current_balance + (daysElapsed - d) * dailyVelocity * 0.8) : null,
      predicted_balance: isPast ? null : Math.round(simBalance),
      lower_bound: isPast ? null : Math.round(simBalance * 0.88),
      upper_bound: isPast ? null : Math.round(simBalance * 1.12),
    });
  }

  // Category breakdown
  const categoryMap = {};
  mtdExpenses.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
  });
  const categoryBreakdown = Object.entries(categoryMap).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
    percentage: totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0
  }));

  // Category trends
  const categoryTrends = [
    { category: 'Food', current_month_spending: categoryMap['Food'] || 950, historical_average: 3850, percentage_change: -75.3, is_increase: false, absolute_difference: 2900 },
    { category: 'Bills', current_month_spending: categoryMap['Bills'] || 9500, historical_average: 3500, percentage_change: +171.4, is_increase: true, absolute_difference: 6000 },
    { category: 'Entertainment', current_month_spending: 0, historical_average: 1350, percentage_change: -100, is_increase: false, absolute_difference: 1350 },
    { category: 'Shopping', current_month_spending: 0, historical_average: 2100, percentage_change: -100, is_increase: false, absolute_difference: 2100 },
  ];

  return {
    user_name: user?.name || 'Hemachandran',
    greeting: `Good ${today.getHours() < 12 ? 'morning' : today.getHours() < 17 ? 'afternoon' : 'evening'}, ${user?.name ? user.name.split(' ')[0] : 'Hemachandran'}`,
    current_balance: user?.current_balance || 24580,
    total_income: totalIncome || 35000,
    total_expenses: totalSpent,
    savings,
    savings_rate: savingsRate,
    pressure_score: score,
    pressure_level: level,
    pressure_headline: score >= 75 ? 'Immediate Attention Required' : 'Spending Within Safe Limits',
    pressure_explanation: `Current spending velocity is ₹${Math.round(dailyVelocity).toLocaleString()}/day across ${daysElapsed} days elapsed.`,
    pressure_factors: [
      `Daily spending rate is ${velocityDiff >= 0 ? '+' : ''}${Math.round(velocityDiff)}% vs baseline`,
      `Upcoming recurring bills total ₹${upcomingRecurringAmt.toLocaleString()}`,
      `Comfort liquidity buffer maintained`
    ],
    days_until_pressure: 4,
    pressure_timeline: [
      { day_label: 'Today', projected_buffer: user?.current_balance || 24580, status: 'Normal' },
      { day_label: 'Day 4', projected_buffer: Math.round((user?.current_balance || 24580) * 0.7), status: 'Pressure Increasing' },
      { day_label: 'Day 8', projected_buffer: Math.round((user?.current_balance || 24580) * 0.4), status: 'Critical' },
      { day_label: 'Day 12 (Payday)', projected_buffer: Math.round((user?.current_balance || 24580) * 0.9), status: 'Income Expected' },
    ],
    predicted_month_end_balance: predictedMonthEndBalance,
    prediction_confidence: 78,
    forecast_timeline: timeline,
    spending_velocity: {
      current_daily_spending: Math.round(dailyVelocity),
      historical_daily_spending: Math.round(historicalBaseline),
      velocity_ratio: Number((dailyVelocity / historicalBaseline).toFixed(2)),
      percentage_difference: Math.round(velocityDiff),
      status_message: velocityDiff > 0
        ? `You are spending ${Math.round(velocityDiff)}% faster than your usual pace.`
        : 'Your spending pace is controlled and below historical average.'
    },
    category_breakdown: categoryBreakdown,
    category_trends: categoryTrends,
    upcoming_expenses: recurring.map(r => ({
      name: r.name,
      amount: r.amount,
      frequency: r.frequency,
      days_until_due: Math.max(0, Math.ceil((new Date(r.next_due_date) - today) / (1000 * 60 * 60 * 24))),
      is_due_soon: Math.ceil((new Date(r.next_due_date) - today) / (1000 * 60 * 60 * 24)) <= 5
    })),
    financial_health: {
      overall_score: 74,
      rating: 'Good',
      breakdown: {
        spending_discipline: 65,
        savings_rate: Math.min(100, savingsRate * 2),
        budget_control: 70,
        emergency_buffer: 80,
        recurring_expense_load: 65
      },
      summary_message: 'Strong savings rate and liquidity buffer; maintain current pace through upcoming bills.'
    },
    insights: [
      {
        id: 1,
        severity: score >= 75 ? 'critical' : 'warning',
        insight_type: 'pressure',
        title: 'FINANCIAL PRESSURE FORECAST',
        what_happened: 'Upcoming fixed commitments and current burn rate are pacing higher than standard.',
        why_it_matters: 'Pacing non-essential spending preserves liquidity before scheduled payday.',
        what_you_can_do: 'Delay discretionary purchases for the next 7 days to maintain comfort buffer.'
      },
      {
        id: 2,
        severity: 'info',
        insight_type: 'recurring',
        title: 'RECURRING BILLS DUE SOON',
        what_happened: 'Upcoming automated subscriptions are due within 7 days.',
        why_it_matters: 'Automated debits require sufficient balance to avoid failed payment retries.',
        what_you_can_do: 'Ensure account has at least ₹1,800 free balance to cover scheduled renewals.'
      }
    ],
    budget_streak: {
      current_streak: 5,
      best_streak: 14,
      streak_status: 'building',
      streak_message: 'You have stayed within daily budget guidelines for 5 consecutive days!'
    }
  };
}
