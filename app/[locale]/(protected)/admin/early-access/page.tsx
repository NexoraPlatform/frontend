"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  UserCheck,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import { AdminEmptyState, AdminSpinner } from "@/components/admin/admin-state";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEarlyAccessGrouped } from "@/hooks/use-api";

type ProviderEntry = {
  id: number;
  application_id: string;
  user_type: "provider";
  full_name: string;
  email: string;
  country?: string | null;
  score: number;
  language: "ro" | "en";
  email_verification: boolean;
  email_verification_expired: boolean;
  email_verification_sent_at: string | null;
  email_verification_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type ClientEntry = {
  id: number;
  application_id: string;
  user_type: "client";
  contact_name: string;
  company_name: string;
  email: string;
  country?: string | null;
  score: number;
  language: "ro" | "en";
  email_verification: boolean;
  email_verification_expired: boolean;
  email_verification_sent_at: string | null;
  email_verification_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type EarlyAccessResponse = {
  providers: ProviderEntry[];
  clients: ClientEntry[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

type CombinedEntry =
  | (ProviderEntry & { displayName: string; organization: string })
  | (ClientEntry & { displayName: string; organization: string });

const formatDate = (value: string, locale: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatDateTime = (value: string | null, locale: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(locale === "ro" ? "ro-RO" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getVerificationBadgeClassName = (verified: boolean, expired: boolean) => {
  if (verified) {
    return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
  }

  if (expired) {
    return "bg-destructive/20 text-destructive";
  }

  return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
};

export default function AdminEarlyAccessPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("providers");

  const { data, loading, error } = useEarlyAccessGrouped() as {
    data: EarlyAccessResponse | null;
    loading: boolean;
    error: string | null;
  };

  const manageTitle = t("admin.early_access.manage_title");
  const manageSubtitle = t("admin.early_access.manage_subtitle");
  const providersTitle = t("admin.early_access.providers.title");
  const providersDescription = t("admin.early_access.providers.description");
  const providersEmpty = t("admin.early_access.providers.empty");
  const clientsTitle = t("admin.early_access.clients.title");
  const clientsDescription = t("admin.early_access.clients.description");
  const clientsEmpty = t("admin.early_access.clients.empty");
  const errorMessage = t("admin.early_access.error");
  const nameLabel = t("admin.early_access.columns.name");
  const contactNameLabel = t("admin.early_access.columns.contact_name");
  const companyNameLabel = t("admin.early_access.columns.company_name");
  const emailLabel = t("admin.early_access.columns.email");
  const countryLabel = t("admin.early_access.columns.country");
  const applicationIdLabel = t("admin.early_access.columns.application_id");
  const languageLabel = t("admin.early_access.columns.language");
  const scoreLabel = t("admin.early_access.columns.score");
  const verificationLabel = t("admin.early_access.columns.verification");
  const verificationSentLabel = t("admin.early_access.columns.verification_sent");
  const verificationExpiresLabel = t("admin.early_access.columns.verification_expires");
  const createdAtLabel = t("admin.early_access.columns.created_at");
  const verifiedLabel = t("admin.early_access.status.verified");
  const unverifiedLabel = t("admin.early_access.status.unverified");
  const expiredLabel = t("admin.early_access.status.expired");
  const paginationLabel = t("admin.early_access.pagination");
  const searchPlaceholder = t("admin.early_access.search_placeholder");
  const summaryTitle = t("admin.early_access.summary.title");
  const summaryDescription = t("admin.early_access.summary.description");
  const totalApplicationsLabel = t("admin.early_access.summary.cards.total");
  const verifiedApplicationsLabel = t("admin.early_access.summary.cards.verified");
  const pendingApplicationsLabel = t("admin.early_access.summary.cards.pending");
  const averageScoreLabel = t("admin.early_access.summary.cards.average_score");

  const providers = data?.providers ?? [];
  const clients = data?.clients ?? [];
  const pagination = data?.pagination;

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const haystack = [
        provider.full_name,
        provider.email,
        provider.application_id,
        provider.country,
        provider.language,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm.toLowerCase());
    });
  }, [providers, searchTerm]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const haystack = [
        client.contact_name,
        client.company_name,
        client.email,
        client.application_id,
        client.country,
        client.language,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm.toLowerCase());
    });
  }, [clients, searchTerm]);

  const summaryCards = useMemo(() => {
    const combined = [...providers, ...clients];
    const verifiedCount = combined.filter((entry) => entry.email_verification).length;
    const pendingCount = combined.filter(
      (entry) => !entry.email_verification && !entry.email_verification_expired
    ).length;
    const averageScore =
      combined.length > 0
        ? Math.round(combined.reduce((sum, entry) => sum + (entry.score ?? 0), 0) / combined.length)
        : 0;

    return [
      {
        title: totalApplicationsLabel,
        value: combined.length,
        icon: Users,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: verifiedApplicationsLabel,
        value: verifiedCount,
        icon: CheckCircle2,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: pendingApplicationsLabel,
        value: pendingCount,
        icon: Clock3,
        color: "bg-gradient-to-br from-orange-500 to-amber-400",
      },
      {
        title: averageScoreLabel,
        value: averageScore,
        icon: ArrowUpRight,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
    ];
  }, [
    averageScoreLabel,
    clients,
    pendingApplicationsLabel,
    providers,
    totalApplicationsLabel,
    verifiedApplicationsLabel,
  ]);

  const renderTable = (
    rows: CombinedEntry[],
    emptyText: string,
    description: string,
    isProviders: boolean
  ) => {
    if (loading) {
      return <AdminSpinner />;
    }

    if (error) {
      return <p className="text-sm text-destructive">{`${errorMessage} ${error}`}</p>;
    }

    if (rows.length === 0) {
      return (
        <AdminEmptyState
          icon={UserCheck}
          description={emptyText}
          className="py-16 text-center"
        />
      );
    }

    return (
      <>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {isProviders ? nameLabel : contactNameLabel}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {isProviders ? applicationIdLabel : companyNameLabel}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {emailLabel}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {countryLabel}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {languageLabel}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {scoreLabel}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {verificationLabel}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {verificationSentLabel}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {verificationExpiresLabel}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {createdAtLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const verificationLabelValue = row.email_verification
                  ? verifiedLabel
                  : row.email_verification_expired
                    ? expiredLabel
                    : unverifiedLabel;

                return (
                  <motion.tr
                    key={`${row.user_type}-${row.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.04, duration: 0.35 }}
                    className="group border-b border-border/50 transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium">{row.displayName || "-"}</p>
                        {!isProviders ? (
                          <p className="mt-1 text-xs text-muted-foreground">{row.application_id || "-"}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {row.organization || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{row.email || "-"}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{row.country || "-"}</td>
                    <td className="px-4 py-4 text-sm uppercase text-muted-foreground">{row.language || "-"}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                        {row.score ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getVerificationBadgeClassName(
                          row.email_verification,
                          row.email_verification_expired
                        )}`}
                      >
                        {verificationLabelValue}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDateTime(row.email_verification_sent_at, locale)}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDateTime(row.email_verification_expires_at, locale)}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDate(row.created_at, locale)}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const providerRows: CombinedEntry[] = filteredProviders.map((provider) => ({
    ...provider,
    displayName: provider.full_name,
    organization: provider.application_id,
  }));

  const clientRows: CombinedEntry[] = filteredClients.map((client) => ({
    ...client,
    displayName: client.contact_name,
    organization: client.company_name,
  }));

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={manageTitle}
          description={
            <>
              {manageSubtitle}
              {pagination ? (
                <span className="mt-2 block text-xs text-muted-foreground">
                  {paginationLabel
                    .replace("{current}", String(pagination.current_page))
                    .replace("{last}", String(pagination.last_page))
                    .replace("{total}", String(pagination.total))
                    .replace("{per_page}", String(pagination.per_page))}
                </span>
              ) : null}
            </>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorClassName={card.color}
              delay={index * 0.08}
            />
          ))}
        </div>

        <AdminSectionCard
          delay={0.2}
          title={summaryTitle}
          description={summaryDescription}
          action={
            <AdminSearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              className="relative w-full lg:max-w-sm"
            />
          }
          headerClassName="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2 bg-secondary/40">
              <TabsTrigger value="providers" className="gap-2">
                <UserCheck className="h-4 w-4" />
                {providersTitle}
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-2">
                <Users className="h-4 w-4" />
                {clientsTitle}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="mt-0">
              {renderTable(
                providerRows,
                providersEmpty,
                providersDescription.replace("{count}", String(filteredProviders.length)),
                true
              )}
            </TabsContent>

            <TabsContent value="clients" className="mt-0">
              {renderTable(
                clientRows,
                clientsEmpty,
                clientsDescription.replace("{count}", String(filteredClients.length)),
                false
              )}
            </TabsContent>
          </Tabs>
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
