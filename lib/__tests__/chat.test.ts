import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatService } from '../chat';
import { FetchError } from '../fetch-client';

vi.mock('../fetch-client', () => ({
  http: {
    post: vi.fn(),
  },
  FetchError: class MockFetchError extends Error {
    status: number;
    response: Response;
    data: unknown;
    url: string;
    constructor(message: string, status: number, response: Response, data: unknown, url: string) {
      super(message);
      this.status = status;
      this.response = response;
      this.data = data;
      this.url = url;
    }
  },
}));

import { http } from '../fetch-client';

describe('lib/chat ChatService', () => {
  const mockedHttp = http as unknown as { post: vi.Mock };

  beforeEach(() => {
    localStorage.clear();
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    mockedHttp.post.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sendMessageViaApi censors sensitive content', async () => {
    mockedHttp.post.mockResolvedValue({
      message: { id: 1 },
    });

    const service = new ChatService();
    await service.sendMessageViaApi(
      '123',
      'Contact me at test@example.com or +40722 123 456 or telegram:username',
      []
    );

    expect(mockedHttp.post).toHaveBeenCalledOnce();
    const [url, body] = mockedHttp.post.mock.calls[0];

    expect(url).toBe('/chat/groups/123/messages');
    expect((body as any).content).toContain('[EMAIL CENZURAT]');
    expect((body as any).content).toContain('[NUMĂR TELEFON CENZURAT]');
    expect((body as any).content).toContain('[CONTACT CENZURAT]');
  });

  it('uploadAttachment throws server error message when upload fails', async () => {
    mockedHttp.post.mockRejectedValue(
      new FetchError('Request failed', 422, new Response(null, { status: 422 }), {
        message: 'Upload denied',
      }, '/chat/groups/555/attachments')
    );

    const service = new ChatService();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await expect(service.uploadAttachment('555', file)).rejects.toThrow('Upload denied');
  });

  it('uploadAttachment returns message on success', async () => {
    mockedHttp.post.mockResolvedValue({
      message: { id: 9, status: 'scanning' },
    });

    const service = new ChatService();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    const message = await service.uploadAttachment('555', file);
    expect(message).toEqual({ id: 9, status: 'scanning' });
  });
});
