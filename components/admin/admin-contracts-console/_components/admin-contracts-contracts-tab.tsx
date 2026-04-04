import { FileSignature } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminTableLoadingRow } from "@/components/admin/admin-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AdminContractsConsoleController } from "../_hooks/use-admin-contracts-console-controller";
import {
  AdminErrorBanner,
  EmptyTableMessage,
  formatDateTime,
  getToneClass,
  humanizeCode,
} from "../_lib/admin-contracts-console-helpers";
import {
  CONTRACT_STATUS_OPTIONS,
  RISK_LEVEL_OPTIONS,
} from "../_lib/admin-contracts-console-types";

type AdminContractsContractsTabProps = Pick<
  AdminContractsConsoleController,
  | "contractPage"
  | "contractRequiresReview"
  | "contractRisk"
  | "contractSearch"
  | "contractStatus"
  | "contracts"
  | "contractsError"
  | "contractsLoading"
  | "locale"
  | "openContractDialog"
  | "setContractPage"
  | "setContractRequiresReview"
  | "setContractRisk"
  | "setContractSearch"
  | "setContractStatus"
>;

export function AdminContractsContractsTab({
  contractPage,
  contractRequiresReview,
  contractRisk,
  contractSearch,
  contractStatus,
  contracts,
  contractsError,
  contractsLoading,
  locale,
  openContractDialog,
  setContractPage,
  setContractRequiresReview,
  setContractRisk,
  setContractSearch,
  setContractStatus,
}: AdminContractsContractsTabProps) {
  const t = useTranslations("admin.contracts");

  return (
    <div className="space-y-6">
      <AdminErrorBanner title={t("contracts_tab.errors.title")} message={contractsError} />

      <AdminSectionCard
        title={t("contracts_tab.filters.title")}
        description={t("contracts_tab.filters.description")}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdminSearchInput
            value={contractSearch}
            onChange={(event) => {
              setContractSearch(event.target.value);
              setContractPage(1);
            }}
            placeholder={t("contracts_tab.filters.search")}
            className="relative xl:col-span-2"
          />
          <Select
            value={contractStatus}
            onValueChange={(value) => {
              setContractStatus(value);
              setContractPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("contracts_tab.filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {CONTRACT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanizeCode(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={contractRisk}
            onValueChange={(value) => {
              setContractRisk(value);
              setContractPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("contracts_tab.filters.risk")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {RISK_LEVEL_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanizeCode(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={contractRequiresReview}
            onValueChange={(value) => {
              setContractRequiresReview(value);
              setContractPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("contracts_tab.filters.manual_review")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="true">{t("common.yes")}</SelectItem>
              <SelectItem value="false">{t("common.no")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title={t("contracts_tab.list.title")}
        description={t("contracts_tab.list.description", {
          count: contracts?.total ?? 0,
        })}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("contracts_tab.table.reference")}</th>
                <th className="px-4 py-3">{t("contracts_tab.table.project")}</th>
                <th className="px-4 py-3">{t("contracts_tab.table.status")}</th>
                <th className="px-4 py-3">{t("contracts_tab.table.risk")}</th>
                <th className="px-4 py-3">{t("contracts_tab.table.signature_level")}</th>
                <th className="px-4 py-3">{t("contracts_tab.table.generated_at")}</th>
                <th className="px-4 py-3">{t("contracts_tab.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {contractsLoading ? <AdminTableLoadingRow colSpan={7} /> : null}
              {!contractsLoading && (contracts?.data.length ?? 0) === 0 ? (
                <EmptyTableMessage
                  icon={FileSignature}
                  title={t("contracts_tab.empty_title")}
                  description={t("contracts_tab.empty_description")}
                  colSpan={7}
                />
              ) : null}
              {!contractsLoading
                ? contracts?.data.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-border/60 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-4 font-medium">{contract.reference}</td>
                      <td className="px-4 py-4">
                        <div>{contract.project?.title ?? t("common.unavailable")}</div>
                        <div className="text-xs text-muted-foreground">
                          {contract.project?.reference ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={getToneClass(contract.status)}>
                          {humanizeCode(contract.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {contract.latest_risk?.overall_risk ? (
                          <Badge variant="outline">
                            {humanizeCode(contract.latest_risk.overall_risk)}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-4">{contract.signature_level ?? "—"}</td>
                      <td className="px-4 py-4">
                        {formatDateTime(contract.generated_at, locale) ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openContractDialog(contract.id)}
                        >
                          {t("common.view")}
                        </Button>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            {t("common.pagination", {
              current: contracts?.current_page ?? 1,
              total: contracts?.last_page ?? 1,
            })}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={(contracts?.current_page ?? 1) <= 1}
              onClick={() => setContractPage((current) => Math.max(1, current - 1))}
            >
              {t("common.previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={(contracts?.current_page ?? 1) >= (contracts?.last_page ?? 1)}
              onClick={() =>
                setContractPage((current) =>
                  Math.min(contracts?.last_page ?? current, current + 1)
                )
              }
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}
