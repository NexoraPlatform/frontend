import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useApi } from '../use-api';

describe('useApi', () => {
  it('sets loading true initially and false after success', async () => {
    const apiCall = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useApi(apiCall));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(apiCall).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('result');
  });

  it('sets error when apiCall rejects', async () => {
    const apiCall = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useApi(apiCall));

    await waitFor(() => {
      expect(result.current.error).toBe('fail');
    });

    expect(result.current.loading).toBe(false);
  });
});
