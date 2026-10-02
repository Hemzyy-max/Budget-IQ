import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Repeat,
  Target,
  Lightbulb,
  User,
  LogOut,
  Plus,
  Sparkles,
  RefreshCw,
  Menu,
  X,
  Flame,
  Trophy,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { analyticsApi } from '../services/api';
import NotificationDropdown from '../components/NotificationDropdown';

function StreakBadge({ streak }) {
  if (!streak || streak.streak_status === 'inactive') return null;

  const count = streak.current_streak;
  const best = streak.best_streak;
  const status = streak.streak_status;

  // Dynamic colors and icon based on streak status
  const config = {
    legendary: {
      bg: 'from-amber-500/20 to-yellow-500/20',
      border: 'border-amber-500/40',
      text: 'text-amber-300',
      icon: Trophy,
      glow: 'shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]',
      pulse: true,
    },
    on_fire: {
      bg: 'from-orange-500/15 to-red-500/15',
      border: 'border-orange-500/35',
      text: 'text-orange-300',
      icon: Flame,
      glow: 'shadow-[0_0_16px_-5px_rgba(249,115,22,0.35)]',
      pulse: true,
    },
    strong: {
      bg: 'from-emerald-500/15 to-green-500/15',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
      icon: Zap,
      glow: '',
      pulse: false,
    },
    building: {
      bg: 'from-indigo-500/15 to-violet-500/15',
      border: 'border-indigo-500/30',
      text: 'text-indigo-300',
      icon: Star,
      glow: '',
      pulse: false,
    },
    starting: {
      bg: 'from-sky-500/10 to-cyan-500/10',
      border: 'border-sky-500/25',
      text: 'text-sky-300',
      icon: Flame,
      glow: '',
      pulse: false,
    },
    broken: {
      bg: 'from-slate-700/20 to-slate-800/20',
      border: 'border-slate-700/30',
      text: 'text-slate-400',
      icon: Flame,
      glow: '',
      pulse: false,
    },
  };

  const c = config[status] || config.broken;
  const Icon = c.icon;

  return (
    <div className={`p-3 rounded-xl bg-gradient-to-r ${c.bg} border ${c.border} ${c.glow} transition-all`}>
      <div className="flex items-center gap-2.5">
        <div className={`relative flex items-center justify-center ${c.pulse ? 'animate-streak-pulse' : ''}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-black ${c.text} tabular-nums leading-none`}>
              {count}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              day{count !== 1 ? 's' : ''} streak
            </span>
          </div>
          {best > 0 && (
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5" />
              <span>Best: {best} days</span>
            </div>
          )}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 leading-snug line-clamp-2">
        {streak.streak_message}
      </p>
    </div>
  );
}

export default function AppLayout({ currentView, setCurrentView, onOpenAddTransaction, children, onRefreshData, budgetStreak }) {
  const { user, logout, seedAndLoginDemo } = useAuth();
  const { addToast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'recurring', label: 'Recurring Bills', icon: Repeat },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'insights', label: 'Insights Feed', icon: Lightbulb },
    { id: 'profile', label: 'Profile Settings', icon: User },
  ];

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await analyticsApi.resetDemo();
      addToast('Realistic Demo scenario restored!', 'success');
      if (onRefreshData) onRefreshData();
    } catch {
      addToast('Failed to reset demo.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-iq-darkest text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-iq-border bg-iq-card flex-shrink-0 z-30">
        {/* Brand */}
        <div className="p-6 border-b border-iq-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-glow-indigo text-white font-black text-base">
              IQ
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-lg">BUDGET<span className="text-indigo-400">.IQ</span></span>
              <span className="block text-[10px] tracking-wider uppercase font-semibold text-slate-400">Predictive Finance</span>
            </div>
          </div>
        </div>

        {/* Budget Streak Badge - Top Left */}
        <div className="px-3 pt-3">
          <StreakBadge streak={budgetStreak} />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Demo Controller Badge */}
        <div className="p-4 m-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">Hackathon Demo</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug mb-3">
            Reset or reload 3-month realistic financial scenario.
          </p>
          <button
            onClick={handleResetDemo}
            disabled={isResetting}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
          </button>
        </div>

        {/* User Account Info */}
        <div className="p-4 border-t border-iq-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Demo User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@budgetiq.app'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 iq-glass-header px-6 py-3.5 flex items-center justify-between">
          {/* Mobile Menu Button & Brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-extrabold text-white text-base">BUDGET<span className="text-indigo-400">.IQ</span></span>
            {/* Mobile Streak Mini Badge */}
            {budgetStreak && budgetStreak.current_streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/15 border border-orange-500/25">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-xs font-bold text-orange-300">{budgetStreak.current_streak}</span>
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <h1 className="text-sm font-bold text-white uppercase tracking-wider capitalize">
              {currentView.replace('-', ' ')}
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <NotificationDropdown onNavigate={setCurrentView} />
            <button
              onClick={onOpenAddTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-md pt-16 px-4">
            {/* Mobile Streak Badge */}
            {budgetStreak && (
              <div className="mb-4">
                <StreakBadge streak={budgetStreak} />
              </div>
            )}
            <nav className="space-y-1 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-slate-800"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
