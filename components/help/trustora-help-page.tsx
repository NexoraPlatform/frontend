"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Shield,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { TrustoraLandingFooter } from "@/components/homepage/trustora-landing/footer";
import { TrustoraLandingNavigation } from "@/components/homepage/trustora-landing/navigation";
import { TrustoraLandingThemeStyles } from "@/components/homepage/trustora-landing/theme-styles";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FaqItem = {
  answer: string;
  question: string;
};

type FaqCategory = {
  faqs: FaqItem[];
  icon: LucideIcon;
  id: string;
  title: string;
};

type SupportOption = {
  action: string;
  availability: string;
  description: string;
  icon: LucideIcon;
  primary?: boolean;
  title: string;
};

type ResourceItem = {
  description: string;
  icon: LucideIcon;
  title: string;
  type: string;
};

export function TrustoraHelpPage() {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories: FaqCategory[] = [
    {
      id: "general",
      title: t("help.faq.categories.general.title"),
      icon: HelpCircle,
      faqs: [
        {
          question: t("help.faq.categories.general.items.0.question"),
          answer: t("help.faq.categories.general.items.0.answer"),
        },
        {
          question: t("help.faq.categories.general.items.1.question"),
          answer: t("help.faq.categories.general.items.1.answer"),
        },
        {
          question: t("help.faq.categories.general.items.2.question"),
          answer: t("help.faq.categories.general.items.2.answer"),
        },
        {
          question: t("help.faq.categories.general.items.3.question"),
          answer: t("help.faq.categories.general.items.3.answer"),
        },
      ],
    },
    {
      id: "payments",
      title: t("help.faq.categories.payments.title"),
      icon: CreditCard,
      faqs: [
        {
          question: t("help.faq.categories.payments.items.0.question"),
          answer: t("help.faq.categories.payments.items.0.answer"),
        },
        {
          question: t("help.faq.categories.payments.items.1.question"),
          answer: t("help.faq.categories.payments.items.1.answer"),
        },
        {
          question: t("help.faq.categories.payments.items.2.question"),
          answer: t("help.faq.categories.payments.items.2.answer"),
        },
        {
          question: t("help.faq.categories.payments.items.3.question"),
          answer: t("help.faq.categories.payments.items.3.answer"),
        },
      ],
    },
    {
      id: "projects",
      title: t("help.faq.categories.projects.title"),
      icon: FileText,
      faqs: [
        {
          question: t("help.faq.categories.projects.items.0.question"),
          answer: t("help.faq.categories.projects.items.0.answer"),
        },
        {
          question: t("help.faq.categories.projects.items.1.question"),
          answer: t("help.faq.categories.projects.items.1.answer"),
        },
        {
          question: t("help.faq.categories.projects.items.2.question"),
          answer: t("help.faq.categories.projects.items.2.answer"),
        },
        {
          question: t("help.faq.categories.projects.items.3.question"),
          answer: t("help.faq.categories.projects.items.3.answer"),
        },
      ],
    },
    {
      id: "security",
      title: t("help.faq.categories.security.title"),
      icon: Shield,
      faqs: [
        {
          question: t("help.faq.categories.security.items.0.question"),
          answer: t("help.faq.categories.security.items.0.answer"),
        },
        {
          question: t("help.faq.categories.security.items.1.question"),
          answer: t("help.faq.categories.security.items.1.answer"),
        },
        {
          question: t("help.faq.categories.security.items.2.question"),
          answer: t("help.faq.categories.security.items.2.answer"),
        },
      ],
    },
  ];

  const supportOptions: SupportOption[] = [
    {
      title: t("help.support.options.chat.title"),
      description: t("help.support.options.chat.description"),
      icon: MessageCircle,
      availability: t("help.support.options.chat.availability"),
      action: t("help.support.options.chat.action"),
      primary: true,
    },
    {
      title: t("help.support.options.phone.title"),
      description: t("help.support.options.phone.description"),
      icon: Phone,
      availability: t("help.support.options.phone.availability"),
      action: t("help.support.options.phone.action"),
    },
    {
      title: t("help.support.options.email.title"),
      description: t("help.support.options.email.description"),
      icon: Mail,
      availability: t("help.support.options.email.availability"),
      action: t("help.support.options.email.action"),
    },
  ];

  const resources: ResourceItem[] = [
    {
      title: t("help.resources.items.0.title"),
      description: t("help.resources.items.0.description"),
      icon: BookOpen,
      type: t("help.resources.items.0.type"),
    },
    {
      title: t("help.resources.items.1.title"),
      description: t("help.resources.items.1.description"),
      icon: Video,
      type: t("help.resources.items.1.type"),
    },
    {
      title: t("help.resources.items.2.title"),
      description: t("help.resources.items.2.description"),
      icon: Download,
      type: t("help.resources.items.2.type"),
    },
    {
      title: t("help.resources.items.3.title"),
      description: t("help.resources.items.3.description"),
      icon: CheckCircle2,
      type: t("help.resources.items.3.type"),
    },
  ];

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return faqCategories;
    }

    return faqCategories
      .map((category) => ({
        ...category,
        faqs: category.faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(normalizedSearch) ||
            faq.answer.toLowerCase().includes(normalizedSearch)
        ),
      }))
      .filter((category) => category.faqs.length > 0);
  }, [faqCategories, searchTerm]);

  const defaultTab = filteredCategories[0]?.id ?? faqCategories[0]?.id ?? "general";

  return (
    <div className="trustora-help-page relative isolate overflow-x-hidden bg-background text-foreground">
      <TrustoraLandingThemeStyles scopeClassName="trustora-help-page" />
      <TrustoraLandingNavigation />

      <main className="relative z-10">
        <section className="relative isolate overflow-hidden pt-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
            <div className="absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[-6rem] top-36 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-8">
                <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                  <span className="mr-2 h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{t("help.hero.badge")}</span>
                </div>

                <div className="mx-auto max-w-4xl space-y-6">
                  <h1 className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
                    {t.rich("help.hero.title", {
                      highlight: (chunks) => <span className="text-gradient">{chunks}</span>,
                    })}
                  </h1>
                  <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                    {t("help.hero.description")}
                  </p>
                </div>

                <div className="relative mx-auto w-full max-w-2xl">
                  <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("help.hero.search_placeholder")}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-16 rounded-2xl border-white/10 bg-white/70 pl-14 pr-5 text-base shadow-sm backdrop-blur-xl focus-visible:ring-primary dark:bg-[#0B1220]"
                  />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    t("help.hero.tags.live_support"),
                    t("help.hero.tags.guided_resources"),
                    t("help.hero.tags.updated_faq"),
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="glass-effect rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-black/[0.02] py-16 dark:bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="relative">
              <div className="glass-effect relative overflow-hidden rounded-[2rem] border border-white/10 p-8 shadow-2xl">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t("help.support.eyebrow")}
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-bold leading-tight">{t("help.support.title")}</h2>
                      <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                        {t("help.support.description")}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {supportOptions.map((option) => {
                      const Icon = option.icon;

                      return (
                        <div
                          key={option.title}
                          className={`rounded-2xl border p-5 ${
                            option.primary
                              ? "border-primary/10 bg-primary/5"
                              : "border-white/10 bg-background/40"
                          }`}
                        >
                          <Icon className="mb-3 h-8 w-8 text-primary" />
                          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {option.title}
                          </div>
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {option.description}
                          </p>
                          <div className="mt-4 text-sm font-medium text-primary">
                            {option.availability}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <span className="text-sm font-medium text-primary">{t("help.faq.eyebrow")}</span>
              </div>
              <h2 className="mt-6 text-4xl font-bold sm:text-5xl">{t("help.faq.title")}</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {t("help.faq.description")}
              </p>
            </div>

            <div className="mt-14">
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-[1.5rem] border border-white/10 bg-white/60 p-2 dark:bg-[#0B1220]/80 lg:grid-cols-4">
                  {faqCategories.map((category) => {
                    const Icon = category.icon;

                    return (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="flex items-center gap-2 rounded-[1rem] px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-white"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate">{category.title}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {faqCategories.map((category) => {
                  const visibleFaqs =
                    searchTerm.trim().length > 0
                      ? filteredCategories.find((item) => item.id === category.id)?.faqs ?? []
                      : category.faqs;

                  return (
                    <TabsContent key={category.id} value={category.id} className="mt-8">
                      <Card className="glass-effect overflow-hidden rounded-[2rem] border border-white/10 shadow-none">
                        <CardContent className="p-0">
                          {visibleFaqs.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                              {searchTerm.trim().length > 0
                                ? searchTerm
                                : t("help.hero.search_placeholder")}
                            </div>
                          ) : (
                            visibleFaqs.map((faq, index) => (
                              <Accordion
                                key={`${category.id}-${index}`}
                                type="single"
                                collapsible
                                className="border-b border-white/5 last:border-b-0"
                              >
                                <AccordionItem value={`${category.id}-${index}`} className="border-none px-6">
                                  <AccordionTrigger className="py-6 text-left text-base font-semibold hover:no-underline">
                                    {faq.question}
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-6 text-sm leading-7 text-muted-foreground">
                                    {faq.answer}
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-black/[0.02] py-24 dark:bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <span className="text-sm font-medium text-primary">{t("help.resources.eyebrow")}</span>
              </div>
              <h2 className="mt-6 text-4xl font-bold sm:text-5xl">{t("help.resources.title")}</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {t("help.resources.description")}
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {resources.map((resource) => {
                const Icon = resource.icon;

                return (
                  <Card
                    key={resource.title}
                    className="glass-effect group rounded-[1.75rem] border border-white/10 shadow-none transition-transform duration-300 hover:-translate-y-1"
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                          {resource.type}
                        </Badge>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-xl">{resource.title}</CardTitle>
                      <CardDescription className="text-sm leading-7 text-muted-foreground">
                        {resource.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <span className="text-sm font-medium text-primary">{t("help.contact.eyebrow")}</span>
              </div>
              <h2 className="mt-6 text-4xl font-bold sm:text-5xl">{t("help.contact.title")}</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {t("help.contact.description")}
              </p>
            </div>

            <Card className="glass-effect mt-14 rounded-[2rem] border border-white/10 shadow-none">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl">{t("help.contact.form.title")}</CardTitle>
                <CardDescription className="text-base leading-7 text-muted-foreground">
                  {t("help.contact.form.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("help.contact.form.fields.name.label")}</label>
                    <Input
                      placeholder={t("help.contact.form.fields.name.placeholder")}
                      className="h-12 rounded-xl border-white/10 bg-white/70 dark:bg-[#0B1220]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("help.contact.form.fields.email.label")}</label>
                    <Input
                      type="email"
                      placeholder={t("help.contact.form.fields.email.placeholder")}
                      className="h-12 rounded-xl border-white/10 bg-white/70 dark:bg-[#0B1220]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("help.contact.form.fields.subject.label")}</label>
                  <Input
                    placeholder={t("help.contact.form.fields.subject.placeholder")}
                    className="h-12 rounded-xl border-white/10 bg-white/70 dark:bg-[#0B1220]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("help.contact.form.fields.message.label")}</label>
                  <textarea
                    className="min-h-36 w-full rounded-[1.25rem] border border-white/10 bg-white/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:bg-[#0B1220]"
                    placeholder={t("help.contact.form.fields.message.placeholder")}
                  />
                </div>

                <Button className="h-12 w-full rounded-xl bg-primary text-base font-medium text-white hover:bg-primary/90">
                  {t("help.contact.form.submit")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <TrustoraLandingFooter />
    </div>
  );
}
