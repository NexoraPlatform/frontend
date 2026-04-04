import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ExamGuard from '@/components/exams/ExamGuard';

const routerPush = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) =>
    values ? `${namespace}.${key}:${JSON.stringify(values)}` : `${namespace}.${key}`,
}));

vi.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

describe('ExamGuard reporting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    routerPush.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      value: vi.fn(() => true),
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses fetch for regular violations while the page is still active', async () => {
    const fetchMock = vi.mocked(fetch);
    const sendBeaconMock = vi.mocked(window.navigator.sendBeacon);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ current_strikes: 1 }),
    } as Response);

    render(<ExamGuard testId="exam-1" editorLanguage="javascript" />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        value: true,
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(120);
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/exams/violation');
    expect(
      JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    ).toMatchObject({
      test_id: 'exam-1',
      type: 'minor',
      reason: 'tab_switch',
    });
  });

  it('reports an app switch when the window loses focus without unloading', async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ current_strikes: 1 }),
    } as Response);

    vi.spyOn(document, 'hasFocus').mockReturnValue(false);

    render(<ExamGuard testId="exam-1" editorLanguage="javascript" />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    act(() => {
      window.dispatchEvent(new Event('blur'));
      vi.advanceTimersByTime(120);
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    ).toMatchObject({
      test_id: 'exam-1',
      type: 'minor',
      reason: 'app_blur',
    });
  });

  it('uses beacon when the page is actually unloading', () => {
    const sendBeaconMock = vi.mocked(window.navigator.sendBeacon);
    const fetchMock = vi.mocked(fetch);

    render(<ExamGuard testId="exam-1" editorLanguage="javascript" />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    const beforeUnloadEvent = new Event('beforeunload', {
      cancelable: true,
    }) as BeforeUnloadEvent;
    Object.defineProperty(beforeUnloadEvent, 'returnValue', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    act(() => {
      window.dispatchEvent(beforeUnloadEvent);
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(beforeUnloadEvent.defaultPrevented).toBe(true);
    expect(beforeUnloadEvent.returnValue).toBe('');
    expect(sendBeaconMock).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendBeaconMock.mock.calls[0]?.[0]).toBe('/api/exams/violation');
  });

  it('falls back to keepalive fetch for unload reporting when beacon is unavailable', async () => {
    const fetchMock = vi.mocked(fetch);
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      value: vi.fn(() => false),
    });

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ current_strikes: 0 }),
    } as Response);

    render(<ExamGuard testId="exam-1" editorLanguage="javascript" />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    const beforeUnloadEvent = new Event('beforeunload', {
      cancelable: true,
    }) as BeforeUnloadEvent;
    Object.defineProperty(beforeUnloadEvent, 'returnValue', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    act(() => {
      window.dispatchEvent(beforeUnloadEvent);
      window.dispatchEvent(new Event('pagehide'));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    ).toMatchObject({
      test_id: 'exam-1',
      type: 'critical',
      reason: 'browser_closed',
    });
  });

  it('treats a 409 failed response as a real exam failure', async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ action: 'failed', current_strikes: 2 }),
    } as Response);

    render(<ExamGuard testId="exam-1" editorLanguage="javascript" />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        value: true,
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(120);
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(routerPush).toHaveBeenCalledWith('/exam/result/failed');
  });
});
