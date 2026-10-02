import axios from 'axios';
import {
  mockStorage,
  computeDashboardIntelligence,
  resetDemoStorage,
  realtimeEmitter,
  initStorageIfEmpty
} from './mockClientEngine';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('budget_iq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Check if response is HTML instead of JSON (typical when Firebase rewrites /api/* to index.html)
function isHtmlResponse(res) {
  return typeof res?.data === 'string' && res.data.trim().startsWith('<!doctype html') || res?.data?.includes?.('<html');
}

export const authApi = {
  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (isHtmlResponse(res)) throw new Error('HTML response from static hosting');
      return res;
    } catch {
      initStorageIfEmpty();
      const user = mockStorage.getUser();
      const token = 'mock_jwt_token_' + Date.now();
      // Broadcast real-time login notification
      const notifs = mockStorage.getNotifications();
      const loginNotif = {
        id: Date.now(),
        user_id: user.id,
        type: 'login',
        title: 'Real-Time Sign-In Detected',
        message: `Welcome back, ${user.name}! Live session initiated safely.`,
        severity: 'success',
        link_view: 'dashboard',
        is_read: false,
        created_at: new Date().toISOString()
      };
      notifs.unshift(loginNotif);
      mockStorage.setNotifications(notifs);
      realtimeEmitter.emit(loginNotif);

      return {
        data: {
          access_token: token,
          token_type: 'bearer',
          user: user
        }
      };
    }
  },

  register: async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      initStorageIfEmpty();
      const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        monthly_income: Number(userData.monthly_income || 35000),
        income_type: userData.income_type || 'Salary',
        expected_income_date: Number(userData.expected_income_date || 1),
        current_balance: Number(userData.current_balance || 24580),
        created_at: new Date().toISOString()
      };
      mockStorage.setUser(newUser);
      const token = 'mock_jwt_token_' + Date.now();
      return {
        data: {
          access_token: token,
          token_type: 'bearer',
          user: newUser
        }
      };
    }
  },

  getProfile: async () => {
    try {
      const res = await api.get('/auth/profile');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      initStorageIfEmpty();
      return { data: mockStorage.getUser() };
    }
  },

  updateProfile: async (userData) => {
    try {
      const res = await api.put('/auth/profile', userData);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const user = { ...mockStorage.getUser(), ...userData };
      mockStorage.setUser(user);
      return { data: user };
    }
  },
};

