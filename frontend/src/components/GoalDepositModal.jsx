import React, { useState } from 'react';
import { X, Target, Plus, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function GoalDepositModal({ isOpen, onClose, onDeposit, goal }) {
  const [depositAmount, setDepositAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !goal) return null;

  const quickAmounts = [500, 1000, 2500, 5000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid deposit amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onDeposit(goal, amt);
      setDepositAmount('');
      onClose();
    } catch {
      setError('Failed to record deposit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const newTotal = (goal.saved_amount || 0) + (parseFloat(depositAmount) || 0);
  const newProgress = goal.target_amount > 0 ? Math.min(100, Math.round((newTotal / goal.target_amount) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Funds to Goal</h3>
              <p className="text-xs text-slate-400">{goal.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Current Progress</span>
            <div className="text-sm font-black text-white mt-0.5">
              {formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}
            </div>
          </div>
          <span className="px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/25">
            {goal.progress_percentage}%
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Deposit Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
              <input
                type="number"
                step="1"
                min="1"
                required
                placeholder="1000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-base placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setDepositAmount(String(q))}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/60 transition-all"
              >
                +₹{q.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Projected Progress Preview */}
          {parseFloat(depositAmount) > 0 && (
            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs">
              <div className="flex justify-between items-center text-slate-300 mb-1">
                <span>New Projected Balance:</span>
                <strong className="text-white font-black">{formatCurrency(newTotal)}</strong>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${newProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block font-medium">
                Pushes goal to {newProgress}% completed!
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Recording...' : 'Confirm Deposit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
