import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../api';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('lib/api ApiClient', () => {
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    window.history.pushState({}, '', '/ro/test');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('wraps fetch requests via ApiClient', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [] }));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    await client.getPopularServices();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/services/popular');
  });

  it('throws error message from non-ok response JSON', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'Invalid payload' }, 422));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);

    await expect(client.getPopularServices()).rejects.toThrow('Invalid payload');
  });

  it('normalizes chat groups envelope with pagination metadata', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        groups: [{ id: 'g1', name: 'General' }],
        pagination: {
          current_page: 1,
          per_page: 20,
          total: 42,
          last_page: 3,
          has_more_pages: true,
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const response = await client.getChatGroups();

    expect(response.groups).toEqual([{ id: 'g1', name: 'General' }]);
    expect(response.pagination).toEqual({
      current_page: 1,
      per_page: 20,
      total: 42,
      last_page: 3,
      has_more_pages: true,
    });
  });

  it('normalizes chat messages envelope with pagination metadata', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        messages: [{ id: 'm1', content: 'hello' }],
        total: 42,
        hasMore: true,
        pagination: {
          current_page: 1,
          per_page: 20,
          last_page: 4,
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const response = await client.getChatMessages('group-1', 1, 20);

    expect(response.messages).toEqual([{ id: 'm1', content: 'hello' }]);
    expect(response.total).toBe(42);
    expect(response.hasMore).toBe(true);
    expect(response.pagination).toEqual({
      current_page: 1,
      per_page: 20,
      last_page: 4,
    });
  });

  it('accepts object response for project name by slug endpoint', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ name: 'Project Name' }));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const response = await client.getProjectNameByProjectUrl('project-slug');

    expect(response).toBe('Project Name');
  });
});
