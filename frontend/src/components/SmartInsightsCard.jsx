import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Info, Flame, Lightbulb } from 'lucide-react';

export default function SmartInsightsCard({ insights = [] }) {
  if (!insights || insights.length === 0) return null;

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <Flame className="w-4 h-4 text-rose-400 flex-shrink-0" />,
          cardBg: 'border-rose-500/30 bg-rose-950/10',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          accent: 'text-rose-400'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
          cardBg: 'border-amber-500/30 bg-amber-950/10',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          accent: 'text-amber-400'
        };
      case 'positive':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
          cardBg: 'border-emerald-500/30 bg-emerald-950/10',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          accent: 'text-emerald-400'
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />,
          cardBg: 'border-indigo-500/30 bg-indigo-950/10',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          accent: 'text-indigo-400'
        };
    }
  };

  return (
    <div className="rounded-2xl bg-iq-card border border-iq-border p-6 shadow-xl hover:border-iq-borderLight transition-all">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Adaptive Intelligence</h3>
            <h2 className="text-lg font-bold text-white tracking-tight">Smart Actionable Insights</h2>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-400">
          Non-Judgmental Guidance
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.slice(0, 4).map((ins, index) => {
          const style = getSeverityBadge(ins.severity);

          return (
            <div
              key={ins.id || index}
              className={`p-4 rounded-xl border ${style.cardBg} flex flex-col justify-between transition-all`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {style.icon}
                    <h4 className="text-xs font-bold tracking-wider text-white uppercase">{ins.title}</h4>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
                    {ins.severity}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">What Happened</span>
                    <p className="text-slate-200 mt-0.5 leading-relaxed">{ins.what_happened}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Why It Matters</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{ins.why_it_matters}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className={`font-bold uppercase text-[10px] tracking-wider block ${style.accent}`}>
                  What You Can Do
                </span>
                <p className="text-xs font-medium text-white mt-0.5 leading-relaxed">
                  {ins.what_you_can_do}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
