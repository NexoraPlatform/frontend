"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from '@/lib/navigation';
import { ArrowLeft, CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { useLocale, useTranslations } from "next-intl";
import apiClient from "@/lib/api";
import {Textarea} from "@/components/ui/textarea";
import Editor from 'react-simple-wysiwyg';

const parseRecipients = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export default function AdminNewsletterPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [templates, setTemplates] = useState<string[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [templateContentLoading, setTemplateContentLoading] = useState(false);
  const [templateContentError, setTemplateContentError] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<{
    id: number;
    email: string;
    name: string | null;
    user_type: "client" | "provider";
    company: string | null;
    language: "ro" | "en";
    subscribed_at: string;
    unsubscribed_at: string | null;
  }[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [subscribersError, setSubscribersError] = useState<string | null>(null);
  const [perPage, setPerPage] = useState("50");
  const [onlyActive, setOnlyActive] = useState(true);
  const [template, setTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [dataMessage, setDataMessage] = useState("");
  const [userType, setUserType] = useState<"all" | "client" | "provider">("all");
  const [language, setLanguage] = useState<"ro" | "en">("ro");
  const [recipients, setRecipients] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendCount, setSendCount] = useState<number | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const isCustomTemplate = template === "custom";

  const titleText = t("admin.newsletter.title");
  const subtitleText = t("admin.newsletter.subtitle");
  const templateLabel = t("admin.newsletter.template_label");
  const templatePlaceholder = t("admin.newsletter.template_placeholder");
  const templateLoadingText = t("admin.newsletter.template_loading");
  const templateEmptyText = t("admin.newsletter.template_empty");
  const dataMessageLabel = t("admin.newsletter.data_message_label");
  const dataMessagePlaceholder = t("admin.newsletter.data_message_placeholder");
  const userTypeLabel = t("admin.newsletter.user_type_label");
  const userTypeAll = t("admin.newsletter.user_type_all");
  const userTypeClient = t("admin.newsletter.user_type_client");
  const userTypeProvider = t("admin.newsletter.user_type_provider");
  const languageLabel = t("admin.newsletter.language_label");
  const languageRo = t("admin.newsletter.language_ro");
  const languageEn = t("admin.newsletter.language_en");
  const previewTitle = t("admin.newsletter.preview_title");
  const previewLoading = t("admin.newsletter.preview_loading");
  const previewEmpty = t("admin.newsletter.preview_empty");
  const previewError = t("admin.newsletter.preview_error");
  const previewNote = t("admin.newsletter.preview_note");
  const customOnlyNote = t("admin.newsletter.custom_only_note");
  const recipientsLabel = t("admin.newsletter.recipients_label")",
  );
  const recipientsPlaceholder = t("admin.newsletter.recipients_placeholder");
  const sendButton = t("admin.newsletter.send_button");
  const sendingButton = t("admin.newsletter.sending_button");
  const successMessage = t("admin.newsletter.success_message");
  const errorMessage = t("admin.newsletter.error_message");
  const listTitle = t("admin.newsletter.list_title");
  const listDescription = t("admin.newsletter.list_description");
  const listLoading = t("admin.newsletter.list_loading");
  const listEmpty = t("admin.newsletter.list_empty");
  const listError = t("admin.newsletter.list_error");
  const perPageLabel = t("admin.newsletter.per_page_label");
  const onlyActiveLabel = t("admin.newsletter.only_active_label");
  const columnEmail = t("admin.newsletter.columns.email");
  const columnName = t("admin.newsletter.columns.name");
  const columnUserType = t("admin.newsletter.columns.user_type");
  const columnCompany = t("admin.newsletter.columns.company");
  const columnLanguage = t("admin.newsletter.columns.language");
  const columnSubscribedAt = t("admin.newsletter.columns.subscribed_at");
  const columnStatus = t("admin.newsletter.columns.status");
  const statusActive = t("admin.newsletter.status_active");
  const statusInactive = t("admin.newsletter.status_inactive");

  useEffect(() => {
    let active = true;

    const fetchTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const response = await apiClient.getNewsletterTemplates();
        if (!active) return;
        const list = response?.templates ?? [];
        setTemplates(list);
        if (list.length > 0) {
          setTemplate((current) => current || list[0]);
        }
      } catch (error) {
        if (!active) return;
        setTemplatesError(error instanceof Error ? error.message : templateEmptyText);
      } finally {
        if (active) setTemplatesLoading(false);
      }
    };

    fetchTemplates();

    return () => {
      active = false;
    };
  }, [templateEmptyText]);

  useEffect(() => {
    let active = true;

    const fetchSubscribers = async () => {
      setSubscribersLoading(true);
      setSubscribersError(null);
      try {
        const response = await apiClient.getNewsletterSubscribers({
          per_page: Number(perPage),
          only_active: onlyActive,
        });
        if (!active) return;
        setSubscribers(response?.data ?? []);
      } catch (error) {
        if (!active) return;
        setSubscribersError(error instanceof Error ? error.message : listError);
      } finally {
        if (active) setSubscribersLoading(false);
      }
    };

    fetchSubscribers();

    return () => {
      active = false;
    };
  }, [perPage, onlyActive, listError]);

  const canSend = useMemo(() => template && subject && !isSending, [template, subject, isSending]);

  const previewHtml = useMemo(() => {
    if (!templateContent) {
      return "";
    }

    const stripBladePhp = (html: string) =>
      html
        .replace(/@php[\s\S]*?@endphp/g, "")
        .replace(/@php[\s\S]*?(?:\n|$)/g, "");

    const defaultVariables: Record<string, string> = {
      "$subscriber->company": "Trustora SRL",
      "$unsubscribeUrl": "https://trustora.ro/unsubscribe",
      "$language": language,
      "$payload['title']": subject || "Newsletter",
      "$subscriber->name": "Ion Popescu",
      "$payload['message']": dataMessage || "Acesta este mesajul scris de mine.",
    };

    const replaceBladeVariable = (html: string, key: string, value: string) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexBlade = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, "g");
      const regexBladeRaw = new RegExp(`\\{!!\\s*${escapedKey}\\s*!!\\}`, "g");
      return html.replace(regexBlade, value).replace(regexBladeRaw, value);
    };

    return Object.entries(defaultVariables).reduce(
      (current, [key, value]) => replaceBladeVariable(current, key, value),
      stripBladePhp(templateContent),
    );
  }, [templateContent, subject, dataMessage, language]);

  useEffect(() => {
    if (!template) {
      setTemplateContent("");
      setTemplateContentError(null);
      return;
    }

    let active = true;
    const fetchTemplateContent = async () => {
      setTemplateContentLoading(true);
      setTemplateContentError(null);
      try {
        const response = await apiClient.getNewsletterTemplateContent(template);
        if (!active) return;
        setTemplateContent(response?.content ?? "");
      } catch (error) {
        if (!active) return;
        setTemplateContentError(error instanceof Error ? error.message : previewError);
      } finally {
        if (active) setTemplateContentLoading(false);
      }
    };

    fetchTemplateContent();

    return () => {
      active = false;
    };
  }, [template, previewError]);

  useEffect(() => {
    setSubject(template || "Newsletter");
  }, [template]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;

    setIsSending(true);
    setSendError(null);
    setSendCount(null);

    const recipientList = parseRecipients(recipients);
    const payload: Parameters<typeof apiClient.sendNewsletter>[0] = {
      template,
      subject,
      data: dataMessage ? { message: dataMessage } : undefined,
      user_type: userType === "all" ? undefined : userType,
      recipients: recipientList.length > 0 ? recipientList : undefined,
      language,
    };

    try {
      const response = await apiClient.sendNewsletter(payload);
      setSendCount(response?.sent ?? 0);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : errorMessage);
    } finally {
      setIsSending(false);
    }
  };

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

          <Card className="glass-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Send className="w-5 h-5" />
                <span>{titleText}</span>
              </CardTitle>
              <CardDescription>{subtitleText}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSend}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{templateLabel}</Label>
                    {templatesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{templateLoadingText}</span>
                      </div>
                    ) : templatesError ? (
                      <p className="text-sm text-red-500">{templatesError}</p>
                    ) : templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{templateEmptyText}</p>
                    ) : (
                      <Select value={template} onValueChange={setTemplate}>
                        <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
                          <SelectValue placeholder={templatePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{userTypeLabel}</Label>
                    <Select value={userType} onValueChange={(value) => setUserType(value as typeof userType)}>
                      <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{userTypeAll}</SelectItem>
                        <SelectItem value="client">{userTypeClient}</SelectItem>
                        <SelectItem value="provider">{userTypeProvider}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{languageLabel}</Label>
                    <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
                      <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ro">{languageRo}</SelectItem>
                        <SelectItem value="en">{languageEn}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{dataMessageLabel}</Label>
                  <div className="rounded-lg border border-border/60 bg-white/80 dark:border-slate-700/60 dark:bg-slate-900/60">

                    <Editor value={dataMessage} onChange={(e) => setDataMessage(e.target.value)} />

                  </div>
                  {!isCustomTemplate && (
                    <p className="text-xs text-muted-foreground">{customOnlyNote}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{recipientsLabel}</Label>
                  <Input
                    value={recipients}
                    onChange={(event) => setRecipients(event.target.value)}
                    placeholder={recipientsPlaceholder}
                    className="bg-white/80 dark:bg-slate-900/60"
                  />
                </div>

                <div className="space-y-3">
                  <Label>{previewTitle}</Label>
                  {templateContentLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{previewLoading}</span>
                    </div>
                  ) : templateContentError ? (
                    <p className="text-sm text-red-500">{templateContentError}</p>
                  ) : !templateContent ? (
                    <p className="text-sm text-muted-foreground">{previewEmpty}</p>
                  ) : (
                    <div className="rounded-xl border border-border/60 bg-white/80 p-2 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/70">
                      <iframe
                        srcDoc={previewHtml}
                        className="h-[480px] w-full rounded-lg bg-white"
                        title="Newsletter preview"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{previewNote}</p>
                </div>

                {sendCount !== null && (
                  <Alert className="border-emerald-200/60 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>{successMessage.replace("{count}", sendCount.toString())}</AlertTitle>
                  </Alert>
                )}

                {sendError && (
                  <Alert variant="destructive">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertTitle>{errorMessage}</AlertTitle>
                    <AlertDescription>{sendError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={!canSend} className="gap-2">
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isSending ? sendingButton : sendButton}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-sm mt-10">
            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-slate-900 dark:text-white">{listTitle}</CardTitle>
                <CardDescription>{listDescription}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-1">
                  <Label>{perPageLabel}</Label>
                  <Select value={perPage} onValueChange={setPerPage}>
                    <SelectTrigger className="w-32 bg-white/80 dark:bg-slate-900/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
                  <span className="text-sm text-muted-foreground">{onlyActiveLabel}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subscribersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{listLoading}</span>
                </div>
              ) : subscribersError ? (
                <p className="text-sm text-red-500">{subscribersError}</p>
              ) : subscribers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{listEmpty}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{columnEmail}</TableHead>
                      <TableHead>{columnName}</TableHead>
                      <TableHead>{columnUserType}</TableHead>
                      <TableHead>{columnCompany}</TableHead>
                      <TableHead>{columnLanguage}</TableHead>
                      <TableHead>{columnSubscribedAt}</TableHead>
                      <TableHead>{columnStatus}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>{subscriber.name || "-"}</TableCell>
                        <TableCell>{subscriber.user_type}</TableCell>
                        <TableCell>{subscriber.company || "-"}</TableCell>
                        <TableCell className="uppercase">{subscriber.language}</TableCell>
                        <TableCell>
                          {new Date(subscriber.subscribed_at).toLocaleDateString(
                            locale === "en" ? "en-US" : "ro-RO",
                          )}
                        </TableCell>
                        <TableCell>
                          {subscriber.unsubscribed_at ? statusInactive : statusActive}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
