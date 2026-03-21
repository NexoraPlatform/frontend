import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ChatProvider, useChat } from '@/contexts/chat-context';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { apiClient } from '@/lib/api';
import { chatService } from '@/lib/chat';

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/contexts/notification-context', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'ro',
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    getChatGroups: vi.fn(),
    getChatMessages: vi.fn(),
    markChatMessagesAsRead: vi.fn(),
    createChatGroup: vi.fn(),
    editChatMessage: vi.fn(),
    deleteChatMessage: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    custom: vi.fn(),
  },
}));

vi.mock('@/lib/chat', () => {
  const listeners: Record<string, Function[]> = {};
  const on = vi.fn((event: string, cb: Function) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(cb);
  });
  const off = vi.fn((event: string, cb: Function) => {
    listeners[event] = (listeners[event] || []).filter((fn) => fn !== cb);
  });
  const emit = (event: string, data?: any) => {
    (listeners[event] || []).forEach((cb) => cb(data));
  };

  return {
    chatService: {
      on,
      off,
      emit,
      connect: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn(),
      joinGroupPresence: vi.fn(),
      leaveGroupPresence: vi.fn(),
      sendMessageViaApi: vi.fn(),
      uploadAttachment: vi.fn(),
    },
  };
});

describe('contexts/chat-context', () => {
  const mockedUseAuth = useAuth as unknown as vi.Mock;
  const mockedUseNotifications = useNotifications as unknown as vi.Mock;
  const mockedApi = apiClient as unknown as {
    getChatGroups: vi.Mock;
    getChatMessages: vi.Mock;
    markChatMessagesAsRead: vi.Mock;
  };

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ user: { id: 'u1' } });
    mockedUseNotifications.mockReturnValue({ notifications: [], loading: false });

    mockedApi.getChatGroups.mockResolvedValue({
      groups: [
        {
          id: 'g1',
          name: 'Group 1',
          type: 'DIRECT',
          members: [],
          unreadCount: 0,
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
        },
      ],
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loadMessages merges pages (page 2 prepends)', async () => {
    mockedApi.getChatMessages.mockImplementation((groupId: string, page: number) => {
      if (page === 1) {
        return Promise.resolve({
          messages: [
            { id: 'm1', groupId, sender_id: 'u2', content: 'hello', isRead: false },
          ],
        });
      }
      return Promise.resolve({
        messages: [
          { id: 'm0', groupId, sender_id: 'u2', content: 'older', isRead: false },
        ],
      });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refreshGroups();
    });
    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    await act(async () => {
      await result.current.loadMessages('g1', 1, 10);
    });
    expect(result.current.messages['g1']).toHaveLength(1);

    await act(async () => {
      await result.current.loadMessages('g1', 2, 10);
    });

    expect(result.current.messages['g1'].map(m => m.id)).toEqual(['m0', 'm1']);
  });

  it('markAsRead sets unreadCount to 0 and marks messages as read', async () => {
    mockedApi.getChatGroups.mockResolvedValueOnce({
      groups: [
        {
          id: 'g1',
          name: 'Group 1',
          type: 'DIRECT',
          members: [],
          unreadCount: 2,
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
        },
      ],
    });

    mockedApi.getChatMessages.mockResolvedValueOnce({
      messages: [
        { id: 'm1', groupId: 'g1', sender_id: 'u2', content: 'hello', isRead: false },
      ],
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refreshGroups();
    });
    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    await act(async () => {
      await result.current.loadMessages('g1', 1, 10);
    });

    await act(async () => {
      await result.current.markAsRead('g1');
    });

    expect(mockedApi.markChatMessagesAsRead).toHaveBeenCalledWith('g1', undefined);
    expect(result.current.groups[0].unreadCount).toBe(0);
    expect(result.current.messages['g1'][0].isRead).toBe(true);
  });

  it('openPanel activates lazy chat state and refreshGroups hydrates groups', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatProvider lazy>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.active).toBe(false);
    expect(result.current.groups).toHaveLength(0);

    await act(async () => {
      result.current.openPanel();
    });

    await waitFor(() => expect(result.current.active).toBe(true));
    expect(result.current.isPanelOpen).toBe(true);

    await act(async () => {
      await result.current.refreshGroups();
    });

    await waitFor(() => expect(result.current.groups).toHaveLength(1));
  });
});
