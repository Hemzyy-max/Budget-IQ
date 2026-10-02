import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const isProjected = dataPoint.is_projected;

    return (
      <div className="rounded-xl bg-slate-900/95 border border-slate-700/80 p-3 shadow-2xl backdrop-blur-md">
        <div className="text-xs font-semibold text-slate-400 mb-1">{dataPoint.date}</div>
        <div className="text-sm font-bold text-white flex items-center gap-1.5">
          <span>Balance:</span>
          <span className={isProjected ? 'text-indigo-400' : 'text-emerald-400'}>
            {formatCurrency(dataPoint.balance)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isProjected ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-[11px] font-medium text-slate-300">
            {isProjected ? 'Projected Future Balance' : 'Actual Recorded Balance'}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ForecastChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-iq-card rounded-2xl border border-iq-border p-6">
        <p className="text-sm">No balance timeline data available yet.</p>
      </div>
    );
  }

  // Find transition index between actual and projected
  const todayIndex = data.findIndex((d) => d.label === 'Today' || d.is_projected);
  const todayItem = todayIndex >= 0 ? data[todayIndex] : null;

  return (
    <div className="rounded-2xl bg-iq-card border border-iq-border p-6 shadow-xl hover:border-iq-borderLight transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cash Flow Trajectory</h3>
          <h2 className="text-lg font-bold text-white tracking-tight">Actual vs Projected Balance</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Historical Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Projected Run-Rate</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1E293B' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            {todayItem && (
              <ReferenceLine
                x={todayItem.date}
                stroke="#6366F1"
                strokeDasharray="4 4"
                label={{
                  value: 'Today',
                  fill: '#818CF8',
                  fontSize: 11,
                  position: 'top',
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#6366F1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#projectedGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
