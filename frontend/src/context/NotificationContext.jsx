import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { realtimeEmitter } from '../services/mockClientEngine';

const NotificationContext = createContext(null);

// Gentle modern chime synthesizer via Web Audio API (no external MP3/WAV file needed!)
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Elegant two-tone bell chime: D5 (587.33Hz) -> A5 (880Hz)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    // Audio autoplay restrictions gracefully handled
  }
}

export function NotificationProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const { addToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const eventSourceRef = useRef(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.getAll();
      const list = res.data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [isAuthenticated]);

  // Handle incoming live notification
  const handleIncomingNotification = useCallback((notif) => {
    setNotifications((prev) => {
      // Prevent duplicates
      if (prev.some(n => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });

    if (!notif.is_read) {
      setUnreadCount((prev) => prev + 1);
    }

    // Play subtle audio chime
    if (soundEnabled) {
      playNotificationChime();
    }

    // Show instant toast notification on screen
    addToast(`${notif.title}: ${notif.message}`, notif.severity || 'info');

    // Native Web Push Notification (if permitted)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Budget IQ: ${notif.title}`, {
          body: notif.message,
          icon: '/favicon.ico',
        });
      } catch {}
    }
  }, [soundEnabled, addToast]);

  // Connect SSE or fallback listener
  useEffect(() => {
    if (!isAuthenticated) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // 1. Try real Server-Sent Events stream from backend
    let sseConnected = false;
    try {
      const streamUrl = notificationsApi.getStreamUrl(token);
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        sseConnected = true;
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connection') {
            setIsConnected(true);
          } else {
            handleIncomingNotification(data);
          }
        } catch (err) {
          console.error('Failed to parse SSE notification:', err);
        }
      };

      es.onerror = () => {
        // SSE disconnected (e.g. static hosting or backend offline)
        setIsConnected(true); // Fallback real-time mode active
        es.close();
      };
    } catch {
      setIsConnected(true);
    }

    // 2. Also register client-side real-time event listener (for fallback mode or cross-module events)
    const unsubscribeEmitter = realtimeEmitter.subscribe((notif) => {
      handleIncomingNotification(notif);
    });

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      unsubscribeEmitter();
    };
  }, [isAuthenticated, token, fetchNotifications, handleIncomingNotification]);

  const markAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      addToast('All notifications marked as read.', 'info');
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => {
        const target = prev.find(n => n.id === id);
        if (target && !target.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      addToast('All notifications cleared.', 'info');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const sendTestNotification = async () => {
    try {
      const res = await notificationsApi.sendTest();
      if (res.data) {
        handleIncomingNotification(res.data);
      }
    } catch (err) {
      console.error('Failed to send test notification:', err);
    }
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addToast('Browser notifications enabled!', 'success');
      }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        soundEnabled,
        setSoundEnabled,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        sendTestNotification,
        fetchNotifications,
        requestBrowserPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
