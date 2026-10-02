import React from 'react';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function ForecastCard({ forecast, currentBalance }) {
  if (!forecast) return null;

  const {
    predicted_month_end_balance = 0,
    confidence_percentage = 80,
    expected_remaining_spending = 0,
    upcoming_recurring = 0,
    expected_income = 0,
    status_summary = ''
  } = forecast;

  const isPositive = predicted_month_end_balance > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-iq-card border border-iq-border p-6 shadow-xl hover:border-iq-borderLight transition-all">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Predictive Engine</h3>
            <h2 className="text-lg font-bold text-white tracking-tight">Predicted Month-End Balance</h2>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <span className="text-[11px] text-slate-400">Confidence:</span>
          <span className="font-bold text-indigo-400">{confidence_percentage}%</span>
        </div>
      </div>

      {/* Main Predicted Balance */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl sm:text-4xl font-black tracking-tight ${isPositive ? 'text-white' : 'text-rose-400'}`}>
            {formatCurrency(predicted_month_end_balance)}
          </span>
          <span className="text-xs text-slate-400 font-medium">projected balance</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {status_summary || "Based on your current spending rate and upcoming commitments."}
        </p>
      </div>

      {/* Itemized Equation Math */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Current Balance:</span>
          <span className="font-semibold text-white">{formatCurrency(currentBalance)}</span>
        </div>

        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Projected Daily Spending:</span>
          <span className="font-semibold text-rose-400">-{formatCurrency(expected_remaining_spending)}</span>
        </div>

        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Upcoming Recurring Bills:</span>
          <span className="font-semibold text-amber-400">-{formatCurrency(upcoming_recurring)}</span>
        </div>

        {expected_income > 0 && (
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Expected Payday Income:</span>
            <span className="font-semibold text-emerald-400">+{formatCurrency(expected_income)}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold">
          <span className="text-slate-300">Predicted Total:</span>
          <span className={isPositive ? 'text-indigo-400 text-sm' : 'text-rose-400 text-sm'}>
            {formatCurrency(predicted_month_end_balance)}
          </span>
        </div>
      </div>
    </div>
  );
}
