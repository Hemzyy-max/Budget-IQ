import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, RefreshCw, Sparkles, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi, analyticsApi } from '../services/api';

export default function ProfilePage({ onProfileUpdated }) {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthly_income ?? 35000);
  const [incomeType, setIncomeType] = useState(user?.income_type || 'Salary');
  const [payday, setPayday] = useState(user?.expected_income_date ?? 1);
  const [currentBalance, setCurrentBalance] = useState(user?.current_balance ?? 24580);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Synchronize form inputs whenever user profile is fetched or updated
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMonthlyIncome(user.monthly_income ?? 35000);
      setIncomeType(user.income_type || 'Salary');
      setPayday(user.expected_income_date ?? 1);
      setCurrentBalance(user.current_balance ?? 24580);
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({
        name,
        monthly_income: parseFloat(monthlyIncome),
        income_type: incomeType,
        expected_income_date: parseInt(payday),
        current_balance: parseFloat(currentBalance)
      });
      updateUser(res.data);
      addToast('Profile configuration updated!', 'success');
      if (onProfileUpdated) onProfileUpdated();
    } catch {
      addToast('Failed to update profile settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo data to initial realistic 3-month baseline?')) return;
    setIsResetting(true);
    try {
      const res = await analyticsApi.resetDemo();
      addToast(res.data.message || 'Demo data restored!', 'success');
      if (onProfileUpdated) onProfileUpdated();
    } catch {
      addToast('Could not reset demo.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Profile & Cash Flow Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure your baseline income frequency, expected payday, and financial buffer parameters.
        </p>
      </div>

      {/* Account Settings Form */}
      <form onSubmit={handleUpdate} className="p-6 rounded-2xl bg-iq-card border border-iq-border space-y-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email (Read Only)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-iq-border grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expected Monthly Income (₹)</label>
            <input
              type="number"
              step="100"
              min="0"
              required
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-bold text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Income Type</label>
            <select
              value={incomeType}
              onChange={(e) => setIncomeType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="Salary">Salary (Fixed Monthly)</option>
              <option value="Freelance">Freelance / Contract</option>
              <option value="Business">Business Revenue</option>
              <option value="Allowance">Student Allowance / Stipend</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expected Payday (Day of Month)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                max="31"
                required
                value={payday}
                onChange={(e) => setPayday(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Directly calibrates the Pressure Timeline.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Liquid Balance (₹)</label>
            <input
              type="number"
              step="1"
              required
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-bold text-xs focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Starting balance for cash-flow projection.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-iq-border flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Demo Reset Card for Hackathon Judges */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Reset Hackathon Demo Baseline</h3>
          </div>
          <p className="text-xs text-slate-400">
            Re-seeds 3 months of realistic transactions, food spending surge (+32%), upcoming recurring bills, and baseline balance.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{isResetting ? 'Restoring...' : 'Reset Demo Scenario'}</span>
        </button>
      </div>
    </div>
  );
}
