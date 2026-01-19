"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { useAsyncTranslation } from "@/hooks/use-async-translation";
import { useLocale } from "@/hooks/use-locale";
import apiClient from "@/lib/api";

const parseRecipients = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export default function AdminNewsletterPage() {
  const locale = useLocale();
  const [templates, setTemplates] = useState<string[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [template, setTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [dataTitle, setDataTitle] = useState("");
  const [dataMessage, setDataMessage] = useState("");
  const [userType, setUserType] = useState<"all" | "client" | "provider">("all");
  const [recipients, setRecipients] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendCount, setSendCount] = useState<number | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const titleText = useAsyncTranslation(locale, "admin.newsletter.title", "Newsletter");
  const subtitleText = useAsyncTranslation(
    locale,
    "admin.newsletter.subtitle",
    "Trimite emailuri către abonați folosind template-uri predefinite.",
  );
  const templateLabel = useAsyncTranslation(locale, "admin.newsletter.template_label", "Template");
  const templatePlaceholder = useAsyncTranslation(locale, "admin.newsletter.template_placeholder", "Selectează template");
  const templateLoadingText = useAsyncTranslation(
    locale,
    "admin.newsletter.template_loading",
    "Se încarcă template-urile...",
  );
  const templateEmptyText = useAsyncTranslation(
    locale,
    "admin.newsletter.template_empty",
    "Nu există template-uri disponibile.",
  );
  const subjectLabel = useAsyncTranslation(locale, "admin.newsletter.subject_label", "Subiect");
  const subjectPlaceholder = useAsyncTranslation(locale, "admin.newsletter.subject_placeholder", "Ex: Bine ai venit!");
  const dataTitleLabel = useAsyncTranslation(locale, "admin.newsletter.data_title_label", "Titlu mesaj");
  const dataTitlePlaceholder = useAsyncTranslation(locale, "admin.newsletter.data_title_placeholder", "Ex: Salut!");
  const dataMessageLabel = useAsyncTranslation(locale, "admin.newsletter.data_message_label", "Mesaj");
  const dataMessagePlaceholder = useAsyncTranslation(
    locale,
    "admin.newsletter.data_message_placeholder",
    "Ex: Ne bucurăm că ești aici.",
  );
  const userTypeLabel = useAsyncTranslation(locale, "admin.newsletter.user_type_label", "Tip abonat");
  const userTypeAll = useAsyncTranslation(locale, "admin.newsletter.user_type_all", "Toți abonații");
  const userTypeClient = useAsyncTranslation(locale, "admin.newsletter.user_type_client", "Clienți");
  const userTypeProvider = useAsyncTranslation(locale, "admin.newsletter.user_type_provider", "Prestatori");
  const recipientsLabel = useAsyncTranslation(
    locale,
    "admin.newsletter.recipients_label",
    "Destinatari specifici (opțional)",
  );
  const recipientsPlaceholder = useAsyncTranslation(
    locale,
    "admin.newsletter.recipients_placeholder",
    "ex: ana@example.com, ioan@example.com",
  );
  const sendButton = useAsyncTranslation(locale, "admin.newsletter.send_button", "Trimite newsletter");
  const sendingButton = useAsyncTranslation(locale, "admin.newsletter.sending_button", "Se trimite...");
  const successMessage = useAsyncTranslation(
    locale,
    "admin.newsletter.success_message",
    "Trimis către {count} abonați.",
  );
  const errorMessage = useAsyncTranslation(
    locale,
    "admin.newsletter.error_message",
    "Nu am putut trimite newsletterul.",
  );

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

  const canSend = useMemo(() => template && subject && !isSending, [template, subject, isSending]);

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
      data: dataTitle || dataMessage ? { title: dataTitle, message: dataMessage } : undefined,
      user_type: userType === "all" ? undefined : userType,
      recipients: recipientList.length > 0 ? recipientList : undefined,
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
                    <Label>{subjectLabel}</Label>
                    <Input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder={subjectPlaceholder}
                      className="bg-white/80 dark:bg-slate-900/60"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{dataTitleLabel}</Label>
                    <Input
                      value={dataTitle}
                      onChange={(event) => setDataTitle(event.target.value)}
                      placeholder={dataTitlePlaceholder}
                      className="bg-white/80 dark:bg-slate-900/60"
                    />
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

                <div className="space-y-2">
                  <Label>{dataMessageLabel}</Label>
                  <Textarea
                    value={dataMessage}
                    onChange={(event) => setDataMessage(event.target.value)}
                    placeholder={dataMessagePlaceholder}
                    className="min-h-[120px] bg-white/80 dark:bg-slate-900/60"
                  />
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
        </div>
      </div>
    </>
  );
}
