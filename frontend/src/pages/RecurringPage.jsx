import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Repeat, Sparkles, Check } from 'lucide-react';
import { recurringApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDaysCountdown, formatDate, getCategoryStyles } from '../utils/formatters';
import RecurringModal from '../components/RecurringModal';

export default function RecurringPage({ onRecurringMutated }) {
  const [recurringList, setRecurringList] = useState([]);
  const [detectedList, setDetectedList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recRes, detRes] = await Promise.all([
        recurringApi.getAll(),
        recurringApi.getDetected()
      ]);
      setRecurringList(recRes.data);
      setDetectedList(detRes.data);
    } catch {
      addToast('Failed to load recurring commitments.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await recurringApi.update(editingItem.id, data);
        addToast('Recurring commitment updated.', 'success');
      } else {
        await recurringApi.create(data);
        addToast('Recurring commitment added.', 'success');
      }
      fetchData();
      if (onRecurringMutated) onRecurringMutated();
    } catch {
      addToast('Failed to save recurring commitment.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring expense?')) return;
    try {
      await recurringApi.delete(id);
      addToast('Commitment deleted.', 'info');
      fetchData();
      if (onRecurringMutated) onRecurringMutated();
    } catch {
      addToast('Failed to delete commitment.', 'error');
    }
  };

  const handleConfirmDetected = async (detected) => {
    try {
      await recurringApi.create({
        name: detected.name,
        amount: detected.amount,
        category: detected.category,
        frequency: detected.frequency,
        next_due_date: detected.estimated_next_date
      });
      addToast(`Added ${detected.name} to active recurring commitments!`, 'success');
      fetchData();
      if (onRecurringMutated) onRecurringMutated();
    } catch {
      addToast('Failed to add detected commitment.', 'error');
    }
  };

  const totalMonthlyCommitments = recurringList.reduce((acc, curr) => {
    const f = curr.frequency.toLowerCase();
    if (f === 'weekly') return acc + curr.amount * 4.33;
    if (f === 'quarterly') return acc + curr.amount / 3;
    if (f === 'yearly') return acc + curr.amount / 12;
    return acc + curr.amount;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Recurring Expenses & Subscriptions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your fixed commitments and detect hidden recurring charges.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring Commitment</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="p-5 rounded-2xl bg-iq-card border border-iq-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 font-medium">Estimated Monthly Fixed Commitments</span>
          <div className="text-3xl font-black text-white mt-1">
            {formatCurrency(totalMonthlyCommitments)}
            <span className="text-xs text-slate-400 font-normal"> / month</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 max-w-sm">
          These automated charges directly inform your <strong className="text-indigo-400">Financial Pressure Score</strong> and <strong className="text-indigo-400">Predicted Month-End Balance</strong>.
        </div>
      </div>

      {/* DETECTED RECURRING EXPENSES SECTION (Signature Feature) */}
      {detectedList.length > 0 && (
        <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 shadow-glow-indigo">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Potential Recurring Expenses Detected
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Pattern Recognition
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            Budget IQ analyzed your transaction intervals and flagged repeated charges. Confirm them with 1 click to track their due dates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {detectedList.map((d, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{d.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {Math.round(d.confidence * 100)}% match
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 mt-1">
                    {formatCurrency(d.amount)} • <span className="font-normal text-slate-400">{d.frequency}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {d.detected_reason}
                  </p>
                </div>

                <button
                  onClick={() => handleConfirmDetected(d)}
                  className="flex-shrink-0 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Recurring Expenses List */}
      <div className="rounded-2xl bg-iq-card border border-iq-border overflow-hidden shadow-xl">
        <div className="p-4 border-b border-iq-border bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Subscriptions & Commitments ({recurringList.length})
          </span>
        </div>

        <div className="divide-y divide-iq-border/50">
          {recurringList.map((item) => {
            const catStyle = getCategoryStyles(item.category);
            const isImminent = item.days_until_due <= 3;

            return (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}>
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{item.frequency}</span>
                      <span>•</span>
                      <span>Due: {formatDate(item.next_due_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-black text-white">{formatCurrency(item.amount)}</div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                        isImminent ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {formatDaysCountdown(item.days_until_due)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {recurringList.length === 0 && !isLoading && (
            <div className="p-12 text-center text-slate-400 text-sm">
              No recurring commitments recorded.
            </div>
          )}
        </div>
      </div>

      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
      />
    </div>
  );
}
