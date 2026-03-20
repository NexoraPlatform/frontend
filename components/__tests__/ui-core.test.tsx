import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { PriceDisplay } from '@/components/PriceDisplay';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ProjectFilters } from '@/components/ProjectFilters';
import { useAuth } from '@/contexts/auth-context';

let locale = 'en';

vi.mock('next-intl', () => ({
  useLocale: () => locale,
  useTranslations: () => (key: string, values?: { count?: number }) =>
    values?.count != null ? `${key}:${values.count}` : key,
}));

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({ currency: 'USD' }),
}));

const routerReplace = vi.fn();
vi.mock('@/lib/navigation', () => ({
  locales: ['en', 'ro'],
  localePrefix: 'always',
  usePathname: () => '/ro/services',
  useRouter: () => ({ replace: routerReplace }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('UI core components', () => {
  beforeEach(() => {
    routerReplace.mockReset();
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
    (useAuth as unknown as vi.Mock).mockReturnValue({
      user: { id: '1' },
      setUserLanguage,
    });

    render(<LocaleSwitcher />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /schimb/i })).toBeTruthy();
    });

    const trigger = screen.getByRole('button', { name: /schimb/i });
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    const englishItem = await screen.findByText('English');
    fireEvent.click(englishItem);

    await waitFor(() => {
      expect(setUserLanguage).toHaveBeenCalledWith('en');
    });

    expect(routerReplace).toHaveBeenCalledWith('/services', { locale: 'en' });
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
