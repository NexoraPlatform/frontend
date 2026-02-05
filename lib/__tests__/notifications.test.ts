import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService } from '../notifications';

describe('lib/notifications NotificationService', () => {
  const originalNotification = (globalThis as any).Notification;
  const originalPushManager = (globalThis as any).PushManager;
  const originalServiceWorker = (navigator as any).serviceWorker;

  beforeEach(() => {
    // Clean start for each test
    delete (globalThis as any).Notification;
    delete (globalThis as any).PushManager;
    if ('serviceWorker' in navigator) {
      delete (navigator as any).serviceWorker;
    }
  });

  afterEach(() => {
    if (originalNotification) (globalThis as any).Notification = originalNotification;
    else delete (globalThis as any).Notification;

    if (originalPushManager) (globalThis as any).PushManager = originalPushManager;
    else delete (globalThis as any).PushManager;

    if (originalServiceWorker !== undefined) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      });
    } else {
      delete (navigator as any).serviceWorker;
    }

    vi.restoreAllMocks();
  });

  it('requestPermission returns denied when Notification is not available', async () => {
    const service = new NotificationService();
    const result = await service.requestPermission();
    expect(result).toBe('denied');
  });

  it('requestPermission returns granted when already granted', async () => {
    (globalThis as any).Notification = {
      permission: 'granted',
      requestPermission: vi.fn(),
    };
    const service = new NotificationService();
    const result = await service.requestPermission();
    expect(result).toBe('granted');
    expect((globalThis as any).Notification.requestPermission).not.toHaveBeenCalled();
  });

  it('requestPermission calls Notification.requestPermission when default', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    (globalThis as any).Notification = {
      permission: 'default',
      requestPermission,
    };
    const service = new NotificationService();
    const result = await service.requestPermission();
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(result).toBe('granted');
  });

  it('isSupported returns true only when all required APIs exist', () => {
    const service = new NotificationService();
    expect(service.isSupported()).toBe(false);

    (globalThis as any).Notification = { permission: 'default' };
    (globalThis as any).PushManager = function PushManager() {};
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      configurable: true,
    });

    expect(service.isSupported()).toBe(true);
  });

  it('getPermissionStatus returns default when Notification missing', () => {
    const service = new NotificationService();
    expect(service.getPermissionStatus()).toBe('default');

    (globalThis as any).Notification = { permission: 'denied' };
    expect(service.getPermissionStatus()).toBe('denied');
  });
});
