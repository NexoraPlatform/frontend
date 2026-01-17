"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { useEarlyAccessGrouped } from "@/hooks/use-api";
import { useLocale } from "@/hooks/use-locale";
import { useAsyncTranslation } from "@/hooks/use-async-translation";

type ProviderEntry = {
  id: number;
  user_type: "provider";
  full_name: string;
  email: string;
  score: number;
  created_at: string;
  updated_at: string;
};

type ClientEntry = {
  id: number;
  user_type: "client";
  contact_name: string;
  company_name: string;
  email: string;
  score: number;
  created_at: string;
  updated_at: string;
};

type EarlyAccessResponse = {
  providers: ProviderEntry[];
  clients: ClientEntry[];
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

export default function AdminEarlyAccessPage() {
  const locale = useLocale();
  const { data, loading, error } = useEarlyAccessGrouped() as {
    data: EarlyAccessResponse | null;
    loading: boolean;
    error: string | null;
  };

  const manageTitle = useAsyncTranslation(locale, "admin.early_access.manage_title");
  const manageSubtitle = useAsyncTranslation(locale, "admin.early_access.manage_subtitle");
  const providersTitle = useAsyncTranslation(locale, "admin.early_access.providers.title");
  const providersDescription = useAsyncTranslation(locale, "admin.early_access.providers.description");
  const providersEmpty = useAsyncTranslation(locale, "admin.early_access.providers.empty");
  const clientsTitle = useAsyncTranslation(locale, "admin.early_access.clients.title");
  const clientsDescription = useAsyncTranslation(locale, "admin.early_access.clients.description");
  const clientsEmpty = useAsyncTranslation(locale, "admin.early_access.clients.empty");
  const errorMessage = useAsyncTranslation(locale, "admin.early_access.error");
  const nameLabel = useAsyncTranslation(locale, "admin.early_access.columns.name");
  const contactNameLabel = useAsyncTranslation(locale, "admin.early_access.columns.contact_name");
  const companyNameLabel = useAsyncTranslation(locale, "admin.early_access.columns.company_name");
  const emailLabel = useAsyncTranslation(locale, "admin.early_access.columns.email");
  const scoreLabel = useAsyncTranslation(locale, "admin.early_access.columns.score");
  const createdAtLabel = useAsyncTranslation(locale, "admin.early_access.columns.created_at");

  const providers = data?.providers ?? [];
  const clients = data?.clients ?? [];

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
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
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
                        <TableHead>{emailLabel}</TableHead>
                        <TableHead>{scoreLabel}</TableHead>
                        <TableHead>{createdAtLabel}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers.map((provider) => (
                        <TableRow key={provider.id}>
                          <TableCell className="font-medium">{provider.full_name || "-"}</TableCell>
                          <TableCell>{provider.email || "-"}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                              {provider.score ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(provider.created_at, locale)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

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
                        <TableHead>{emailLabel}</TableHead>
                        <TableHead>{scoreLabel}</TableHead>
                        <TableHead>{createdAtLabel}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.contact_name || "-"}</TableCell>
                          <TableCell>{client.company_name || "-"}</TableCell>
                          <TableCell>{client.email || "-"}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                              {client.score ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(client.created_at, locale)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
