import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatService } from '../chat';
import { apiClient } from '../api';

describe('lib/chat ChatService', () => {
  beforeEach(() => {
    localStorage.clear();
    apiClient.removeToken();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sendMessageViaApi censors sensitive content and sets Authorization header', async () => {
    apiClient.setToken('token-abc');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ message: { id: 1 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new ChatService();
    await service.sendMessageViaApi(
      '123',
      'Contact me at test@example.com or +40722 123 456 or telegram:username',
      []
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('https://api.example.com/chat/groups/123/messages');

    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-abc');

    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.content).toContain('[EMAIL CENZURAT]');
    expect(body.content).toContain('[NUMĂR TELEFON CENZURAT]');
    expect(body.content).toContain('[CONTACT CENZURAT]');
  });

  it('uploadAttachment throws server error message when upload fails', async () => {
    apiClient.setToken('token-abc');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: 'Upload denied' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new ChatService();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await expect(service.uploadAttachment('555', file)).rejects.toThrow('Upload denied');
  });

  it('uploadAttachment returns message on success', async () => {
    apiClient.setToken('token-abc');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ message: { id: 9, status: 'scanning' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new ChatService();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    const message = await service.uploadAttachment('555', file);
    expect(message).toEqual({ id: 9, status: 'scanning' });
  });
});
