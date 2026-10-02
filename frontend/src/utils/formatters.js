/**
 * Formats a numeric value into Indian Rupee format (e.g. ₹24,580 or ₹1,20,000)
 */
export function formatCurrency(amount, includeDecimals = false) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  const numericVal = Number(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(Math.abs(numericVal));

  return `${numericVal < 0 ? '-' : ''}₹${formatted}`;
}

/**
 * Formats ISO date string to human-readable format like "Sep 13, 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Relative days formatter like "in 3 days", "Today", "in 12 days"
 */
export function formatDaysCountdown(days) {
  if (days === undefined || days === null) return '';
  if (days === 0) return 'Due Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  return `in ${days} days`;
}

/**
 * Visual color mapping for financial categories
 */
export const CATEGORY_COLORS = {
  Food: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', fill: '#F59E0B' },
  Transport: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', fill: '#06B6D4' },
  Shopping: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', fill: '#A855F7' },
  Entertainment: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', fill: '#EC4899' },
  Bills: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', fill: '#3B82F6' },
  Education: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', fill: '#10B981' },
  Health: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', fill: '#F43F5E' },
  Subscriptions: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', fill: '#6366F1' },
  Salary: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', fill: '#10B981' },
  Other: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', fill: '#64748B' },
};

export function getCategoryStyles(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
}

/**
 * Visual styling based on Financial Pressure Score (0 - 100)
 */
export function getPressureStyles(score) {
  if (score <= 20) {
    return {
      level: 'Very Low Pressure',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      gauge: '#10B981',
      badgeBg: 'bg-emerald-500/20 text-emerald-300'
    };
  } else if (score <= 40) {
    return {
      level: 'Low Pressure',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/30',
      gauge: '#14B8A6',
      badgeBg: 'bg-teal-500/20 text-teal-300'
    };
  } else if (score <= 60) {
    return {
      level: 'Moderate Pressure',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      gauge: '#F59E0B',
      badgeBg: 'bg-amber-500/20 text-amber-300'
    };
  } else if (score <= 80) {
    return {
      level: 'High Pressure',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      gauge: '#F97316',
      badgeBg: 'bg-orange-500/20 text-orange-300'
    };
  } else {
    return {
      level: 'Critical Pressure',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      gauge: '#EF4444',
      badgeBg: 'bg-rose-500/20 text-rose-300'
    };
  }
}
