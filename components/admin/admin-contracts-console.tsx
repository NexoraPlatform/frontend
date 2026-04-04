"use client";

import { startTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { AdminSpinner } from "@/components/admin/admin-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdminContractsContractDialog } from "./admin-contracts-console/_components/admin-contracts-contract-dialog";
import { AdminContractsContractsTab } from "./admin-contracts-console/_components/admin-contracts-contracts-tab";
import { AdminContractsOverviewTab } from "./admin-contracts-console/_components/admin-contracts-overview-tab";
import { AdminContractsReviewDialog } from "./admin-contracts-console/_components/admin-contracts-review-dialog";
import { AdminContractsReviewsTab } from "./admin-contracts-console/_components/admin-contracts-reviews-tab";
import { AdminContractsSignatureDialog } from "./admin-contracts-console/_components/admin-contracts-signature-dialog";
import { AdminContractsSignaturesTab } from "./admin-contracts-console/_components/admin-contracts-signatures-tab";
import { useAdminContractsConsoleController } from "./admin-contracts-console/_hooks/use-admin-contracts-console-controller";
import type { ContractsAdminTab } from "./admin-contracts-console/_lib/admin-contracts-console-types";

export function AdminContractsConsole() {
  const t = useTranslations("admin.contracts");
  const controller = useAdminContractsConsoleController();

  if (controller.shouldShowLoadingShell) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminSpinner />
        </div>
      </ProjectAdminShell>
    );
  }

  if (!controller.hasAnyContractAccess) {
    return null;
  }

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("title")}
          description={t("description")}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void controller.refreshActiveTab();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("actions.refresh")}
            </Button>
          }
        />

        <Tabs
          value={controller.activeTab}
          onValueChange={(value) => {
            startTransition(() => controller.setActiveTab(value as ContractsAdminTab));
          }}
          className="space-y-6"
        >
          <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            {controller.canViewContracts ? (
              <TabsTrigger value="contracts">{t("tabs.contracts")}</TabsTrigger>
            ) : null}
            {controller.canReadReviews ? (
              <TabsTrigger value="reviews">{t("tabs.reviews")}</TabsTrigger>
            ) : null}
            {controller.canReadSignatures ? (
              <TabsTrigger value="signatures">{t("tabs.signatures")}</TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="overview">
            <AdminContractsOverviewTab {...controller} />
          </TabsContent>

          <TabsContent value="contracts">
            <AdminContractsContractsTab {...controller} />
          </TabsContent>

          <TabsContent value="reviews">
            <AdminContractsReviewsTab {...controller} />
          </TabsContent>

          <TabsContent value="signatures">
            <AdminContractsSignaturesTab {...controller} />
          </TabsContent>
        </Tabs>

        <AdminContractsContractDialog {...controller} />
        <AdminContractsReviewDialog {...controller} />
        <AdminContractsSignatureDialog {...controller} />
      </div>
    </ProjectAdminShell>
  );
}
