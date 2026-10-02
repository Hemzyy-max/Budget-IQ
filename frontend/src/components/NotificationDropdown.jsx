import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Repeat,
  Trophy,
  Flame,
  Info,
  ExternalLink,
  Zap,
  X
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationDropdown({ onNavigate }) {
  const {
    notifications,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendTestNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'alerts'
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'alerts') return n.severity === 'warning' || n.severity === 'critical';
    return true;
  });

  const getIcon = (type, severity) => {
    if (type === 'login') return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    if (type === 'budget_alert') return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    if (type === 'bill_reminder') return <Repeat className="w-4 h-4 text-amber-400" />;
    if (type === 'goal_milestone') return <Trophy className="w-4 h-4 text-cyan-400" />;
    if (type === 'pressure_alert') return <Flame className="w-4 h-4 text-orange-400" />;
    if (severity === 'critical') return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    return <Sparkles className="w-4 h-4 text-indigo-400" />;
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Just now';
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleCardClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.link_view && onNavigate) {
      onNavigate(notif.link_view);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="Real-Time Notifications"
        className={`relative p-2.5 rounded-xl border transition-all ${
          isOpen
            ? 'bg-slate-800 border-indigo-500/50 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
        }`}
      >
        <Bell className={`w-4.5 h-4.5 ${unreadCount > 0 ? 'text-indigo-400 animate-pulse' : ''}`} />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white shadow-glow-indigo animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors sm:hidden"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'alerts', label: 'Alerts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No notifications matching this filter.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleCardClick(notif)}
                  className={`p-3.5 transition-all flex items-start gap-3 cursor-pointer group hover:bg-slate-800/60 ${
                    !notif.is_read ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Type Icon */}
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 flex-shrink-0 mt-0.5">
                    {getIcon(notif.type, notif.severity)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-white truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                      {notif.message}
                    </p>

                    {/* View Link hint if available */}
                    {notif.link_view && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-400 font-semibold group-hover:text-indigo-300">
                        <span>View {notif.link_view}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Right side: Unread Dot + Delete Button */}
                  <div className="flex flex-col items-center justify-between self-stretch flex-shrink-0">
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-glow-indigo mt-1" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      title="Delete"
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={sendTestNotification}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold transition-all"
            >
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>Test Live Alert</span>
            </button>

            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-[11px] text-slate-500 hover:text-rose-400 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
