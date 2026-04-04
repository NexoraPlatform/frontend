"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  MailCheck,
  Send,
  TriangleAlert,
  Users,
} from "lucide-react";
import Editor from "react-simple-wysiwyg";
import { useLocale, useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminOverviewItem,
  AdminSidebarCard,
} from "@/components/admin/admin-sidebar-card";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminEmptyState,
  AdminSpinner,
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api";
import type { Locale } from "@/types/locale";

const parseRecipients = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

type NewsletterSubscriber = {
  id: number;
  email: string;
  name: string | null;
  user_type: "client" | "provider";
  company: string | null;
  language: "ro" | "en";
  subscribed_at: string;
  unsubscribed_at: string | null;
};

export default function AdminNewsletterPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [templates, setTemplates] = useState<string[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [templateContentLoading, setTemplateContentLoading] = useState(false);
  const [templateContentError, setTemplateContentError] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [subscribersError, setSubscribersError] = useState<string | null>(null);
  const [subscriberSearch, setSubscriberSearch] = useState("");
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
        setTemplatesError(
          error instanceof Error ? error.message : t("admin.newsletter.template_empty")
        );
      } finally {
        if (active) setTemplatesLoading(false);
      }
    };

    void fetchTemplates();

    return () => {
      active = false;
    };
  }, [t]);

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
        setSubscribersError(
          error instanceof Error ? error.message : t("admin.newsletter.list_error")
        );
      } finally {
        if (active) setSubscribersLoading(false);
      }
    };

    void fetchSubscribers();

    return () => {
      active = false;
    };
  }, [onlyActive, perPage, t]);

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
        setTemplateContentError(
          error instanceof Error ? error.message : t("admin.newsletter.preview_error")
        );
      } finally {
        if (active) setTemplateContentLoading(false);
      }
    };

    void fetchTemplateContent();

    return () => {
      active = false;
    };
  }, [template, t]);

  useEffect(() => {
    setSubject(template || "Newsletter");
  }, [template]);

  const previewHtml = useMemo(() => {
    if (!templateContent) {
      return "";
    }

    const stripBladePhp = (html: string) =>
      html
        .replace(/@php[\s\S]*?@endphp/g, "")
        .replace(/@php[\s\S]*?(?:\n|$)/g, "");

    const previewData: Record<string, string> = {
      "$subscriber->company": "Trustora SRL",
      "$unsubscribeUrl": "https://trustora.ro/unsubscribe",
      "$language": language,
      "$payload['title']": subject || "Newsletter",
      "$subscriber->name": "Ion Popescu",
      "$payload['message']": dataMessage || t("admin.newsletter.preview_default_message"),
    };

    const replaceBladeVariable = (html: string, key: string, value: string) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexBlade = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, "g");
      const regexBladeRaw = new RegExp(`\\{!!\\s*${escapedKey}\\s*!!\\}`, "g");
      return html.replace(regexBlade, value).replace(regexBladeRaw, value);
    };

    return Object.entries(previewData).reduce(
      (current, [key, value]) => replaceBladeVariable(current, key, value),
      stripBladePhp(templateContent)
    );
  }, [dataMessage, language, subject, t, templateContent]);

  const canSend = useMemo(() => Boolean(template && subject && !isSending), [
    isSending,
    subject,
    template,
  ]);

  const recipientList = useMemo(() => parseRecipients(recipients), [recipients]);

  const filteredSubscribers = useMemo(() => {
    const query = subscriberSearch.trim().toLowerCase();
    if (!query) return subscribers;

    return subscribers.filter((subscriber) =>
      [
        subscriber.email,
        subscriber.name,
        subscriber.company,
        subscriber.user_type,
        subscriber.language,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [subscriberSearch, subscribers]);

  const summaryCards = useMemo(
    () => [
      {
        title: t("admin.newsletter.summary.cards.templates"),
        value: templates.length,
        icon: Mail,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.newsletter.summary.cards.active_subscribers"),
        value: subscribers.filter((subscriber) => !subscriber.unsubscribed_at).length,
        icon: MailCheck,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: t("admin.newsletter.summary.cards.clients"),
        value: subscribers.filter((subscriber) => subscriber.user_type === "client").length,
        icon: Users,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
      {
        title: t("admin.newsletter.summary.cards.recipients"),
        value: recipientList.length,
        icon: Send,
        color: "bg-gradient-to-br from-orange-500 to-amber-400",
      },
    ],
    [recipientList.length, subscribers, t, templates.length]
  );

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;

    setIsSending(true);
    setSendError(null);
    setSendCount(null);

    const payload: Parameters<typeof apiClient.sendNewsletter>[0] = {
      template,
      subject,
      data:
        subject || dataMessage
          ? {
              title: subject,
              message: dataMessage,
            }
          : undefined,
      user_type: userType === "all" ? undefined : userType,
      recipients: recipientList.length > 0 ? recipientList : undefined,
      language,
    };

    try {
      const response = await apiClient.sendNewsletter(payload);
      setSendCount(response?.sent ?? 0);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : t("admin.newsletter.error_message"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.newsletter.title")}
          description={t("admin.newsletter.subtitle")}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={String(card.title)}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorClassName={card.color}
              delay={index * 0.08}
            />
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <AdminSectionCard
            delay={0.15}
            title={t("admin.newsletter.composer_title")}
            description={t("admin.newsletter.composer_description")}
          >
            <form className="space-y-6" onSubmit={handleSend}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("admin.newsletter.template_label")}</Label>
                  {templatesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("admin.newsletter.template_loading")}</span>
                    </div>
                  ) : templatesError ? (
                    <p className="text-sm text-red-500">{templatesError}</p>
                  ) : templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("admin.newsletter.template_empty")}
                    </p>
                  ) : (
                    <Select value={template} onValueChange={setTemplate}>
                      <SelectTrigger className="border-border bg-transparent">
                        <SelectValue
                          placeholder={t("admin.newsletter.template_placeholder")}
                        />
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
                  <Label>{t("admin.newsletter.user_type_label")}</Label>
                  <Select
                    value={userType}
                    onValueChange={(value) => setUserType(value as typeof userType)}
                  >
                    <SelectTrigger className="border-border bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("admin.newsletter.user_type_all")}
                      </SelectItem>
                      <SelectItem value="client">
                        {t("admin.newsletter.user_type_client")}
                      </SelectItem>
                      <SelectItem value="provider">
                        {t("admin.newsletter.user_type_provider")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("admin.newsletter.language_label")}</Label>
                  <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as typeof language)}
                  >
                    <SelectTrigger className="border-border bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ro">{t("admin.newsletter.language_ro")}</SelectItem>
                      <SelectItem value="en">{t("admin.newsletter.language_en")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("admin.newsletter.subject_label")}</Label>
                  <Input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder={t("admin.newsletter.subject_placeholder")}
                    disabled={!isCustomTemplate}
                    className="border-border bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("admin.newsletter.data_message_label")}</Label>
                <div className="rounded-xl border border-border bg-background/40">
                  <Editor value={dataMessage} onChange={(event) => setDataMessage(event.target.value)} />
                </div>
                {!isCustomTemplate ? (
                  <p className="text-xs text-muted-foreground">
                    {t("admin.newsletter.custom_only_note")}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>{t("admin.newsletter.recipients_label")}</Label>
                <Input
                  value={recipients}
                  onChange={(event) => setRecipients(event.target.value)}
                  placeholder={t("admin.newsletter.recipients_placeholder")}
                  className="border-border bg-transparent"
                />
              </div>

              {sendCount !== null ? (
                <Alert className="border-emerald-200/60 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>
                    {t("admin.newsletter.success_message", { count: sendCount })}
                  </AlertTitle>
                </Alert>
              ) : null}

              {sendError ? (
                <Alert variant="destructive">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>{t("admin.newsletter.error_message")}</AlertTitle>
                  <AlertDescription>{sendError}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                disabled={!canSend}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSending
                  ? t("admin.newsletter.sending_button")
                  : t("admin.newsletter.send_button")}
              </Button>
            </form>
          </AdminSectionCard>

          <div className="space-y-6">
            <AdminSidebarCard
              icon={Mail}
              title={t("admin.newsletter.preview_title")}
              description={t("admin.newsletter.preview_note")}
              delay={0.18}
            >
              {templateContentLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("admin.newsletter.preview_loading")}</span>
                </div>
              ) : templateContentError ? (
                <p className="text-sm text-red-500">{templateContentError}</p>
              ) : !templateContent ? (
                <AdminEmptyState
                  icon={Mail}
                  title={t("admin.newsletter.preview_empty")}
                  className="py-10 text-center"
                />
              ) : (
                <div className="rounded-xl border border-border bg-background/40 p-2">
                  <iframe
                    srcDoc={previewHtml}
                    className="h-[480px] w-full rounded-lg bg-white"
                    title={t("admin.newsletter.preview_frame_title")}
                  />
                </div>
              )}
            </AdminSidebarCard>

            <AdminSidebarCard
              icon={Users}
              title={t("admin.newsletter.sidebar_title")}
              description={t("admin.newsletter.sidebar_description")}
              delay={0.26}
            >
              <div className="space-y-3">
                <AdminOverviewItem
                  label={t("admin.newsletter.sidebar.template")}
                  value={template || "-"}
                />
                <AdminOverviewItem
                  label={t("admin.newsletter.sidebar.audience")}
                  value={
                    userType === "all"
                      ? t("admin.newsletter.user_type_all")
                      : userType === "client"
                        ? t("admin.newsletter.user_type_client")
                        : t("admin.newsletter.user_type_provider")
                  }
                />
                <AdminOverviewItem
                  label={t("admin.newsletter.sidebar.language")}
                  value={
                    language === "ro"
                      ? t("admin.newsletter.language_ro")
                      : t("admin.newsletter.language_en")
                  }
                />
                <AdminOverviewItem
                  label={t("admin.newsletter.sidebar.explicit_recipients")}
                  value={String(recipientList.length)}
                />
              </div>
            </AdminSidebarCard>
          </div>
        </div>

        <AdminSectionCard
          delay={0.28}
          title={t("admin.newsletter.list_title")}
          description={t("admin.newsletter.list_description")}
          action={
            <div className="flex flex-wrap items-center gap-4">
              <AdminSearchInput
                value={subscriberSearch}
                onChange={(event) => setSubscriberSearch(event.target.value)}
                placeholder={t("admin.newsletter.subscriber_search_placeholder")}
                className="relative w-full sm:w-80"
              />
              <div className="flex items-center gap-3">
                <Label className="text-sm">{t("admin.newsletter.per_page_label")}</Label>
                <Select value={perPage} onValueChange={setPerPage}>
                  <SelectTrigger className="h-11 w-28 border-border bg-transparent">
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
              <div className="flex items-center gap-2">
                <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
                <span className="text-sm text-muted-foreground">
                  {t("admin.newsletter.only_active_label")}
                </span>
              </div>
            </div>
          }
          headerClassName="flex-col items-start gap-4 xl:flex-row xl:items-center xl:justify-between"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.newsletter.columns.email")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.newsletter.columns.name")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.newsletter.columns.user_type")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.newsletter.columns.company")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.newsletter.columns.language")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.newsletter.columns.subscribed_at")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.newsletter.columns.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribersLoading ? <AdminTableLoadingRow colSpan={7} /> : null}

                {!subscribersLoading &&
                subscribersError ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-sm text-red-500">
                      {subscribersError}
                    </td>
                  </tr>
                ) : null}

                {!subscribersLoading &&
                  !subscribersError &&
                  filteredSubscribers.map((subscriber) => (
                    <tr
                      key={subscriber.id}
                      className="border-b border-border/70 transition-colors hover:bg-secondary/20"
                    >
                      <td className="px-4 py-4 align-top font-medium">{subscriber.email}</td>
                      <td className="px-4 py-4 align-top">{subscriber.name || "-"}</td>
                      <td className="px-4 py-4 align-top">
                        <Badge variant="secondary">
                          {subscriber.user_type === "client"
                            ? t("admin.newsletter.user_type_client")
                            : t("admin.newsletter.user_type_provider")}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top">{subscriber.company || "-"}</td>
                      <td className="px-4 py-4 align-top">
                        <Badge variant="outline" className="uppercase">
                          {subscriber.language}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {new Date(subscriber.subscribed_at).toLocaleDateString(
                          locale === "en" ? "en-US" : "ro-RO"
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge
                          className={
                            subscriber.unsubscribed_at
                              ? "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                          }
                        >
                          {subscriber.unsubscribed_at
                            ? t("admin.newsletter.status_inactive")
                            : t("admin.newsletter.status_active")}
                        </Badge>
                      </td>
                    </tr>
                  ))}

                {!subscribersLoading && !subscribersError && filteredSubscribers.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={7}
                    icon={Users}
                    title={t("admin.newsletter.list_empty")}
                    description={t("admin.newsletter.list_empty_description")}
                  />
                ) : null}
              </tbody>
            </table>
          </div>
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
