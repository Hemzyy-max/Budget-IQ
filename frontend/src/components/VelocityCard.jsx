import React from 'react';
import { Gauge, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function VelocityCard({ velocity }) {
  if (!velocity) return null;

  const {
    current_daily_spending = 0,
    historical_daily_spending = 0,
    percentage_difference = 0,
    is_higher = false,
    status_message = ''
  } = velocity;

  const isSignificant = Math.abs(percentage_difference) > 10;

  return (
    <div className="rounded-2xl bg-iq-card border border-iq-border p-6 shadow-xl hover:border-iq-borderLight transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Burn Rate</h3>
            <h2 className="text-lg font-bold text-white tracking-tight">Spending Velocity</h2>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            is_higher
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {is_higher ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {percentage_difference > 0 ? `+${percentage_difference}%` : `${percentage_difference}%`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 my-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Current Pace</span>
          <div className="text-2xl font-black text-white mt-0.5">
            {formatCurrency(current_daily_spending)}
            <span className="text-xs font-normal text-slate-400">/day</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Historical Normal</span>
          <div className="text-2xl font-black text-slate-300 mt-0.5">
            {formatCurrency(historical_daily_spending)}
            <span className="text-xs font-normal text-slate-400">/day</span>
          </div>
        </div>
      </div>

      {/* Velocity Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
          <span>0x Normal</span>
          <span>1.0x Baseline</span>
          <span>2.0x+ High Burn</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              is_higher ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{
              width: `${Math.min(100, Math.max(10, (current_daily_spending / (historical_daily_spending * 2 || 1)) * 100))}%`,
            }}
          />
        </div>
      </div>

      <p className="text-xs text-slate-300 mt-3.5 leading-relaxed">
        {status_message}
      </p>
    </div>
  );
}