export const transactionsApi = {
  getAll: async (params) => {
    try {
      const res = await api.get('/transactions', { params });
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      initStorageIfEmpty();
      let txs = mockStorage.getTransactions();
      if (params?.category && params.category !== 'All') {
        txs = txs.filter(t => t.category.toLowerCase() === params.category.toLowerCase());
      }
      if (params?.transaction_type && params.transaction_type !== 'All') {
        txs = txs.filter(t => t.transaction_type.toLowerCase() === params.transaction_type.toLowerCase());
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        txs = txs.filter(t => (t.description || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q));
      }
      return { data: txs };
    }
  },

  getOne: (id) => api.get(`/transactions/${id}`),

  create: async (data) => {
    try {
      const res = await api.post('/transactions', data);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      initStorageIfEmpty();
      const txs = mockStorage.getTransactions();
      const newTx = { id: Date.now(), ...data };
      txs.unshift(newTx);
      mockStorage.setTransactions(txs);

      // Adjust user balance
      const user = mockStorage.getUser();
      if (user) {
        if (data.transaction_type === 'income') {
          user.current_balance += Number(data.amount);
        } else {
          user.current_balance -= Number(data.amount);
        }
        mockStorage.setUser(user);
      }

      // Check budget overrun for notifications
      if (data.transaction_type === 'expense') {
        const budgets = mockStorage.getBudgets();
        const b = budgets.find(bg => bg.category.toLowerCase() === data.category.toLowerCase());
        if (b) {
          const catTotal = txs.filter(t => t.category.toLowerCase() === b.category.toLowerCase() && t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
          if (catTotal > b.budget_amount) {
            const notif = {
              id: Date.now() + 1,
              type: 'budget_alert',
              title: `Budget Exceeded: ${b.category}`,
              message: `You spent ₹${catTotal.toLocaleString()} exceeding your ${b.category} budget (₹${b.budget_amount.toLocaleString()})!`,
              severity: 'critical',
              link_view: 'budgets',
              is_read: false,
              created_at: new Date().toISOString()
            };
            const notifs = mockStorage.getNotifications();
            notifs.unshift(notif);
            mockStorage.setNotifications(notifs);
            realtimeEmitter.emit(notif);
          }
        }
      }

      return { data: newTx };
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/transactions/${id}`, data);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const txs = mockStorage.getTransactions().map(t => t.id === id ? { ...t, ...data } : t);
      mockStorage.setTransactions(txs);
      return { data: { id, ...data } };
    }
  },

  delete: async (id) => {
    try {
      return await api.delete(`/transactions/${id}`);
    } catch {
      const txs = mockStorage.getTransactions().filter(t => t.id !== id);
      mockStorage.setTransactions(txs);
      return { data: true };
    }
  },
};

export const budgetsApi = {
  getAll: async (params) => {
    try {
      const res = await api.get('/budgets', { params });
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      initStorageIfEmpty();
      const budgets = mockStorage.getBudgets();
      const txs = mockStorage.getTransactions();
      const results = budgets.map(b => {
        const spent = txs.filter(t => t.category.toLowerCase() === b.category.toLowerCase() && t.transaction_type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const remaining = b.budget_amount - spent;
        const pct = b.budget_amount > 0 ? (spent / b.budget_amount) * 100 : 0;
        return {
          ...b,
          spent_amount: spent,
          remaining_amount: remaining,
          percentage_used: Math.round(pct),
          is_exceeded: spent > b.budget_amount,
          is_warning: pct >= 80 && spent <= b.budget_amount,
          status_message: spent > b.budget_amount
            ? `${b.category} budget exceeded by ₹${Math.abs(remaining).toLocaleString()}`
            : `₹${remaining.toLocaleString()} remaining for this month`
        };
      });
      return { data: results };
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/budgets', data);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const budgets = mockStorage.getBudgets();
      const existingIdx = budgets.findIndex(b => b.category.toLowerCase() === data.category.toLowerCase());
      if (existingIdx >= 0) {
        budgets[existingIdx] = { ...budgets[existingIdx], ...data };
      } else {
        budgets.push({ id: Date.now(), user_id: 1, ...data });
      }
      mockStorage.setBudgets(budgets);
      return { data: data };
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/budgets/${id}`, data);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const budgets = mockStorage.getBudgets().map(b => b.id === id ? { ...b, ...data } : b);
      mockStorage.setBudgets(budgets);
      return { data: { id, ...data } };
    }
  },

  delete: async (id) => {
    try {
      return await api.delete(`/budgets/${id}`);
    } catch {
      const budgets = mockStorage.getBudgets().filter(b => b.id !== id);
      mockStorage.setBudgets(budgets);
      return { data: true };
    }
  },
};

