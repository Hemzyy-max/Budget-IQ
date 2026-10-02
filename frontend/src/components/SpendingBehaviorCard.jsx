import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Layers, PieChart as PieIcon } from 'lucide-react';
import { formatCurrency, getCategoryStyles, CATEGORY_COLORS } from '../utils/formatters';

export default function SpendingBehaviorCard({ categoryTrends = [], categoryBreakdown = [] }) {
  const topTrends = categoryTrends.slice(0, 4);

  return (
    <div className="rounded-2xl bg-iq-card border border-iq-border p-6 shadow-xl hover:border-iq-borderLight transition-all">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Behavioral Shifts</h3>
            <h2 className="text-lg font-bold text-white tracking-tight">Spending Patterns vs Normal</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Category Breakdown Donut */}
        {categoryBreakdown.length > 0 && (
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {categoryBreakdown.map((entry, index) => {
                      const styles = getCategoryStyles(entry.category);
                      return <Cell key={`cell-${index}`} fill={styles.fill} />;
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Spent']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '0.75rem',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {categoryBreakdown.slice(0, 4).map((c) => {
                const styles = getCategoryStyles(c.category);
                return (
                  <div key={c.category} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.fill }} />
                    <span>{c.category}</span>
                    <span className="text-slate-400 font-semibold">{c.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Category Trend Shifts */}
        <div className={`${categoryBreakdown.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {topTrends.map((trend) => {
            const isInc = trend.percentage_change > 0;
            const styles = getCategoryStyles(trend.category);

            return (
              <div
                key={trend.category}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${styles.bg} ${styles.text}`}>
                    {trend.category}
                  </span>
                  <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                    {formatCurrency(trend.current_month_spending)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                      isInc ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10'
                    }`}
                  >
                    {isInc ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {isInc ? `+${trend.percentage_change}%` : `${trend.percentage_change}%`}
                  </span>
                </div>
              </div>
            );
          })}

          {topTrends.length === 0 && (
            <p className="text-xs text-slate-400">Log more transactions to surface category comparisons.</p>
          )}
        </div>
      </div>
    </div>
  );
}
