"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import MarkdownIt from "markdown-it";
import TurndownService from "turndown";
import { Extension } from "@tiptap/core";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const languageLabel = useAsyncTranslation(locale, "admin.newsletter.language_label", "Limba");
  const languageRo = useAsyncTranslation(locale, "admin.newsletter.language_ro", "Română");
  const languageEn = useAsyncTranslation(locale, "admin.newsletter.language_en", "Engleză");
  const previewTitle = useAsyncTranslation(locale, "admin.newsletter.preview_title", "Previzualizare live");
  const previewLoading = useAsyncTranslation(locale, "admin.newsletter.preview_loading", "Se încarcă preview-ul...");
  const previewEmpty = useAsyncTranslation(locale, "admin.newsletter.preview_empty", "Selectează un template pentru preview.");
  const previewError = useAsyncTranslation(locale, "admin.newsletter.preview_error", "Nu am putut încărca preview-ul.");
  const previewNote = useAsyncTranslation(
    locale,
    "admin.newsletter.preview_note",
    "Variabilele sunt înlocuite cu valori de test în preview.",
  );
  const customOnlyNote = useAsyncTranslation(
    locale,
    "admin.newsletter.custom_only_note",
    "Subiectul și mesajul pot fi editate doar pentru template-ul custom.",
  );
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
  const listTitle = useAsyncTranslation(locale, "admin.newsletter.list_title", "Abonați newsletter");
  const listDescription = useAsyncTranslation(
    locale,
    "admin.newsletter.list_description",
    "Lista abonaților activi.",
  );
  const listLoading = useAsyncTranslation(locale, "admin.newsletter.list_loading", "Se încarcă abonații...");
  const listEmpty = useAsyncTranslation(locale, "admin.newsletter.list_empty", "Nu există abonați disponibili.");
  const listError = useAsyncTranslation(locale, "admin.newsletter.list_error", "Nu am putut încărca abonații.");
  const perPageLabel = useAsyncTranslation(locale, "admin.newsletter.per_page_label", "Rezultate per pagină");
  const onlyActiveLabel = useAsyncTranslation(locale, "admin.newsletter.only_active_label", "Doar activi");
  const columnEmail = useAsyncTranslation(locale, "admin.newsletter.columns.email", "Email");
  const columnName = useAsyncTranslation(locale, "admin.newsletter.columns.name", "Nume");
  const columnUserType = useAsyncTranslation(locale, "admin.newsletter.columns.user_type", "Tip");
  const columnCompany = useAsyncTranslation(locale, "admin.newsletter.columns.company", "Companie");
  const columnLanguage = useAsyncTranslation(locale, "admin.newsletter.columns.language", "Limba");
  const columnSubscribedAt = useAsyncTranslation(locale, "admin.newsletter.columns.subscribed_at", "Abonat la");
  const columnStatus = useAsyncTranslation(locale, "admin.newsletter.columns.status", "Status");
  const statusActive = useAsyncTranslation(locale, "admin.newsletter.status_active", "Activ");
  const statusInactive = useAsyncTranslation(locale, "admin.newsletter.status_inactive", "Dezabonat");

  const TextDirectionExtension = Extension.create({
    name: "textDirection",
    addGlobalAttributes() {
      return [
        {
          types: ["heading", "paragraph"],
          attributes: {
            dir: {
              default: null,
              parseHTML: (element) => element.getAttribute("dir"),
              renderHTML: (attributes) => (attributes.dir ? { dir: attributes.dir } : {}),
            },
          },
        },
      ];
    },
    addCommands() {
      return {
        setTextDirection:
          (direction: "ltr" | "rtl") =>
          ({ chain }) =>
            chain().updateAttributes("paragraph", { dir: direction }).updateAttributes("heading", { dir: direction }).run(),
        unsetTextDirection:
          () =>
          ({ chain }) =>
            chain().updateAttributes("paragraph", { dir: null }).updateAttributes("heading", { dir: null }).run(),
      };
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list",
        },
      }),
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextDirectionExtension,
      CodeBlockLowlight.configure({
        lowlight: createLowlight(common),
      }),
      Placeholder.configure({
        placeholder: dataMessagePlaceholder,
      }),
    ],
    content: dataMessage,
    editable: isCustomTemplate,
    onUpdate: ({ editor }) => {
      setDataMessage(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable !== isCustomTemplate) {
      editor.setEditable(isCustomTemplate);
    }
  }, [editor, isCustomTemplate]);

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (dataMessage !== currentHtml) {
      editor.commands.setContent(dataMessage || "", false);
    }
  }, [dataMessage, editor]);

  const handleSetImage = () => {
    if (!editor) return;
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const handleInsertMarkdown = () => {
    if (!editor) return;
    const markdown = window.prompt("Markdown");
    if (!markdown) return;
    const markdownIt = new MarkdownIt({ breaks: true, linkify: true });
    const html = markdownIt.render(markdown);
    editor.commands.setContent(html, false);
  };

  const handleCopyMarkdown = async () => {
    if (!editor) return;
    const html = editor.getHTML();
    const turndownService = new TurndownService({
      codeBlockStyle: "fenced",
      emDelimiter: "_",
    });
    const markdown = turndownService.turndown(html);
    if (!markdown) return;
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(markdown);
    }
  };

  const currentTextDirection =
    editor?.getAttributes("paragraph")?.dir ?? editor?.getAttributes("heading")?.dir;

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
                    <div className="flex flex-wrap gap-2 border-b border-border/60 px-3 py-2 dark:border-slate-700/60">
                      <Button
                        type="button"
                        variant={editor?.isActive("heading", { level: 1 }) ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Heading
                      </Button>
                      <Button
                        type="button"
                        variant={editor?.isActive("heading", { level: 2 }) ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Subheading
                      </Button>
                      <Button
                        type="button"
                        variant={editor?.isActive("bold") ? "default" : "outline"}
                        size="sm"
                      <Button
                        type="button"
                        variant={editor?.isActive("heading", { level: 3 }) ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Long text
                      </Button>
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Bold
                      </Button>
                      <Button
                        type="button"
                        variant={editor?.isActive("italic") ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Italic
                      </Button>
                      <Button
                        type="button"
                        variant={editor?.isActive("underline") ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Underline
                      </Button>
                    </div>
                    <div className="min-h-[160px] px-3 py-2">
                      <EditorContent
                        editor={editor}
                        className="tiptap prose prose-sm max-w-none dark:prose-invert"
                      />
                    </div>
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
                      <Button
                        type="button"
                        variant={editor?.isActive("taskList") ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().toggleTaskList().run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Tasks
                      </Button>
                      <Button
                        type="button"
                        variant={editor?.isActive({ textAlign: "left" }) ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Align left
                      </Button>
                      <Button
                        type="button"
                        variant={editor?.isActive({ textAlign: "center" }) ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Align center
                      </Button>
                      <Button
                        type="button"
                        variant={editor?.isActive({ textAlign: "right" }) ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Align right
                      </Button>
                      <Button
                        type="button"
                        variant={editor?.isActive({ textAlign: "justify" }) ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Align justify
                      </Button>
                      <Button
                        type="button"
                        variant={currentTextDirection === "ltr" ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().setTextDirection("ltr").run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        LTR
                      </Button>
                      <Button
                        type="button"
                        variant={currentTextDirection === "rtl" ? "default" : "outline"}
                        size="sm"
                        onClick={() => editor?.chain().focus().setTextDirection("rtl").run()}
                        disabled={!editor || !isCustomTemplate}
                      >
                        RTL
                      </Button>
                        Syntax highlight
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSetImage}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleInsertMarkdown}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Markdown
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyMarkdown}
                        disabled={!editor || !isCustomTemplate}
                      >
                        Copy Markdown
                      </Button>
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
                        className="simple-editor tiptap prose prose-sm max-w-none dark:prose-invert"
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
