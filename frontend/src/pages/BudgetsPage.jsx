import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { budgetsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, getCategoryStyles } from '../utils/formatters';
import BudgetModal from '../components/BudgetModal';

export default function BudgetsPage({ onBudgetMutated }) {
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const { addToast } = useToast();

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await budgetsApi.getAll();
      setBudgets(res.data);
    } catch {
      addToast('Failed to load budgets.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSaveBudget = async (data) => {
    try {
      if (editingBudget) {
        await budgetsApi.update(editingBudget.id, data);
        addToast('Budget updated.', 'success');
      } else {
        await budgetsApi.create(data);
        addToast('Budget created.', 'success');
      }
      fetchBudgets();
      if (onBudgetMutated) onBudgetMutated();
    } catch {
      addToast('Failed to save budget.', 'error');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to remove this budget?')) return;
    try {
      await budgetsApi.delete(id);
      addToast('Budget deleted.', 'info');
      fetchBudgets();
      if (onBudgetMutated) onBudgetMutated();
    } catch {
      addToast('Failed to delete budget.', 'error');
    }
  };

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.budget_amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const overallUsed = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Category Budgets</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Set and track dynamic category limits with proactive overrun alerts.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="p-5 rounded-2xl bg-iq-card border border-iq-border grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-slate-400 font-medium">Total Budget Allocation</span>
          <div className="text-2xl font-black text-white mt-1">{formatCurrency(totalBudgeted)}</div>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium">Month-to-Date Spending</span>
          <div className="text-2xl font-black text-slate-200 mt-1">{formatCurrency(totalSpent)}</div>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium">Overall Utilization</span>
          <div className="text-2xl font-black text-indigo-400 mt-1">{overallUsed}%</div>
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const catStyle = getCategoryStyles(b.category);
          const isOver = b.is_exceeded;
          const isWarn = b.is_warning;

          return (
            <div
              key={b.id}
              className={`p-5 rounded-2xl bg-iq-card border transition-all ${
                isOver
                  ? 'border-rose-500/40 shadow-glow-rose'
                  : isWarn
                  ? 'border-amber-500/40 shadow-glow-amber'
                  : 'border-iq-border hover:border-iq-borderLight'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${catStyle.bg} ${catStyle.text}`}>
                    {b.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingBudget(b);
                      setIsModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Edit Budget"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                    title="Delete Budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress & Amounts */}
              <div className="flex justify-between items-baseline mb-2">
                <div>
                  <span className="text-xs text-slate-400">Spent: </span>
                  <strong className="text-white font-bold">{formatCurrency(b.spent_amount)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Limit: </span>
                  <span className="text-slate-300 font-semibold">{formatCurrency(b.budget_amount)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, b.percentage_used))}%` }}
                />
              </div>

              {/* Dynamic Status Message */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold flex items-center gap-1.5 ${
                  isOver ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {isOver && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  {isWarn && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{b.status_message}</span>
                </span>
                <span className="font-bold text-slate-300">{b.percentage_used}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && !isLoading && (
        <div className="p-12 text-center rounded-2xl bg-iq-card border border-iq-border text-slate-400">
          <p className="text-sm">No budgets configured yet for this month.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            Create Your First Budget
          </button>
        </div>
      )}

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBudget}
        initialData={editingBudget}
      />
    </div>
  );
}
