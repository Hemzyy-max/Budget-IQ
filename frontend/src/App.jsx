import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { analyticsApi, transactionsApi } from './services/api';

import AppLayout from './layouts/AppLayout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import RecurringPage from './pages/RecurringPage';
import GoalsPage from './pages/GoalsPage';
import InsightsPage from './pages/InsightsPage';
import ProfilePage from './pages/ProfilePage';
import TransactionModal from './components/TransactionModal';

function MainApp() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [currentView, setCurrentView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isGlobalAddTxOpen, setIsGlobalAddTxOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingDashboard(true);
    try {
      const res = await analyticsApi.getDashboard();
      setDashboardData(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, fetchDashboard]);

  const handleGlobalAddTransaction = async (txData) => {
    try {
      await transactionsApi.create(txData);
      addToast('Transaction recorded & financial intelligence updated!', 'success');
      // Instantly trigger dynamic recalculation chain!
      await fetchDashboard();
    } catch {
      addToast('Could not record transaction.', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-iq-darkest flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-lg shadow-glow-indigo animate-pulse">
            IQ
          </div>
          <span className="text-xs font-semibold text-slate-400 mt-2">Loading Budget IQ...</span>
          <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <AppLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      onOpenAddTransaction={() => setIsGlobalAddTxOpen(true)}
      onRefreshData={fetchDashboard}
      budgetStreak={dashboardData?.budget_streak}
    >
      {currentView === 'dashboard' && (
        <DashboardPage
          dashboardData={dashboardData}
          isLoading={isLoadingDashboard}
          onRefresh={fetchDashboard}
          onOpenAddTransaction={() => setIsGlobalAddTxOpen(true)}
          onNavigate={setCurrentView}
        />
      )}

      {currentView === 'transactions' && (
        <TransactionsPage onTransactionMutated={fetchDashboard} />
      )}

      {currentView === 'budgets' && (
        <BudgetsPage onBudgetMutated={fetchDashboard} />
      )}

      {currentView === 'recurring' && (
        <RecurringPage onRecurringMutated={fetchDashboard} />
      )}

      {currentView === 'goals' && (
        <GoalsPage onGoalMutated={fetchDashboard} />
      )}

      {currentView === 'insights' && (
        <InsightsPage insights={dashboardData?.insights || []} />
      )}

      {currentView === 'profile' && (
        <ProfilePage onProfileUpdated={fetchDashboard} />
      )}

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={isGlobalAddTxOpen}
        onClose={() => setIsGlobalAddTxOpen(false)}
        onSave={handleGlobalAddTransaction}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
