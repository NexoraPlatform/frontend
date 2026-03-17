import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '@/contexts/notification-context';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    getNotifications: vi.fn(),
    getUnreadNotificationsCount: vi.fn(),
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    subscribeToNotifications: vi.fn(),
    unsubscribeFromNotifications: vi.fn(),
  },
}));

vi.mock('pusher-js', () => {
  const Pusher = function Pusher() {};
  (Pusher as any).Runtime = {};
  return { default: Pusher };
});

vi.mock('laravel-echo', () => {
  return {
    default: class EchoMock {
      private channels: Record<string, any> = {};
      private(name: string) {
        if (!this.channels[name]) {
          this.channels[name] = {
            notification: vi.fn(),
          };
        }
        return this.channels[name];
      }
      leave(name: string) {
        delete this.channels[name];
      }
    },
  };
});

vi.mock('sonner', () => ({
  toast: {
    custom: vi.fn(),
  },
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'ro',
}));

describe('contexts/notification-context', () => {
  const mockedUseAuth = useAuth as unknown as vi.Mock;
  const mockedApi = apiClient as unknown as {
    getNotifications: vi.Mock;
    getUnreadNotificationsCount: vi.Mock;
    markNotificationAsRead: vi.Mock;
  };

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ user: { id: '1', language: 'ro' }, refreshUser: vi.fn() });
    mockedApi.getUnreadNotificationsCount.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads notifications on mount and sets unread count', async () => {
    mockedApi.getNotifications.mockResolvedValueOnce({
      data: [
        {
          id: 'n1',
          type: 'App\\Notifications\\ChatMessage',
          data: { title: 'Hello', message: 'World', type: 'chat.message' },
          created_at: '2025-01-01T10:00:00Z',
          read_at: null,
        },
      ],
      nextCursor: 'c1',
      hasMore: true,
      unreadCount: 1,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.hasMore).toBe(true);
    expect(mockedApi.getNotifications).toHaveBeenCalledWith({ limit: 20, language: 'ro' });
  });

  it('markAsRead updates item and decrements unreadCount', async () => {
    mockedApi.getNotifications.mockResolvedValueOnce({
      data: [
        {
          id: 'n1',
          type: 'App\\Notifications\\ChatMessage',
          data: { title: 'Hello', message: 'World', type: 'chat.message' },
          created_at: '2025-01-01T10:00:00Z',
          read_at: null,
        },
      ],
      nextCursor: null,
      hasMore: false,
      unreadCount: 1,
    });
    mockedApi.getUnreadNotificationsCount.mockResolvedValueOnce({ count: 1 });

    mockedApi.markNotificationAsRead.mockResolvedValueOnce({ ok: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(mockedApi.markNotificationAsRead).toHaveBeenCalledWith('n1');
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications[0].isRead).toBe(true);
  });

  it('loadMore merges without duplicates', async () => {
    mockedApi.getNotifications
      .mockResolvedValueOnce({
        data: [
          {
            id: 'n1',
            type: 'App\\Notifications\\ChatMessage',
            data: { title: 'First', message: 'One', type: 'chat.message' },
            created_at: '2025-01-01T10:00:00Z',
            read_at: null,
          },
        ],
        nextCursor: 'c1',
        hasMore: true,
        unreadCount: 1,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'n1',
            type: 'App\\Notifications\\ChatMessage',
            data: { title: 'First', message: 'One', type: 'chat.message' },
            created_at: '2025-01-01T10:00:00Z',
            read_at: null,
          },
          {
            id: 'n2',
            type: 'App\\Notifications\\System',
            data: { title: 'Second', message: 'Two' },
            created_at: '2025-01-01T11:00:00Z',
            read_at: null,
          },
        ],
        nextCursor: null,
        hasMore: false,
        unreadCount: 2,
      });
    mockedApi.getUnreadNotificationsCount.mockResolvedValueOnce({ count: 1 });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.notifications.map(n => n.id).sort()).toEqual(['n1', 'n2']);
  });
});
