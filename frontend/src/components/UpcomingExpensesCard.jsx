import React from 'react';
import { Calendar, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDaysCountdown, getCategoryStyles } from '../utils/formatters';

export default function UpcomingExpensesCard({ upcomingExpenses = [], onManageClick }) {
  const totalUpcoming = upcomingExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="rounded-2xl bg-iq-card border border-iq-border p-6 shadow-xl hover:border-iq-borderLight transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Outflows</h3>
              <h2 className="text-lg font-bold text-white tracking-tight">Upcoming Recurring Bills</h2>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-300">
            Total: <strong className="text-white">{formatCurrency(totalUpcoming)}</strong>
          </span>
        </div>

        <div className="space-y-2.5 mt-3">
          {upcomingExpenses.slice(0, 4).map((item) => {
            const styles = getCategoryStyles(item.category);
            const isImminent = item.days_remaining <= 3;

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${isImminent ? 'bg-rose-400 animate-pulse' : 'bg-indigo-400'}`} />
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">{item.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.category}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white">{formatCurrency(item.amount)}</div>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                      isImminent ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {formatDaysCountdown(item.days_remaining)}
                  </span>
                </div>
              </div>
            );
          })}

          {upcomingExpenses.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-xs">
              No upcoming scheduled debits in the next 20 days.
            </div>
          )}
        </div>
      </div>

      {onManageClick && (
        <button
          onClick={onManageClick}
          className="mt-4 pt-3 border-t border-iq-border flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors w-full"
        >
          <span>Manage Recurring Commitments</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
