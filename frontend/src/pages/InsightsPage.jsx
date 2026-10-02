import React, { useState } from 'react';
import { Lightbulb, Filter, AlertTriangle, CheckCircle2, Flame, Info, Sparkles } from 'lucide-react';
import SmartInsightsCard from '../components/SmartInsightsCard';

export default function InsightsPage({ insights = [] }) {
  const [filter, setFilter] = useState('all');

  const filteredInsights = insights.filter((ins) => {
    if (filter === 'all') return true;
    if (filter === 'warnings') return ins.severity === 'warning' || ins.severity === 'critical';
    if (filter === 'positive') return ins.severity === 'positive';
    if (filter === 'budget') return ins.insight_type === 'budget';
    if (filter === 'pressure') return ins.insight_type === 'pressure';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Intelligence & Insights Feed</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time explainable heuristics derived from your spending velocity and cash-flow obligations.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'warnings', label: 'Warnings' },
            { id: 'pressure', label: 'Pressure' },
            { id: 'budget', label: 'Budgets' },
            { id: 'positive', label: 'Positive' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <SmartInsightsCard insights={filteredInsights} />

      {filteredInsights.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-iq-card border border-iq-border text-slate-400">
          No insights under the "{filter}" category at this time.
        </div>
      )}
    </div>
  );
}
