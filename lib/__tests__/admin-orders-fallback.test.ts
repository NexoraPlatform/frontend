import { describe, expect, it } from 'vitest';

import { getAdminOrderFallbackById, getAdminOrdersFallback } from '../admin-orders-fallback';

describe('admin orders fallback', () => {
  it('returns a stable list of fallback orders for the admin pages', () => {
    const orders = getAdminOrdersFallback();

    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0]).toMatchObject({
      id: 'demo-order-1',
      orderNumber: 'ORD-1001',
      status: 'IN_PROGRESS',
    });
  });

  it('returns a fallback order for unknown ids', () => {
    const order = getAdminOrderFallbackById('custom-order-id');

    expect(order).not.toBeNull();
    expect(order?.id).toBe('custom-order-id');
    expect(order?.orderNumber).toBe('ORD-1001');
  });
});
