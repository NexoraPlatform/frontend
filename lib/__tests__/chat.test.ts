import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatService } from '../chat';
import axios from '../axios';

describe('lib/chat ChatService', () => {
  beforeEach(() => {
    localStorage.clear();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sendMessageViaApi censors sensitive content', async () => {
    const postMock = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { message: { id: 1 } },
    } as any);

    const service = new ChatService();
    await service.sendMessageViaApi(
      '123',
      'Contact me at test@example.com or +40722 123 456 or telegram:username',
      []
    );

    expect(postMock).toHaveBeenCalledOnce();
    const [url, body] = postMock.mock.calls[0];

    expect(url).toBe('/chat/groups/123/messages');
    expect((body as any).content).toContain('[EMAIL CENZURAT]');
    expect((body as any).content).toContain('[NUMĂR TELEFON CENZURAT]');
    expect((body as any).content).toContain('[CONTACT CENZURAT]');
  });

  it('uploadAttachment throws server error message when upload fails', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Upload denied' } },
    });

    const service = new ChatService();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await expect(service.uploadAttachment('555', file)).rejects.toThrow('Upload denied');
  });

  it('uploadAttachment returns message on success', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { message: { id: 9, status: 'scanning' } },
    } as any);

    const service = new ChatService();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    const message = await service.uploadAttachment('555', file);
    expect(message).toEqual({ id: 9, status: 'scanning' });
  });
});
