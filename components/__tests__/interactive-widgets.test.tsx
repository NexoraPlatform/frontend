import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { NotificationBell } from '@/components/notification-bell';
import { SearchBar } from '@/components/search-bar';
import { ChatButton } from '@/components/chat/chat-button';
import { useNotifications } from '@/contexts/notification-context';
import { useChat } from '@/contexts/chat-context';
import { useAuth } from '@/contexts/auth-context';

const routerPush = vi.fn();

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: { count?: number }) =>
    values?.count != null ? `${key}:${values.count}` : key,
}));

vi.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('@/contexts/notification-context', () => ({
  useNotifications: vi.fn(),
  resolveNotificationLink: vi.fn(() => '/dashboard?tab=messages'),
}));

vi.mock('@/contexts/chat-context', () => ({
  useChat: vi.fn(),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    getTrendingSearches: vi.fn().mockResolvedValue({ trending: [] }),
    getSearchSuggestions: vi.fn().mockResolvedValue({ suggestions: [] }),
  },
}));

describe('Interactive widgets', () => {
  beforeEach(() => {
    routerPush.mockReset();
  });

  it('NotificationBell shows unread badge and navigates on click', async () => {
    const markAsRead = vi.fn().mockResolvedValue(undefined);
    (useNotifications as unknown as vi.Mock).mockReturnValue({
      notifications: [
        {
          id: 'n1',
          type: 'chat.message',
          title: 'Hello',
          message: 'World',
          isRead: false,
          createdAt: '2025-01-01T10:00:00Z',
          readAt: null,
          category: 'message',
          projectId: null,
          payload: {},
          groupId: null,
          link: null,
          notificationType: 'chat.message',
          data: {},
        },
      ],
      unreadCount: 1,
      markAsRead,
      markAllAsRead: vi.fn(),
      isWebPushSupported: true,
      isWebPushEnabled: false,
      webPushPermission: 'granted',
      enableWebPush: vi.fn(),
      disableWebPush: vi.fn(),
      loading: false,
      loadingMore: false,
      hasMore: false,
      refresh: vi.fn(),
      loadMore: vi.fn(),
    });

    render(<NotificationBell />);

    expect(screen.getByText('1')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('common.notifications.open_aria'));

    const title = await screen.findByText('Hello');
    fireEvent.click(title);

    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith('n1');
    });

    expect(routerPush).toHaveBeenCalledWith('/dashboard?tab=messages');
  });

  it('SearchBar calls onSearch and stores recent searches', async () => {
    const onSearch = vi.fn();
    localStorage.clear();

    render(<SearchBar onSearch={onSearch} showSuggestions={false} />);

    const input = screen.getByPlaceholderText('common.search_bar.placeholder');
    fireEvent.change(input, { target: { value: 'react dev' } });

    const btn = screen.getByText('common.search_bar.search_button');
    fireEvent.click(btn);

    expect(onSearch).toHaveBeenCalledWith('react dev');

    const stored = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    expect(stored).toContain('react dev');
  });

  it('ChatButton marks all unread groups as read', async () => {
    const markAsRead = vi.fn().mockResolvedValue(undefined);
    (useChat as unknown as vi.Mock).mockReturnValue({
      groups: [
        {
          id: 'g1',
          name: 'Group 1',
          type: 'DIRECT',
          members: [],
          unreadCount: 2,
          updated_at: '2025-01-01T10:00:00Z',
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 'g2',
          name: 'Group 2',
          type: 'DIRECT',
          members: [],
          unreadCount: 1,
          updated_at: '2025-01-01T10:00:00Z',
          created_at: '2025-01-01T10:00:00Z',
        },
      ],
      setActiveGroup: vi.fn(),
      getTotalUnreadCount: () => 3,
      markAsRead,
      openPanel: vi.fn(),
    });

    (useAuth as unknown as vi.Mock).mockReturnValue({
      user: { language: 'ro' },
    });

    render(<ChatButton />);

    fireEvent.click(screen.getByLabelText('Deschide conversațiile'));

    const markAll = await screen.findByTitle('Marchează tot ca citit');
    fireEvent.click(markAll);

    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith('g1');
      expect(markAsRead).toHaveBeenCalledWith('g2');
    });
  });
});
