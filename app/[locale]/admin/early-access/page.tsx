"use client";

import { Link } from '@/lib/navigation';
import { ArrowLeft, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { useEarlyAccessGrouped } from "@/hooks/use-api";
import { useLocale, useTranslations } from "next-intl";

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

const formatDate = (value: string, locale: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatDateTime = (value: string | null, locale: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(locale === "ro" ? "ro-RO" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminEarlyAccessPage() {
  const locale = useLocale();
  const t = useTranslations();
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

  const providers = data?.providers ?? [];
  const clients = data?.clients ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <TrustoraThemeStyles />
      <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{manageTitle}</h1>
                <p className="text-sm text-muted-foreground">{manageSubtitle}</p>
                {pagination && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {paginationLabel
                      .replace("{current}", pagination.current_page.toString())
                      .replace("{last}", pagination.last_page.toString())
                      .replace("{total}", pagination.total.toString())
                      .replace("{per_page}", pagination.per_page.toString())}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Tabs defaultValue="providers" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="providers" className="gap-2">
                <UserCheck className="w-4 h-4" />
                {providersTitle}
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-2">
                <UserCheck className="w-4 h-4" />
                {clientsTitle}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="providers">
              <Card className="glass-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                    <UserCheck className="w-5 h-5" />
                    <span>{providersTitle}</span>
                  </CardTitle>
                  <CardDescription>
                    {providersDescription.replace("{count}", providers.length.toString())}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : error ? (
                    <p className="text-sm text-red-500">{`${errorMessage} ${error}`}</p>
                  ) : providers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{providersEmpty}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{nameLabel}</TableHead>
                          <TableHead>{applicationIdLabel}</TableHead>
                          <TableHead>{emailLabel}</TableHead>
                          <TableHead>{countryLabel}</TableHead>
                          <TableHead>{languageLabel}</TableHead>
                          <TableHead>{scoreLabel}</TableHead>
                          <TableHead>{verificationLabel}</TableHead>
                          <TableHead>{verificationSentLabel}</TableHead>
                          <TableHead>{verificationExpiresLabel}</TableHead>
                          <TableHead>{createdAtLabel}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providers.map((provider) => (
                          <TableRow key={provider.id}>
                            <TableCell className="font-medium">{provider.full_name || "-"}</TableCell>
                            <TableCell className="font-medium">{provider.application_id || "-"}</TableCell>
                            <TableCell>{provider.email || "-"}</TableCell>
                            <TableCell>{provider.country || "-"}</TableCell>
                            <TableCell className="uppercase">{provider.language || "-"}</TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                                {provider.score ?? 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  provider.email_verification
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                                    : provider.email_verification_expired
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                                }
                              >
                                {provider.email_verification
                                  ? verifiedLabel
                                  : provider.email_verification_expired
                                  ? expiredLabel
                                  : unverifiedLabel}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(provider.email_verification_sent_at, locale)}</TableCell>
                            <TableCell>{formatDateTime(provider.email_verification_expires_at, locale)}</TableCell>
                            <TableCell>{formatDate(provider.created_at, locale)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="clients">
              <Card className="glass-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                    <UserCheck className="w-5 h-5" />
                    <span>{clientsTitle}</span>
                  </CardTitle>
                  <CardDescription>
                    {clientsDescription.replace("{count}", clients.length.toString())}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : error ? (
                    <p className="text-sm text-red-500">{`${errorMessage} ${error}`}</p>
                  ) : clients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{clientsEmpty}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{contactNameLabel}</TableHead>
                          <TableHead>{companyNameLabel}</TableHead>
                          <TableHead>{applicationIdLabel}</TableHead>
                          <TableHead>{emailLabel}</TableHead>
                          <TableHead>{countryLabel}</TableHead>
                          <TableHead>{languageLabel}</TableHead>
                          <TableHead>{scoreLabel}</TableHead>
                          <TableHead>{verificationLabel}</TableHead>
                          <TableHead>{verificationSentLabel}</TableHead>
                          <TableHead>{verificationExpiresLabel}</TableHead>
                          <TableHead>{createdAtLabel}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.contact_name || "-"}</TableCell>
                            <TableCell>{client.company_name || "-"}</TableCell>
                            <TableCell className="font-medium">{client.application_id || "-"}</TableCell>
                            <TableCell>{client.email || "-"}</TableCell>
                            <TableCell>{client.country || "-"}</TableCell>
                            <TableCell className="uppercase">{client.language || "-"}</TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                                {client.score ?? 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  client.email_verification
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                                    : client.email_verification_expired
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                                }
                              >
                                {client.email_verification
                                  ? verifiedLabel
                                  : client.email_verification_expired
                                  ? expiredLabel
                                  : unverifiedLabel}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(client.email_verification_sent_at, locale)}</TableCell>
                            <TableCell>{formatDateTime(client.email_verification_expires_at, locale)}</TableCell>
                            <TableCell>{formatDate(client.created_at, locale)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
