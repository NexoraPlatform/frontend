import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatService } from '../chat';
import { apiClient } from '../api';
import axios from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
  },
  ensureCsrfCookie: vi.fn(),
}));

describe('lib/chat ChatService', () => {
  beforeEach(() => {
    localStorage.clear();
    apiClient.removeToken();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    (axios as any).post.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sendMessageViaApi censors sensitive content and sets Authorization header', async () => {
    apiClient.setToken('token-abc');

    (axios as any).post.mockResolvedValue({
      data: { message: { id: 1 } },
    });

    const service = new ChatService();
    await service.sendMessageViaApi(
      '123',
      'Contact me at test@example.com or +40722 123 456 or telegram:username',
      []
    );

    expect((axios as any).post).toHaveBeenCalledOnce();
    const [url, body, config] = (axios as any).post.mock.calls[0];

    expect(url).toBe('/chat/groups/123/messages');
    expect(config.headers.Authorization).toBe('Bearer token-abc');
    expect(body.content).toContain('[EMAIL CENZURAT]');
    expect(body.content).toContain('[NUMĂR TELEFON CENZURAT]');
    expect(body.content).toContain('[CONTACT CENZURAT]');
  });

  it('uploadAttachment throws server error message when upload fails', async () => {
    apiClient.setToken('token-abc');

    (axios as any).post.mockRejectedValue({
      response: { data: { message: 'Upload denied' } },
    });

    const service = new ChatService();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await expect(service.uploadAttachment('555', file)).rejects.toThrow('Upload denied');
  });

  it('uploadAttachment returns message on success', async () => {
    apiClient.setToken('token-abc');

    (axios as any).post.mockResolvedValue({
      data: { message: { id: 9, status: 'scanning' } },
    });

    const service = new ChatService();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    const message = await service.uploadAttachment('555', file);
    expect(message).toEqual({ id: 9, status: 'scanning' });
  });
});
