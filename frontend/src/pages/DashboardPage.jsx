import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import PressureGaugeCard from '../components/PressureGaugeCard';
import ForecastCard from '../components/ForecastCard';
import ForecastChart from '../components/ForecastChart';
import VelocityCard from '../components/VelocityCard';
import SpendingBehaviorCard from '../components/SpendingBehaviorCard';
import UpcomingExpensesCard from '../components/UpcomingExpensesCard';
import SmartInsightsCard from '../components/SmartInsightsCard';
import FinancialHealthCard from '../components/FinancialHealthCard';

export default function DashboardPage({
  dashboardData,
  isLoading,
  onRefresh,
  onOpenAddTransaction,
  onNavigate
}) {
  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-2xl border border-slate-700/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-800/60 rounded-2xl" />
          <div className="h-80 bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-12 text-center rounded-2xl bg-iq-card border border-iq-border my-12">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Your financial picture starts here.</h3>
        <p className="text-sm text-slate-400 mb-5">
          Add your first transaction to unlock personalized predictive intelligence.
        </p>
        <button
          onClick={onOpenAddTransaction}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add First Transaction</span>
        </button>
      </div>
    );
  }

  const {
    user_name = '',
    greeting = 'Good morning',
    current_balance = 0,
    total_income = 0,
    total_expenses = 0,
    savings = 0,
    savings_rate = 0,
    pressure_score,
    pressure_level,
    pressure_headline,
    pressure_explanation,
    pressure_factors,
    days_until_pressure,
    pressure_timeline,
    predicted_month_end_balance,
    prediction_confidence,
    forecast_timeline,
    spending_velocity,
    category_breakdown,
    category_trends,
    upcoming_expenses,
    financial_health,
    insights
  } = dashboardData;

  const pressurePayload = {
    score: pressure_score,
    level: pressure_level,
    headline: pressure_headline,
    explanation: pressure_explanation,
    factors: pressure_factors,
    days_until_pressure,
    timeline: pressure_timeline
  };

  const forecastPayload = {
    predicted_month_end_balance,
    confidence_percentage: prediction_confidence,
    status_summary: "Based on current daily velocity and scheduled recurring debits."
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {greeting}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Here's your predictive financial picture and forward cash flow run-rate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh dashboard analytics"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 4 Core Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="p-5 rounded-2xl bg-iq-card border border-iq-border shadow-lg hover:border-iq-borderLight transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Current Balance</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatCurrency(current_balance)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">Available liquid funds</span>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-iq-card border border-iq-border shadow-lg hover:border-iq-borderLight transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatCurrency(total_income)}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">Recorded this month</span>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-iq-card border border-iq-border shadow-lg hover:border-iq-borderLight transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Spent</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatCurrency(total_expenses)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">Month-to-date spending</span>
        </div>

        {/* Savings */}
        <div className="p-5 rounded-2xl bg-iq-card border border-iq-border shadow-lg hover:border-iq-borderLight transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Savings</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatCurrency(savings)}
          </div>
          <span className="text-[11px] text-cyan-400 mt-1 block font-medium">{savings_rate}% savings rate</span>
        </div>
      </div>

      {/* Row 2: Signature Differentiators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial Pressure Score Card */}
        <div className="lg:col-span-7">
          <PressureGaugeCard data={pressurePayload} />
        </div>

        {/* Predicted Month-End Balance */}
        <div className="lg:col-span-5">
          <ForecastCard forecast={forecastPayload} currentBalance={current_balance} />
        </div>
      </div>

      {/* Row 3: Trajectory Line Chart & Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ForecastChart data={forecast_timeline} />
        </div>
        <div className="lg:col-span-4">
          <VelocityCard velocity={spending_velocity} />
        </div>
      </div>

      {/* Row 4: Behavioral Shifts & Upcoming Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <SpendingBehaviorCard
            categoryTrends={category_trends}
            categoryBreakdown={category_breakdown}
          />
        </div>
        <div className="lg:col-span-5">
          <UpcomingExpensesCard
            upcomingExpenses={upcoming_expenses}
            onManageClick={() => onNavigate('recurring')}
          />
        </div>
      </div>

      {/* Row 5: Actionable Insights Feed */}
      <SmartInsightsCard insights={insights} />

      {/* Row 6: Financial Health Pillars */}
      <FinancialHealthCard health={financial_health} />
    </div>
  );
}
