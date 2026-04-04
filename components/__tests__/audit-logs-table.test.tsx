import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import AuditLogsTable from '@/components/AuditLogsTable';
import apiClient from '@/lib/api';

const translate = (key: string, values?: Record<string, unknown>) => {
  if (key === 'admin.audit_logs.error_message') return 'Failed to load audit logs';
  if (key === 'admin.audit_logs.filters.all_events') return 'All events';
  if (key === 'admin.audit_logs.filters.all_subject_types') return 'All subject types';
  if (key === 'admin.audit_logs.filters.all_subjects') return 'All subjects';
  if (key === 'admin.audit_logs.search_placeholder') return 'Search User ID...';
  if (key === 'admin.audit_logs.actions.search') return 'Search';
  if (key === 'admin.audit_logs.pagination.previous') return 'Previous';
  if (key === 'admin.audit_logs.pagination.next') return 'Next';
  if (key === 'admin.audit_logs.pagination.page') {
    return `Page ${String(values?.page ?? '')} of ${String(values?.lastPage ?? '')}`;
  }
  if (key === 'admin.audit_logs.pagination.total') {
    return `Total ${String(values?.total ?? '')}`;
  }
  if (key === 'admin.audit_logs.table.subject_id') {
    return `Subject ID: ${String(values?.id ?? '')}`;
  }
  return key;
};

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => translate,
}));

vi.mock('@/lib/navigation', () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <button type="button">{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, ...rest }: any) => (
    <div data-value={value} {...rest}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/api', () => ({
  default: {
    fetchAuditLogs: vi.fn(),
  },
  apiClient: {
    fetchAuditLogs: vi.fn(),
  },
}));

describe('AuditLogsTable', () => {
  const mockedApi = apiClient as unknown as {
    fetchAuditLogs: vi.Mock;
  };

  const baseLog = {
    id: 1,
    actor_name: 'Admin User',
    action: 'Updated user profile',
    event: 'updated',
    subject_type: 'User',
    subject_id: 42,
    old_values: { name: 'Old' },
    new_values: { name: 'New' },
    ip: '127.0.0.1',
    created_at: '2024-01-10T10:00:00Z',
  };

  beforeEach(() => {
    mockedApi.fetchAuditLogs.mockReset();
  });

  it('fetches audit logs with date range and renders diff on expand', async () => {
    mockedApi.fetchAuditLogs.mockResolvedValue({
      data: [baseLog],
      meta: { current_page: 1, last_page: 1, total: 1 },
    });

    render(<AuditLogsTable />);

    await waitFor(() => {
      expect(mockedApi.fetchAuditLogs).toHaveBeenCalled();
    });

    const firstCallArgs = mockedApi.fetchAuditLogs.mock.calls[0][0];
    expect(firstCallArgs.date_from).toBeTruthy();
    expect(firstCallArgs.date_to).toBeTruthy();
    const dayDiff = differenceInCalendarDays(
      parseISO(firstCallArgs.date_to),
      parseISO(firstCallArgs.date_from)
    );
    expect(dayDiff).toBe(30);

    expect(await screen.findByText('Updated user profile')).toBeTruthy();

    fireEvent.click(screen.getByText('Updated user profile'));

    expect(await screen.findByText('name')).toBeTruthy();
    expect(await screen.findByText('Old')).toBeTruthy();
    expect(await screen.findByText('New')).toBeTruthy();
  });

  it('searching a numeric user id triggers fetch with user_id', async () => {
    mockedApi.fetchAuditLogs.mockResolvedValue({
      data: [baseLog],
      meta: { current_page: 1, last_page: 1, total: 1 },
    });

    render(<AuditLogsTable />);

    await screen.findByText('Updated user profile');

    const [input] = screen.getAllByPlaceholderText('Search User ID...');
    fireEvent.change(input, { target: { value: '42' } });
    const [searchButton] = screen.getAllByRole('button', { name: 'Search' });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockedApi.fetchAuditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ user_id: 42, page: 1 })
      );
    });
  });

  it('paginates to next page', async () => {
    mockedApi.fetchAuditLogs
      .mockResolvedValueOnce({
        data: [baseLog],
        meta: { current_page: 1, last_page: 2, total: 2 },
      })
      .mockResolvedValueOnce({
        data: [{ ...baseLog, id: 2, action: 'Deleted record', event: 'deleted' }],
        meta: { current_page: 2, last_page: 2, total: 2 },
      });

    render(<AuditLogsTable />);

    expect(await screen.findByText('Page 1 of 2')).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: /Go to next page/i }));

    await waitFor(() => {
      expect(mockedApi.fetchAuditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });
});
