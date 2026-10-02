import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Clock, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';
import { getPressureStyles } from '../utils/formatters';

export default function PressureGaugeCard({ data, onExploreTimeline }) {
  if (!data) return null;

  const {
    score = 0,
    level = 'Moderate Pressure',
    trend = 'stable',
    headline = '',
    explanation = '',
    factors = [],
    days_until_pressure,
    timeline = []
  } = data;

  const styles = getPressureStyles(score);

  // SVG Gauge calculations (semi-circle / circular)
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getTrendIcon = () => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-rose-400" />;
    if (trend === 'improving') return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-iq-card border border-iq-border p-6 shadow-xl hover:border-iq-borderLight transition-all">
      {/* Subtle background ambient glow */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: styles.gauge }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${styles.bg} border ${styles.border}`}>
            <ShieldAlert className={`w-5 h-5 ${styles.color}`} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Signature Metric</h3>
            <h2 className="text-lg font-bold text-white tracking-tight">Financial Pressure Score</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${styles.badgeBg} border border-current/20`}>
            {getTrendIcon()}
            <span className="capitalize">{trend}</span>
          </span>
        </div>
      </div>

      {/* Main Score & Radial Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mb-6">
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke={styles.gauge}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black tracking-tight text-white">{score}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">out of 100</span>
            </div>
          </div>
          <span className={`mt-2 text-sm font-bold ${styles.color}`}>{level}</span>
        </div>

        {/* Dynamic Explanation & Pressure Timeline Warning */}
        <div className="md:col-span-8 flex flex-col justify-center">
          <h4 className="text-base font-semibold text-white mb-1.5 flex items-center gap-2">
            <span>{headline || level}</span>
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {explanation}
          </p>

          {/* Days until pressure alert pill */}
          {days_until_pressure !== null && days_until_pressure !== undefined && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold mb-3">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
              <span>
                Financial pressure may increase in <strong className="text-amber-100 underline decoration-amber-400 font-bold">{days_until_pressure} days</strong> based on your current run-rate.
              </span>
            </div>
          )}

          {/* Contributing Factors */}
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Main Contributing Factors:</span>
            <ul className="space-y-1.5">
              {factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Pressure Progression Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="pt-4 border-t border-iq-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Pressure Timeline Forecast
            </span>
            <span className="text-[11px] text-slate-400">14-Day Simulation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {timeline.map((point, index) => {
              const isStrained = point.status.includes('Pressure') || point.status.includes('Critical');
              const isIncome = point.status.includes('Income');

              return (
                <div
                  key={index}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isStrained
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : isIncome
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-400">{point.day_label}</div>
                  <div className="text-xs font-bold text-white mt-0.5">{point.date}</div>
                  <div className={`text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded-md inline-block ${
                    isStrained ? 'bg-amber-500/20 text-amber-300' : isIncome ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {point.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
