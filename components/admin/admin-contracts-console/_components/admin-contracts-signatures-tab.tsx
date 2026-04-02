import { Signature } from "lucide-react";
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
  SIGNATURE_LEVEL_OPTIONS,
  SIGNATURE_STATUS_OPTIONS,
} from "../_lib/admin-contracts-console-types";

type AdminContractsSignaturesTabProps = Pick<
  AdminContractsConsoleController,
  | "locale"
  | "openSignatureDialog"
  | "setSignatureContractStatus"
  | "setSignatureLevel"
  | "setSignaturePage"
  | "setSignatureSearch"
  | "setSignatureStatus"
  | "signatureContractStatus"
  | "signatureLevel"
  | "signaturePage"
  | "signatureSearch"
  | "signatureStatus"
  | "signatures"
  | "signaturesError"
  | "signaturesLoading"
>;

export function AdminContractsSignaturesTab({
  locale,
  openSignatureDialog,
  setSignatureContractStatus,
  setSignatureLevel,
  setSignaturePage,
  setSignatureSearch,
  setSignatureStatus,
  signatureContractStatus,
  signatureLevel,
  signaturePage,
  signatureSearch,
  signatureStatus,
  signatures,
  signaturesError,
  signaturesLoading,
}: AdminContractsSignaturesTabProps) {
  const t = useTranslations("admin.contracts");

  return (
    <div className="space-y-6">
      <AdminErrorBanner
        title={t("signatures_tab.errors.title")}
        message={signaturesError}
      />

      <AdminSectionCard
        title={t("signatures_tab.filters.title")}
        description={t("signatures_tab.filters.description")}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdminSearchInput
            value={signatureSearch}
            onChange={(event) => {
              setSignatureSearch(event.target.value);
              setSignaturePage(1);
            }}
            placeholder={t("signatures_tab.filters.search")}
            className="relative xl:col-span-2"
          />
          <Select
            value={signatureStatus}
            onValueChange={(value) => {
              setSignatureStatus(value);
              setSignaturePage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("signatures_tab.filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {SIGNATURE_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanizeCode(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={signatureLevel}
            onValueChange={(value) => {
              setSignatureLevel(value);
              setSignaturePage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("signatures_tab.filters.signature_level")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {SIGNATURE_LEVEL_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={signatureContractStatus}
            onValueChange={(value) => {
              setSignatureContractStatus(value);
              setSignaturePage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("signatures_tab.filters.contract_status")} />
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
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title={t("signatures_tab.list.title")}
        description={t("signatures_tab.list.description", {
          count: signatures?.total ?? 0,
        })}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("signatures_tab.table.contract")}</th>
                <th className="px-4 py-3">{t("signatures_tab.table.flow_status")}</th>
                <th className="px-4 py-3">{t("signatures_tab.table.status")}</th>
                <th className="px-4 py-3">{t("signatures_tab.table.sent_at")}</th>
                <th className="px-4 py-3">{t("signatures_tab.table.last_event_at")}</th>
                <th className="px-4 py-3">{t("signatures_tab.table.events")}</th>
                <th className="px-4 py-3">{t("signatures_tab.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {signaturesLoading ? <AdminTableLoadingRow colSpan={7} /> : null}
              {!signaturesLoading && (signatures?.data.length ?? 0) === 0 ? (
                <EmptyTableMessage
                  icon={Signature}
                  title={t("signatures_tab.empty_title")}
                  description={t("signatures_tab.empty_description")}
                  colSpan={7}
                />
              ) : null}
              {!signaturesLoading
                ? signatures?.data.map((signature) => (
                    <tr
                      key={signature.id}
                      className="border-b border-border/60 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium">
                          {signature.contract?.reference ?? t("common.unavailable")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {signature.flow_reference ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {signature.flow_status ? (
                          <Badge
                            variant="outline"
                            className={getToneClass(signature.flow_status)}
                          >
                            {humanizeCode(signature.flow_status)}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={getToneClass(signature.status)}>
                          {humanizeCode(signature.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {formatDateTime(signature.sent_at, locale) ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        {formatDateTime(signature.last_event_at, locale) ?? "—"}
                      </td>
                      <td className="px-4 py-4">{signature.events_count}</td>
                      <td className="px-4 py-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openSignatureDialog(signature.id)}
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
              current: signatures?.current_page ?? 1,
              total: signatures?.last_page ?? 1,
            })}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={(signatures?.current_page ?? 1) <= 1}
              onClick={() => setSignaturePage((current) => Math.max(1, current - 1))}
            >
              {t("common.previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={(signatures?.current_page ?? 1) >= (signatures?.last_page ?? 1)}
              onClick={() =>
                setSignaturePage((current) =>
                  Math.min(signatures?.last_page ?? current, current + 1)
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