export const recurringApi = {
  getAll: async () => {
    try {
      const res = await api.get('/recurring-expenses');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      initStorageIfEmpty();
      const recurring = mockStorage.getRecurring();
      const today = new Date();
      return {
        data: recurring.map(r => {
          const daysLeft = Math.max(0, Math.ceil((new Date(r.next_due_date) - today) / (1000 * 60 * 60 * 24)));
          return {
            ...r,
            days_until_due: daysLeft,
            is_due_soon: daysLeft <= 5
          };
        })
      };
    }
  },

  getDetected: async () => {
    try {
      const res = await api.get('/recurring-expenses/detected');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      return {
        data: [
          {
            name: 'Amazon Prime',
            amount: 499,
            frequency: 'Monthly',
            confidence: 0.98,
            category: 'Subscriptions',
            estimated_next_date: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
            detected_reason: 'Detected 3 regular charges averaging ₹499 every ~30 days.'
          },
          {
            name: 'Cult.fit Gym',
            amount: 1500,
            frequency: 'Monthly',
            confidence: 0.95,
            category: 'Health',
            estimated_next_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            detected_reason: 'Detected 2 regular debits averaging ₹1,500 on the 15th.'
          }
        ]
      };
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/recurring-expenses', data);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const rec = mockStorage.getRecurring();
      const newRec = { id: Date.now(), user_id: 1, ...data };
      rec.push(newRec);
      mockStorage.setRecurring(rec);
      return { data: newRec };
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/recurring-expenses/${id}`, data);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const rec = mockStorage.getRecurring().map(r => r.id === id ? { ...r, ...data } : r);
      mockStorage.setRecurring(rec);
      return { data: { id, ...data } };
    }
  },

  delete: async (id) => {
    try {
      return await api.delete(`/recurring-expenses/${id}`);
    } catch {
      const rec = mockStorage.getRecurring().filter(r => r.id !== id);
      mockStorage.setRecurring(rec);
      return { data: true };
    }
  },
};

export const goalsApi = {
  getAll: async () => {
    try {
      const res = await api.get('/goals');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      initStorageIfEmpty();
      const goals = mockStorage.getGoals();
      return {
        data: goals.map(g => {
          const rem = Math.max(0, g.target_amount - g.saved_amount);
          const pct = Math.round((g.saved_amount / g.target_amount) * 100);
          return {
            ...g,
            remaining_amount: rem,
            progress_percentage: Math.min(100, pct),
            status_summary: rem === 0 ? 'Goal achieved! 🎉' : `₹${rem.toLocaleString()} remaining to complete milestone.`
          };
        })
      };
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/goals', data);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const goals = mockStorage.getGoals();
      const newGoal = { id: Date.now(), user_id: 1, ...data };
      goals.push(newGoal);
      mockStorage.setGoals(goals);
      return { data: newGoal };
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.put(`/goals/${id}`, data);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const goals = mockStorage.getGoals().map(g => g.id === id ? { ...g, ...data } : g);
      mockStorage.setGoals(goals);

      // Check milestone notification
      const updated = goals.find(g => g.id === id);
      if (updated && updated.target_amount > 0) {
        const pct = Math.round((updated.saved_amount / updated.target_amount) * 100);
        if (pct >= 100) {
          const notif = {
            id: Date.now(),
            type: 'goal_milestone',
            title: `Goal Achieved! 🏆 ${updated.name}`,
            message: `Congratulations! You reached your goal of ₹${updated.target_amount.toLocaleString()}!`,
            severity: 'success',
            link_view: 'goals',
            is_read: false,
            created_at: new Date().toISOString()
          };
          const notifs = mockStorage.getNotifications();
          notifs.unshift(notif);
          mockStorage.setNotifications(notifs);
          realtimeEmitter.emit(notif);
        }
      }

      return { data: { id, ...data } };
    }
  },

  delete: async (id) => {
    try {
      return await api.delete(`/goals/${id}`);
    } catch {
      const goals = mockStorage.getGoals().filter(g => g.id !== id);
      mockStorage.setGoals(goals);
      return { data: true };
    }
  },
};

export const analyticsApi = {
  getDashboard: async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      return { data: computeDashboardIntelligence() };
    }
  },

  getPressureScore: () => api.get('/analytics/pressure-score'),
  getForecast: () => api.get('/analytics/forecast'),
  getSpendingBehavior: () => api.get('/analytics/spending-behavior'),
  getFinancialHealth: () => api.get('/analytics/financial-health'),
  getInsights: () => api.get('/analytics/insights'),

  seedDemo: async () => {
    try {
      const res = await api.post('/analytics/seed-demo');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      resetDemoStorage();
      return { data: { message: 'Demo data loaded successfully!' } };
    }
  },

  resetDemo: async () => {
    try {
      const res = await api.post('/analytics/reset-demo');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      resetDemoStorage();
      return { data: { message: 'Demo scenario restored!' } };
    }
  },
};

export const notificationsApi = {
  getAll: async () => {
    try {
      const res = await api.get('/notifications');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      initStorageIfEmpty();
      const notifs = mockStorage.getNotifications();
      return {
        data: {
          unread_count: notifs.filter(n => !n.is_read).length,
          total_count: notifs.length,
          notifications: notifs
        }
      };
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await api.post(`/notifications/${id}/read`);
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const notifs = mockStorage.getNotifications().map(n => n.id === id ? { ...n, is_read: true } : n);
      mockStorage.setNotifications(notifs);
      return { data: { id, is_read: true } };
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await api.post('/notifications/mark-all-read');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const notifs = mockStorage.getNotifications().map(n => ({ ...n, is_read: true }));
      mockStorage.setNotifications(notifs);
      return { data: { message: 'All marked read' } };
    }
  },

  delete: async (id) => {
    try {
      return await api.delete(`/notifications/${id}`);
    } catch {
      const notifs = mockStorage.getNotifications().filter(n => n.id !== id);
      mockStorage.setNotifications(notifs);
      return { data: true };
    }
  },

  clearAll: async () => {
    try {
      return await api.delete('/notifications');
    } catch {
      mockStorage.setNotifications([]);
      return { data: true };
    }
  },

  sendTest: async () => {
    try {
      const res = await api.post('/notifications/test');
      if (isHtmlResponse(res)) throw new Error('HTML response');
      return res;
    } catch {
      const testNotif = {
        id: Date.now(),
        type: 'system',
        title: 'Real-Time Test Alert ⚡',
        message: 'Live notification pipeline is active and responsive!',
        severity: 'success',
        link_view: 'dashboard',
        is_read: false,
        created_at: new Date().toISOString()
      };
      const notifs = mockStorage.getNotifications();
      notifs.unshift(testNotif);
      mockStorage.setNotifications(notifs);
      realtimeEmitter.emit(testNotif);
      return { data: testNotif };
    }
  },

  getStreamUrl: (token) => `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token || '')}`,
};

export default api;
