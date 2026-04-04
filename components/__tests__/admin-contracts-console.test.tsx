import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminContractsConsole } from "@/components/admin/admin-contracts-console";
import { adminContractsApi } from "@/lib/admin-contracts";

const translate = (key: string, values?: Record<string, unknown>) => {
  if (key === "locale") {
    return "en";
  }

  if (key === "common.pagination") {
    return `Page ${String(values?.current ?? "")} of ${String(values?.total ?? "")}`;
  }

  return key;
};

const useAuthMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => translate,
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/admin/project-admin-shell", () => ({
  ProjectAdminShell: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/admin/admin-page-header", () => ({
  AdminPageHeader: ({ title, description, action }: any) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
      {action}
    </header>
  ),
}));

vi.mock("@/components/admin/admin-section-card", () => ({
  AdminSectionCard: ({ title, description, children }: any) => (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </section>
  ),
}));

vi.mock("@/components/admin/admin-summary-card", () => ({
  AdminSummaryCard: ({ title, value, badge }: any) => (
    <div>
      <span>{title}</span>
      <span>{String(value)}</span>
      {badge}
    </div>
  ),
}));

vi.mock("@/components/admin/admin-search-input", () => ({
  AdminSearchInput: ({ placeholder, ...props }: any) => (
    <input aria-label={placeholder} placeholder={placeholder} {...props} />
  ),
}));

vi.mock("@/components/admin/admin-state", () => ({
  AdminSpinner: () => <div>Loading…</div>,
  AdminTableEmptyRow: ({ title, description, colSpan }: any) => (
    <tr>
      <td colSpan={colSpan}>
        <div>{title}</div>
        <div>{description}</div>
      </td>
    </tr>
  ),
  AdminTableLoadingRow: ({ colSpan }: any) => (
    <tr>
      <td colSpan={colSpan}>Loading row</td>
    </tr>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
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

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: React.forwardRef<HTMLInputElement, any>((props, ref) => (
    <input ref={ref} {...props} />
  )),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertTitle: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/admin-contracts", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-contracts")>(
    "@/lib/admin-contracts"
  );

  return {
    ...actual,
    adminContractsApi: {
      ...actual.adminContractsApi,
      getDashboardStats: vi.fn(),
      listContracts: vi.fn(),
      listReviewQueue: vi.fn(),
      listSignatureQueue: vi.fn(),
      getContractDetail: vi.fn(),
      createContractNote: vi.fn(),
      getReviewDetail: vi.fn(),
      createReviewComment: vi.fn(),
      getSignatureDetail: vi.fn(),
      uploadSignedPdf: vi.fn(),
    },
  };
});

vi.mock("@/lib/contracts", async () => {
  const actual = await vi.importActual<typeof import("@/lib/contracts")>(
    "@/lib/contracts"
  );

  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getContractHtml: vi.fn(),
      getContractPdfResponse: vi.fn(),
      assignManualReview: vi.fn(),
      startManualReview: vi.fn(),
      requestManualReviewChanges: vi.fn(),
      approveManualReview: vi.fn(),
      rejectManualReview: vi.fn(),
      getSignedPdfResponse: vi.fn(),
    },
  };
});

describe("AdminContractsConsole", () => {
  const mockedAdminContractsApi = adminContractsApi as unknown as {
    getDashboardStats: vi.Mock;
    listContracts: vi.Mock;
    listReviewQueue: vi.Mock;
    listSignatureQueue: vi.Mock;
  };

  beforeEach(() => {
    replaceMock.mockReset();
    useAuthMock.mockReturnValue({
      user: {
        id: "1",
        email: "admin@example.com",
        is_superuser: true,
        roles: ["admin"],
      },
      loading: false,
      userLoading: false,
    });

    mockedAdminContractsApi.getDashboardStats.mockReset();
    mockedAdminContractsApi.listContracts.mockReset();
    mockedAdminContractsApi.listReviewQueue.mockReset();
    mockedAdminContractsApi.listSignatureQueue.mockReset();

    mockedAdminContractsApi.getDashboardStats.mockResolvedValue({
      contracts: { total: 1, by_status: {} },
      reviews: { open_like_total: 2, urgent_total: 1, by_status: {} },
      signatures: { active_total: 3, stalled_total: 1, by_status: {} },
      obligations: { overdue_total: 0, due_soon_total: 1 },
    });

    mockedAdminContractsApi.listContracts.mockResolvedValue({
      data: [
        {
          id: "contract-1",
          reference: "CTR-001",
          status: "draft",
          project: {
            title: "Website redesign",
            reference: "PRJ-001",
          },
          latest_risk: null,
          signature_level: "SES",
          generated_at: "2026-04-01T10:00:00Z",
        },
      ],
      current_page: 1,
      last_page: 1,
      total: 1,
    });
    mockedAdminContractsApi.listReviewQueue.mockResolvedValue({
      data: [],
      current_page: 1,
      last_page: 1,
      total: 0,
    });
    mockedAdminContractsApi.listSignatureQueue.mockResolvedValue({
      data: [],
      current_page: 1,
      last_page: 1,
      total: 0,
    });
  });

  it("loads stats and contracts and refreshes the active tab", async () => {
    render(<AdminContractsConsole />);

    await waitFor(() => {
      expect(mockedAdminContractsApi.getDashboardStats).toHaveBeenCalledTimes(1);
      expect(mockedAdminContractsApi.listContracts).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText("CTR-001")).toBeTruthy();
    expect(screen.getByText("title")).toBeTruthy();
    expect(screen.getByText("tabs.contracts")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "actions.refresh" }));

    await waitFor(() => {
      expect(mockedAdminContractsApi.getDashboardStats).toHaveBeenCalledTimes(2);
      expect(mockedAdminContractsApi.listContracts).toHaveBeenCalledTimes(2);
    });
  });
});
