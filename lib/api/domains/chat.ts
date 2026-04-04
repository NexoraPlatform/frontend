import type { ApiClientCore } from '../core';

export const chatApiMethods = {
  async getChatGroups(this: ApiClientCore) {
    const response = await this.request<any>('/chat/groups');
    return this.normalizeChatGroupsResponse(response);
  },

  async createChatGroup(
    this: ApiClientCore,
    groupData: {
      name: string;
      type: 'PROJECT' | 'PROVIDER_ONLY' | 'DIRECT';
      projectId?: string;
      participantIds: string[];
    },
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<any>(`/chat/groups${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  async getChatMessages(
    this: ApiClientCore,
    groupId: string,
    page = 1,
    limit = 50
  ) {
    const response = await this.request<any>(
      `/chat/groups/${groupId}/messages?page=${page}&limit=${limit}`
    );
    return this.normalizeChatMessagesResponse(response);
  },

  async sendChatMessage(
    this: ApiClientCore,
    groupId: string,
    content: string,
    attachments?: any[],
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<any>(`/chat/groups/${groupId}/messages${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async editChatMessage(this: ApiClientCore, messageId: string, content: string) {
    return this.request<any>(`/chat/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  async deleteChatMessage(this: ApiClientCore, messageId: string) {
    return this.request<any>(`/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  async markChatMessagesAsRead(
    this: ApiClientCore,
    groupId: string,
    messageId?: string
  ) {
    return this.request<any>(`/chat/groups/${groupId}/read`, {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    });
  },

  async joinChatGroup(this: ApiClientCore, groupId: string) {
    return this.request<any>(`/chat/groups/${groupId}/join`, {
      method: 'POST',
    });
  },

  async leaveChatGroup(this: ApiClientCore, groupId: string) {
    return this.request<any>(`/chat/groups/${groupId}/leave`, {
      method: 'POST',
    });
  },
};

export type ChatApiMethods = typeof chatApiMethods;
