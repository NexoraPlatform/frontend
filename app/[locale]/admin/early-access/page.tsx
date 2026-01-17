"use client";

import Link from "next/link";
import { ArrowLeft, Inbox, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { useAsyncTranslation } from "@/hooks/use-async-translation";
import { useEarlyAccessGrouped } from "@/hooks/use-api";
import { useLocale } from "@/hooks/use-locale";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("ro-RO");
};

export default function AdminEarlyAccessPage() {
  const locale = useLocale();
  const { data, loading, error } = useEarlyAccessGrouped();
  const titleText = useAsyncTranslation(locale, "admin.early_access.title", "Pre-early access");
  const subtitleText = useAsyncTranslation(
    locale,
    "admin.early_access.subtitle",
    "Persoanele înscrise înainte de lansarea oficială.",
  );
  const providersTitle = useAsyncTranslation(locale, "admin.early_access.providers_title", "Prestatori");
  const clientsTitle = useAsyncTranslation(locale, "admin.early_access.clients_title", "Clienți");
  const emptyText = useAsyncTranslation(locale, "admin.early_access.empty", "Nu există înscrieri încă.");
  const errorText = useAsyncTranslation(
    locale,
    "admin.early_access.error",
    "Nu am putut încărca înscrierile.",
  );

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
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{titleText}</h1>
                <p className="text-sm text-muted-foreground">{subtitleText}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 p-10 text-sm text-muted-foreground shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {titleText}
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-2xl border border-red-200/60 bg-red-50/80 p-6 text-sm text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
              {errorText}
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Users className="h-5 w-5" />
                    {providersTitle}
                  </CardTitle>
                  <CardDescription>{providers.length} înscrieri</CardDescription>
                </CardHeader>
                <CardContent>
                  {providers.length === 0 ? (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200/80 p-8 text-sm text-muted-foreground dark:border-slate-700/60">
                      <Inbox className="mr-2 h-4 w-4" />
                      {emptyText}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nume</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Creat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providers.map((provider) => (
                          <TableRow key={provider.id}>
                            <TableCell className="font-medium">{provider.full_name}</TableCell>
                            <TableCell>{provider.email}</TableCell>
                            <TableCell>{provider.score}</TableCell>
                            <TableCell>{formatDate(provider.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Users className="h-5 w-5" />
                    {clientsTitle}
                  </CardTitle>
                  <CardDescription>{clients.length} înscrieri</CardDescription>
                </CardHeader>
                <CardContent>
                  {clients.length === 0 ? (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200/80 p-8 text-sm text-muted-foreground dark:border-slate-700/60">
                      <Inbox className="mr-2 h-4 w-4" />
                      {emptyText}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contact</TableHead>
                          <TableHead>Companie</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.contact_name}</TableCell>
                            <TableCell>{client.company_name}</TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>{client.score}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
