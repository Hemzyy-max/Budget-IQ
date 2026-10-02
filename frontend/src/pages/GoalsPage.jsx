import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Edit2, Trash2, Calendar, Coins } from 'lucide-react';
import { goalsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import GoalModal from '../components/GoalModal';
import GoalDepositModal from '../components/GoalDepositModal';

export default function GoalsPage({ onGoalMutated }) {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [depositGoal, setDepositGoal] = useState(null);
  const { addToast } = useToast();

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await goalsApi.getAll();
      setGoals(res.data);
    } catch {
      addToast('Failed to load savings goals.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSave = async (data) => {
    try {
      if (editingGoal) {
        await goalsApi.update(editingGoal.id, data);
        addToast('Savings goal updated.', 'success');
      } else {
        await goalsApi.create(data);
        addToast('Savings goal created.', 'success');
      }
      fetchGoals();
      if (onGoalMutated) onGoalMutated();
    } catch {
      addToast('Failed to save savings goal.', 'error');
    }
  };

  const handleDeposit = async (goal, amount) => {
    try {
      const updatedSaved = (goal.saved_amount || 0) + amount;
      await goalsApi.update(goal.id, {
        name: goal.name,
        target_amount: goal.target_amount,
        saved_amount: updatedSaved,
        target_date: goal.target_date ? goal.target_date.split('T')[0] : ''
      });
      addToast(`Deposited ₹${amount.toLocaleString()} into ${goal.name}!`, 'success');
      fetchGoals();
      if (onGoalMutated) onGoalMutated();
    } catch {
      addToast('Failed to record deposit.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      await goalsApi.delete(id);
      addToast('Savings goal removed.', 'info');
      fetchGoals();
      if (onGoalMutated) onGoalMutated();
    } catch {
      addToast('Failed to delete goal.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Savings Goals</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Target capital milestones with run-rate projection and automated completion dates.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Savings Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((g) => {
          const isDone = g.progress_percentage >= 100;

          return (
            <div
              key={g.id}
              className={`p-6 rounded-2xl bg-iq-card border transition-all flex flex-col justify-between ${
                isDone
                  ? 'border-emerald-500/40 shadow-glow-emerald'
                  : 'border-iq-border hover:border-iq-borderLight'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Target className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{g.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingGoal(g);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-2xl font-black text-white">
                      {formatCurrency(g.saved_amount)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Target: {formatCurrency(g.target_amount)}
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden my-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, g.progress_percentage))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{g.progress_percentage}% achieved</span>
                    <span>Remaining: {formatCurrency(g.remaining_amount)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="pt-4 border-t border-slate-800/80 space-y-1.5 text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Target Date: {formatDate(g.target_date)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    {g.status_summary}
                  </p>
                </div>

                {/* Add Funds Button */}
                {!isDone && (
                  <button
                    onClick={() => setDepositGoal(g)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-indigo-300 hover:text-white text-xs font-bold border border-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Add Funds to Goal</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && !isLoading && (
        <div className="p-12 text-center rounded-2xl bg-iq-card border border-iq-border text-slate-400">
          <p className="text-sm">No savings goals created yet.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Goal Edit / Create Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingGoal}
      />

      {/* Quick Deposit Modal */}
      <GoalDepositModal
        isOpen={!!depositGoal}
        onClose={() => setDepositGoal(null)}
        onDeposit={handleDeposit}
        goal={depositGoal}
      />
    </div>
  );
}
