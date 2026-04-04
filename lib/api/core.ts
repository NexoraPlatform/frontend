import { apiFetch, FetchError, type ApiFetchOptions } from '@/lib/fetch-client';

import type {
  ChatGroupsResponse,
  ChatMessagesResponse,
  ChatPagination,
} from './types';

export class ApiClientCore {
  constructor(_baseURL: string) {}

  normalizeChatPagination(input: any): ChatPagination | null {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return null;
    }

    const currentPage = Number(input.current_page);
    const perPage = Number(input.per_page);
    const lastPage = Number(input.last_page);
    const total = input.total !== undefined ? Number(input.total) : undefined;

    if (
      Number.isNaN(currentPage) ||
      Number.isNaN(perPage) ||
      Number.isNaN(lastPage)
    ) {
      return null;
    }

    return {
      current_page: currentPage,
      per_page: perPage,
      ...(total !== undefined && !Number.isNaN(total) ? { total } : {}),
      last_page: lastPage,
      ...(typeof input.has_more_pages === 'boolean'
        ? { has_more_pages: input.has_more_pages }
        : {}),
    };
  }

  normalizeChatGroupsResponse(response: any): ChatGroupsResponse {
    if (Array.isArray(response)) {
      return {
        groups: response,
        pagination: null,
      };
    }

    return {
      groups: Array.isArray(response?.groups) ? response.groups : [],
      pagination: this.normalizeChatPagination(response?.pagination),
    };
  }

  normalizeChatMessagesResponse(response: any): ChatMessagesResponse {
    return {
      messages: Array.isArray(response?.messages) ? response.messages : [],
      ...(typeof response?.total === 'number' ? { total: response.total } : {}),
      ...(typeof response?.hasMore === 'boolean' ? { hasMore: response.hasMore } : {}),
      pagination: this.normalizeChatPagination(response?.pagination),
    };
  }

  async request<T>(
    endpoint: string,
    options: ApiFetchOptions = {}
  ): Promise<T> {
    try {
      const response = await apiFetch<T | null>(endpoint, {
        ...options,
        method: options.method || 'GET',
        body: options.body as any,
        withCredentials: true,
      });
      return (response ?? ({} as T)) as T;
    } catch (error) {
      if (error instanceof FetchError) {
        const payload = error.data as Record<string, unknown> | null;
        const message =
          (payload && (payload.message as string)) ||
          (payload && (payload.error as string)) ||
          error.message;
        throw new Error(message);
      }
      throw error;
    }
  }
}
