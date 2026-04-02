import type { ApiClientCore } from '../core';

export const notificationApiMethods = {
  async getNotifications(
    this: ApiClientCore,
    params?: {
      unreadOnly?: boolean;
      unread?: boolean;
      type?: string;
      page?: number;
      limit?: number;
      cursor?: string;
      language?: string;
    }
  ) {
    const sp = new URLSearchParams();
    const normalizedParams: Record<string, unknown> = { ...(params || {}) };
    if (
      normalizedParams.unread === undefined &&
      normalizedParams.unreadOnly !== undefined
    ) {
      normalizedParams.unread = normalizedParams.unreadOnly;
      delete normalizedParams.unreadOnly;
    }
    Object.entries(normalizedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sp.append(key, String(value));
      }
    });
    return this.request<any>(`/notifications?${sp.toString()}`);
  },

  async markNotificationAsRead(this: ApiClientCore, notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  async getUnreadNotificationsCount(this: ApiClientCore) {
    return this.request<any>('/notifications/unread-count');
  },

  async subscribeToNotifications(
    this: ApiClientCore,
    subscription: PushSubscription,
    navigator: Navigator
  ) {
    return this.request<any>('/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      }),
    });
  },

  async unsubscribeFromNotifications(this: ApiClientCore) {
    return this.request<any>('/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async markAllNotificationsAsRead(this: ApiClientCore) {
    return this.request<any>('/notifications/read-all');
  },

  async deleteNotification(this: ApiClientCore, notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  async sendNotification(
    this: ApiClientCore,
    data: {
      userIds: string[];
      title: string;
      message: string;
      type: string;
      data?: any;
      webPushOnly?: boolean;
    }
  ) {
    return this.request<any>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export type NotificationApiMethods = typeof notificationApiMethods;
