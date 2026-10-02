import React from 'react';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export default function FinancialHealthCard({ health }) {
  if (!health) return null;

  const {
    overall_score = 70,
    rating = 'Good',
    summary_message = '',
    breakdown = {}
  } = health;

  const pillars = [
    { key: 'spending_discipline', label: 'Spending Discipline', value: breakdown.spending_discipline || 70, color: 'bg-indigo-500' },
    { key: 'savings_rate', label: 'Savings Rate', value: breakdown.savings_rate || 75, color: 'bg-emerald-500' },
    { key: 'budget_control', label: 'Budget Control', value: breakdown.budget_control || 65, color: 'bg-cyan-500' },
    { key: 'emergency_buffer', label: 'Emergency Buffer', value: breakdown.emergency_buffer || 60, color: 'bg-amber-500' },
    { key: 'recurring_expense_load', label: 'Recurring Load', value: breakdown.recurring_expense_load || 70, color: 'bg-purple-500' },
  ];

  return (
    <div className="rounded-2xl bg-iq-card border border-iq-border p-6 shadow-xl hover:border-iq-borderLight transition-all">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Comprehensive Check</h3>
            <h2 className="text-lg font-bold text-white tracking-tight">Financial Health Score</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-2xl font-black text-white">{overall_score}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {rating}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-5 leading-relaxed">
        {summary_message}
      </p>

      {/* 5 Pillars Progress Bars */}
      <div className="space-y-3.5">
        {pillars.map((p) => (
          <div key={p.key}>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-slate-300">{p.label}</span>
              <span className="text-white font-bold">{p.value}/100</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${p.color} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, Math.max(5, p.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
