'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiBell, FiCheck, FiLogOut, FiTrash2, FiX } from 'react-icons/fi';
import { FiSearch } from 'react-icons/fi';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { fetchCracks } from '@/lib/api-client';
import type { Crack } from '@/lib/types';

interface NotificationState {
  readIds: string[];
  dismissedIds: string[];
}

function notificationStorageKey(userId: string) {
  return `dpwh-notifications:${userId}`;
}

function formatNotificationDate(date: Date | string) {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? 'Recently' : parsedDate.toLocaleString();
}

export default function Navbar() {
  const router = useRouter();
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Crack[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) console.error('Unable to load account profile:', error);
      if (isMounted) setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setReadNotificationIds([]);
      setDismissedNotificationIds([]);
      return;
    }

    let isMounted = true;
    const storageKey = notificationStorageKey(user.id);
    try {
      const storedState = localStorage.getItem(storageKey);
      const parsedState = storedState ? JSON.parse(storedState) as Partial<NotificationState> : {};
      setReadNotificationIds(Array.isArray(parsedState.readIds) ? parsedState.readIds : []);
      setDismissedNotificationIds(Array.isArray(parsedState.dismissedIds) ? parsedState.dismissedIds : []);
    } catch (error) {
      console.error('Unable to load notification state:', error);
      setReadNotificationIds([]);
      setDismissedNotificationIds([]);
    }

    setLoadingNotifications(true);
    setNotificationError('');
    fetchCracks({ limit: 20 })
      .then((cracks) => {
        if (isMounted) setNotifications(cracks);
      })
      .catch((error) => {
        console.error('Unable to load notifications:', error);
        if (isMounted) setNotificationError('Notifications could not be loaded.');
      })
      .finally(() => {
        if (isMounted) setLoadingNotifications(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!notificationsOpen) return;

    function closePanel(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        setNotificationsOpen(false);
      } else if (event instanceof PointerEvent && !notificationPanelRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('pointerdown', closePanel);
    document.addEventListener('keydown', closePanel);
    return () => {
      document.removeEventListener('pointerdown', closePanel);
      document.removeEventListener('keydown', closePanel);
    };
  }, [notificationsOpen]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Unable to sign out:', error);
    } finally {
      router.replace('/login');
    }
  }

  const displayName = typeof user?.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : user?.email ?? 'Signed out';
  const role = typeof user?.app_metadata?.role === 'string'
    ? user.app_metadata.role
    : 'User';
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const visibleNotifications = notifications.filter((notification) => !dismissedNotificationIds.includes(notification.id));
  const unreadCount = visibleNotifications.filter((notification) => !readNotificationIds.includes(notification.id)).length;

  function saveNotificationState(nextState: NotificationState) {
    if (!user) return;
    localStorage.setItem(notificationStorageKey(user.id), JSON.stringify(nextState));
  }

  function markNotificationAsRead(notificationId: string) {
    const nextReadIds = Array.from(new Set([...readNotificationIds, notificationId]));
    setReadNotificationIds(nextReadIds);
    saveNotificationState({ readIds: nextReadIds, dismissedIds: dismissedNotificationIds });
  }

  function markAllNotificationsAsRead() {
    const nextReadIds = Array.from(new Set([
      ...readNotificationIds,
      ...visibleNotifications.map((notification) => notification.id),
    ]));
    setReadNotificationIds(nextReadIds);
    saveNotificationState({ readIds: nextReadIds, dismissedIds: dismissedNotificationIds });
  }

  function deleteNotification(notificationId: string) {
    const nextDismissedIds = Array.from(new Set([...dismissedNotificationIds, notificationId]));
    setDismissedNotificationIds(nextDismissedIds);
    saveNotificationState({ readIds: readNotificationIds, dismissedIds: nextDismissedIds });
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Left Side */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="DPWH logo" width={64} height={64} priority unoptimized className="h-16 w-16 object-contain" />
          <h1 className="text-2xl font-bold text-primary-600">DPWH</h1>
        </div>
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search cracks, locations..."
            className="bg-transparent ml-2 outline-none text-sm w-48"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-6">
        {/* Notifications */}
        <div ref={notificationPanelRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((isOpen) => !isOpen)}
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            aria-expanded={notificationsOpen}
            aria-controls="notification-panel"
            title="Notifications"
            className="relative flex h-10 w-10 items-center justify-center text-gray-600 transition hover:text-primary-600"
          >
            <FiBell size={20} aria-hidden="true" />
            {unreadCount > 0 && <span aria-hidden="true" className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-secondary-500" />}
          </button>

          {notificationsOpen && (
            <section
              id="notification-panel"
              aria-label="Notifications"
              className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden border border-gray-200 bg-white shadow-xl"
            >
              <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
                  <p className="mt-0.5 text-xs text-gray-500">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p>
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close notifications"
                    className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </div>
              </header>

              <div className="max-h-[min(26rem,70vh)] overflow-y-auto">
                {loadingNotifications ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">Loading notifications...</p>
                ) : notificationError ? (
                  <p role="status" className="px-4 py-8 text-center text-sm text-gray-500">{notificationError}</p>
                ) : visibleNotifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">No recent crack reports.</p>
                ) : (
                  visibleNotifications.map((notification) => {
                    const isRead = readNotificationIds.includes(notification.id);
                    return (
                      <article key={notification.id} className={`flex gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 ${isRead ? '' : 'bg-primary-50/70'}`}>
                        <FiAlertCircle aria-hidden="true" className={`mt-0.5 shrink-0 ${notification.severity === 'critical' || notification.severity === 'high' ? 'text-secondary-500' : 'text-primary-600'}`} />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/cracks/${notification.id}`}
                            onClick={() => setNotificationsOpen(false)}
                            className="block text-sm font-medium text-gray-900 hover:text-primary-700"
                          >
                            {notification.severity.charAt(0).toUpperCase() + notification.severity.slice(1)} {notification.crackType} crack reported
                          </Link>
                          <p className="mt-1 truncate text-xs text-gray-600">{notification.location}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatNotificationDate(notification.detectedAt)}</p>
                        </div>
                        <div className="flex shrink-0 items-start gap-1">
                          {!isRead && (
                            <button
                              type="button"
                              onClick={() => markNotificationAsRead(notification.id)}
                              aria-label="Mark notification as read"
                              title="Mark as read"
                              className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-primary-100 hover:text-primary-700"
                            >
                              <FiCheck aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteNotification(notification.id)}
                            aria-label="Delete notification"
                            title="Delete notification"
                            className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-700"
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </div>

        {/* User Menu */}
        <Link href="/settings" aria-label="Profile and settings" className="flex items-center space-x-3 border-l border-gray-200 pl-6">
          <div className="text-right hidden sm:block">
            <p className="max-w-52 truncate text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs capitalize text-gray-500">{role}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 font-bold text-white">
            {avatarInitial}
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Log out"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-secondary-600 disabled:cursor-wait disabled:opacity-60"
        >
          <FiLogOut size={18} aria-hidden="true" />
          <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
        </button>
      </div>
    </nav>
  );
}
