import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi, analyticsApi } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('budget_iq_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoginTime, setLastLoginTime] = useState(localStorage.getItem('budget_iq_last_login'));
  const { addToast } = useToast();
  const broadcastChannelRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      setUser(res.data);
    } catch {
      localStorage.removeItem('budget_iq_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Multi-tab real-time authentication synchronization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('budget_iq_auth_sync');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, token: newToken, user: newUser } = event.data || {};
        if (type === 'LOGIN') {
          setToken(newToken);
          setUser(newUser);
          addToast(`Session synchronized across tabs.`, 'info');
        } else if (type === 'LOGOUT') {
          setToken(null);
          setUser(null);
          addToast('Signed out from another browser tab.', 'info');
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [addToast]);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchProfile]);

  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      const { access_token, user: userData } = res.data;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      localStorage.setItem('budget_iq_token', access_token);
      localStorage.setItem('budget_iq_last_login', nowStr);
      setToken(access_token);
      setUser(userData);
      setLastLoginTime(nowStr);

      // Broadcast real-time login to other open tabs
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'LOGIN',
          token: access_token,
          user: userData,
        });
      }

      addToast(`Welcome back, ${userData.name}!`, 'success');
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check credentials.';
      addToast(msg, 'error');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authApi.register(userData);
      const { access_token, user: newUser } = res.data;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      localStorage.setItem('budget_iq_token', access_token);
      localStorage.setItem('budget_iq_last_login', nowStr);
      setToken(access_token);
      setUser(newUser);
      setLastLoginTime(nowStr);

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'LOGIN',
          token: access_token,
          user: newUser,
        });
      }

      addToast('Account created successfully!', 'success');
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      addToast(msg, 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('budget_iq_token');
    localStorage.removeItem('budget_iq_last_login');
    setToken(null);
    setUser(null);
    setLastLoginTime(null);

    // Broadcast real-time logout to other tabs
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'LOGOUT' });
    }

    addToast('Signed out safely.', 'info');
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const seedAndLoginDemo = async () => {
    setIsLoading(true);
    try {
      await analyticsApi.seedDemo();
      const res = await authApi.login('demo@budgetiq.app', 'password123');
      const { access_token, user: demoUser } = res.data;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      localStorage.setItem('budget_iq_token', access_token);
      localStorage.setItem('budget_iq_last_login', nowStr);
      setToken(access_token);
      setUser(demoUser);
      setLastLoginTime(nowStr);

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'LOGIN',
          token: access_token,
          user: demoUser,
        });
      }

      addToast('Realistic Demo loaded! Welcome to Budget IQ.', 'success');
      return true;
    } catch (err) {
      console.error(err);
      addToast('Could not load demo scenario. Please check backend connection.', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        lastLoginTime,
        login,
        register,
        logout,
        updateUser,
        fetchProfile,
        seedAndLoginDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
