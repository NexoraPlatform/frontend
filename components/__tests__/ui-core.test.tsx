import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { PriceDisplay } from '@/components/PriceDisplay';
import { CurrencySwitcher } from '@/components/CurrencySwitcher';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ProjectFilters } from '@/components/ProjectFilters';
import { useOptionalAuth } from '@/contexts/auth-context';
import { usePublicAuth } from '@/hooks/use-public-auth';

let locale = 'en';

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
    ...props
  }: {
    children: React.ReactNode;
    onSelect?: (event: { preventDefault: () => void }) => void | Promise<void>;
  }) => (
    <button
      type="button"
      onClick={() => onSelect?.({ preventDefault: () => undefined })}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('next-intl', () => ({
  useLocale: () => locale,
  useTranslations: () => (key: string, values?: { count?: number }) =>
    values?.count != null ? `${key}:${values.count}` : key,
}));

const setCurrency = vi.fn();
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({ currency: 'USD', setCurrency }),
}));

const routerReplace = vi.fn();
const routerRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock('@/lib/navigation', () => ({
  locales: ['en', 'ro'],
  localePrefix: 'always',
  usePathname: () => '/ro/services',
  useRouter: () => ({ replace: routerReplace, refresh: routerRefresh }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useOptionalAuth: vi.fn(),
}));

vi.mock('@/hooks/use-public-auth', () => ({
  usePublicAuth: vi.fn(),
}));

describe('UI core components', () => {
  beforeEach(() => {
    routerReplace.mockReset();
    routerRefresh.mockReset();
    setCurrency.mockReset();
    (useOptionalAuth as unknown as vi.Mock).mockReturnValue({
      user: { id: '1' },
      setUserLanguage: vi.fn().mockResolvedValue({ id: '1' }),
    });
    (usePublicAuth as unknown as vi.Mock).mockReturnValue({
      user: null,
      setUserLanguage: vi.fn(),
    });
  });

  it('PriceDisplay uses currency from context when not provided', () => {
    locale = 'en';
    render(<PriceDisplay value={1000} />);
    expect(screen.getByText(/\$/)).toBeTruthy();
  });

  it('PriceDisplay honors explicit currency prop', () => {
    locale = 'en';
    render(<PriceDisplay value={1000} currency="EUR" />);
    expect(screen.getByText(/€|EUR/)).toBeTruthy();
  });

  it('LocaleSwitcher calls setUserLanguage and router.replace', async () => {
    locale = 'ro';
    const setUserLanguage = vi.fn().mockResolvedValue({ id: '1' });
    (useOptionalAuth as unknown as vi.Mock).mockReturnValue({
      user: { id: '1' },
      setUserLanguage,
    });

    render(<LocaleSwitcher />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /schimb/i })).toBeTruthy();
    });

    const englishItem = await screen.findByText('English');
    fireEvent.click(englishItem);

    await waitFor(() => {
      expect(setUserLanguage).toHaveBeenCalledWith('en');
    });

    expect(routerReplace).toHaveBeenCalledWith('/services', { locale: 'en' });
  });

  it('LocaleSwitcher and CurrencySwitcher keep readable hover text classes in light mode', async () => {
    locale = 'en';

    render(
      <>
        <LocaleSwitcher />
        <CurrencySwitcher />
      </>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /schimbă limba/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /schimbă valuta/i }).length).toBeGreaterThan(0);
    });

    const localeButton = screen.getAllByRole('button', { name: /schimbă limba/i }).at(-1)!;
    const currencyButton = screen.getAllByRole('button', { name: /schimbă valuta/i }).at(-1)!;

    expect(localeButton.className).toContain('text-foreground');
    expect(localeButton.className).toContain('hover:text-foreground');
    expect(currencyButton.className).toContain('text-foreground');
    expect(currencyButton.className).toContain('hover:text-foreground');
  });

  it('ProjectFilters triggers callbacks on interactions', () => {
    const onSearchChange = vi.fn();
    const onCategoryChange = vi.fn();
    const onTechnologiesChange = vi.fn();
    const onBudgetChange = vi.fn();

    render(
      <ProjectFilters
        categories={['Web', 'Mobile']}
        technologies={['React', 'Node']}
        onSearchChange={onSearchChange}
        onCategoryChange={onCategoryChange}
        onTechnologiesChange={onTechnologiesChange}
        onBudgetChange={onBudgetChange}
        selectedCategory="projects.list.filters.all"
        selectedTechnologies={[]}
        selectedBudgetMin={0}
        selectedBudgetMax={999999}
      />
    );

    const searchInput = screen.getByPlaceholderText('projects.list.filters.search_placeholder');
    fireEvent.change(searchInput, { target: { value: 'dev' } });
    expect(onSearchChange).toHaveBeenCalledWith('dev');

    const categoryButton = screen.getByText('projects.list.filters.category_label');
    fireEvent.click(categoryButton);
    const webOption = screen.getByText('Web');
    fireEvent.click(webOption);
    expect(onCategoryChange).toHaveBeenCalledWith('Web');

    const techButton = screen.getByText('projects.list.filters.technologies_label');
    fireEvent.click(techButton);
    const reactCheckbox = screen.getByLabelText('React');
    fireEvent.click(reactCheckbox);
    expect(onTechnologiesChange).toHaveBeenCalledWith(['React']);

    const budgetButton = screen.getByText('projects.list.filters.budget_label');
    fireEvent.click(budgetButton);
    const preset = screen.getByText('projects.list.filters.budget_presets.range1');
    fireEvent.click(preset);
    expect(onBudgetChange).toHaveBeenCalledWith(500, 2000);
  });
});
