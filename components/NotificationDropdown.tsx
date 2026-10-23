'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToUserChannel } from '@/lib/realtime-client';
import {
  Bell,
  Check,
  CheckCheck,
  CheckSquare,
  Users,
  ShieldAlert,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationDropdown({ userId }: { userId?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadedRef = useRef<boolean>(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const list: NotificationItem[] = data.notifications || [];
        setNotifications(list);
        setUnreadCount(data.unreadCount || 0);
        list.forEach((n) => knownIdsRef.current.add(n.id));
        initialLoadedRef.current = true;
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();

      // Silent background poll every 4s
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/notifications');
          if (res.ok) {
            const data = await res.json();
            const list: NotificationItem[] = data.notifications || [];
            
            // Trigger desktop notification for any newly received unread notification
            if (initialLoadedRef.current) {
              list.forEach((item) => {
                if (!knownIdsRef.current.has(item.id) && !item.read) {
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                      new Notification(item.title, {
                        body: item.content,
                        icon: '/favicon.ico',
                      });
                    } catch {
                      // ignore
                    }
                  }
                }
              });
            }

            list.forEach((n) => knownIdsRef.current.add(n.id));
            setNotifications(list);
            setUnreadCount(data.unreadCount || 0);
          }
        } catch {
          // ignore
        }
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  // Real-time listener for incoming notifications
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserChannel(userId, {
      'notification:created': (newNotif: NotificationItem) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Optional browser desktop notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotif.title, {
            body: newNotif.content,
            icon: '/favicon.ico',
          });
        }
      },
    });

    return unsubscribe;
  }, [userId]);

  const [hasDesktopPermission, setHasDesktopPermission] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasDesktopPermission(Notification.permission === 'granted');
    }
  }, []);

  // Request browser desktop notification permission
  const requestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setHasDesktopPermission(permission === 'granted');
        if (permission === 'granted') {
          new Notification('TaskFlow Push Alerts Enabled!', {
            body: 'You will now receive live desktop alerts for tasks and team invitations.',
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark single notification as read
  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Handle clicking anywhere on the notification or "View Details"
  const handleNotificationClick = (notif: NotificationItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!notif.read) {
      markAsRead(notif.id);
    }

    setIsOpen(false);

    if (notif.link) {
      router.push(notif.link);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('notification:navigate', {
            detail: { link: notif.link },
          }),
        );
      }
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <CheckSquare className="h-4 w-4" />
          </span>
        );
      case 'TEAM_INVITE':
        return (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Users className="h-4 w-4" />
          </span>
        );
      case 'ROLE_UPDATED':
        return (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <ShieldAlert className="h-4 w-4" />
          </span>
        );
      default:
        return (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <Info className="h-4 w-4" />
          </span>
        );
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          requestDesktopPermission();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600 focus:outline-none shadow-xs cursor-pointer"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel - Wide & Clear */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-[420px] rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Desktop Push Notification Permission Banner (Bonus Feature) */}
          {!hasDesktopPermission && (
            <div className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50/80 px-5 py-2.5 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-indigo-950 font-semibold">
                <Bell className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Enable Browser Push Notifications</span>
              </div>
              <button
                type="button"
                onClick={requestDesktopPermission}
                className="cursor-pointer rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-[11px] font-bold text-white shadow-2xs transition-colors"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications List */}

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
                  You will receive real-time alerts when assigned tasks or invited to teams.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={(e) => handleNotificationClick(notif, e)}
                  className={`group flex items-start gap-3.5 p-4 transition-colors cursor-pointer ${
                    notif.read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                  }`}
                >
                  {getIconForType(notif.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${notif.read ? 'text-slate-700' : 'text-slate-900 group-hover:text-indigo-600'}`}>
                        {notif.title}
                      </p>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.content}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between">
                      {notif.link ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-800 group-hover:underline"
                        >
                          <span>View Details</span>
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      ) : (
                        <span />
                      )}

                      {!notif.read && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id, e);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 font-semibold cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))

            )}
          </div>
        </div>
      )}
    </div>
  );
}
