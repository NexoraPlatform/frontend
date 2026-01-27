"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    ExternalLink,
    Clock
} from 'lucide-react';
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Faq = { question: string; answer: string };

type FaqCategory = {
    id: string;
    title: string;
    iconKey: keyof typeof Icons; // e.g. 'HelpCircle' | 'CreditCard' | ...
    faqs: Faq[];
};

type SupportOption = {
    title: string;
    description: string;
    iconKey: keyof typeof Icons;
    availability: string;
    action: string;
    primary: boolean;
};

type Resource = {
    title: string;
    description: string;
    iconKey: keyof typeof Icons;
    type: string;
    link: string;
};

type Props = {
    faqCategories: FaqCategory[];
    supportOptions: SupportOption[];
    resources: Resource[];
};

function getIcon(iconKey: keyof typeof Icons): LucideIcon {
    const Icon = Icons[iconKey] as LucideIcon | undefined;
    return Icon ?? (Icons.HelpCircle as LucideIcon);
}

export default function HelpInteractive({
                                            faqCategories,
                                            supportOptions,
                                            resources,
                                        }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const t = useTranslations();

    const filteredFAQs = faqCategories
        .map((category) => ({
            ...category,
            faqs: category.faqs.filter(
                (faq) =>
                    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        }))
        .filter((category) => category.faqs.length > 0);

    return (
        <>
            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 hero-gradient">
                <div className="max-w-6xl mx-auto text-center">
                    <Badge className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
                        <span className="text-[#1BC47D]">●</span> {t('help.hero.badge')}
                    </Badge>
                    <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-[#0B1C2D] tracking-tight dark:text-[#E6EDF3]">
                        {t.rich('help.hero.title', {
                            highlight: (chunks) => <span className="text-[#1BC47D]">{chunks}</span>,
                        })}
                    </h1>
                    <p className="text-xl text-slate-500 mb-10 max-w-3xl mx-auto dark:text-[#A3ADC2]">
                        {t('help.hero.description')}
                    </p>

                    <div className="max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                                placeholder={t('help.hero.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-6 text-lg bg-white/90 border border-slate-200 shadow-sm focus-visible:ring-[#1BC47D] dark:bg-[#0B1220] dark:border-[#1E2A3D] dark:text-[#E6EDF3]"
                            />
                        </div>
                        <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-[#6B7285]">
                            <span>{t('help.hero.tags.live_support')}</span>
                            <span>{t('help.hero.tags.guided_resources')}</span>
                            <span>{t('help.hero.tags.updated_faq')}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support Options */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3 dark:text-[#6B7285]">
                            {t('help.support.eyebrow')}
                        </p>
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('help.support.title')}
                        </h2>
                        <p className="text-slate-500 dark:text-[#A3ADC2]">
                            {t('help.support.description')}
                        </p>
                    </div>

                    <div className="grid xs:grid-cols-1 md:grid-cols-3 gap-6">
                        {supportOptions.map((option, index) => {
                            const Icon = getIcon(option.iconKey);
                            return (
                                <Card
                                    key={index}
                                    className={`glass-card text-center px-2 py-2 ${
                                        option.primary ? "border-2 border-[#1BC47D]" : ""
                                    }`}
                                >
                                    <CardHeader className="space-y-4">
                                        <div
                                            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                                                option.primary
                                                    ? "bg-[#1BC47D] text-white shadow-[0_10px_30px_rgba(27,196,125,0.35)]"
                                                    : "bg-slate-50 text-[#0B1C2D] dark:bg-[#111B2D] dark:text-[#E6EDF3]"
                                            }`}
                                        >
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                {option.title}
                                            </CardTitle>
                                            <CardDescription className="text-slate-500 dark:text-[#A3ADC2]">
                                                {option.description}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-center space-x-2 text-sm text-slate-400 dark:text-[#6B7285]">
                                            <Clock className="w-4 h-4" />
                                            <span>{option.availability}</span>
                                        </div>
                                        <Button
                                            className={`w-full ${option.primary ? "btn-primary" : "border border-slate-200 text-[#0B1C2D] hover:bg-slate-50 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#0F172A]"}`}
                                            variant={option.primary ? "default" : "outline"}
                                        >
                                            {option.action}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-6 bg-[#F5F7FA] dark:bg-[#0B1220]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3 dark:text-[#6B7285]">
                            {t('help.faq.eyebrow')}
                        </p>
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('help.faq.title')}
                        </h2>
                        <p className="text-slate-500 dark:text-[#A3ADC2]">
                            {t('help.faq.description')}
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <Tabs defaultValue={faqCategories[0]?.id ?? "general"} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 bg-white/80 border border-slate-100 rounded-full p-1 dark:bg-[#0B1220] dark:border-[#1E2A3D]">
                                {faqCategories.map((category) => {
                                    const Icon = getIcon(category.iconKey);
                                    return (
                                        <TabsTrigger
                                            key={category.id}
                                            value={category.id}
                                            className="flex items-center justify-center gap-2 rounded-full data-[state=active]:bg-[#1BC47D] data-[state=active]:text-white"
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="hidden sm:inline">{category.title}</span>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>

                            {faqCategories.map((category) => (
                                <TabsContent key={category.id} value={category.id}>
                                    <Card className="glass-card border border-transparent">
                                        <CardContent className="divide-y divide-slate-100 dark:divide-[#1E2A3D]">
                                            {(searchTerm
                                                    ? filteredFAQs.find((c) => c.id === category.id)?.faqs || []
                                                    : category.faqs
                                            ).map((faq, index) => (
                                                <Accordion key={index} type="single" collapsible className="w-full">
                                                    <AccordionItem value={`${category.id}-${index}`} className="border-none">
                                                        <AccordionTrigger className="text-left text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                            {faq.question}
                                                        </AccordionTrigger>
                                                        <AccordionContent className="text-slate-500 dark:text-[#A3ADC2]">
                                                            {faq.answer}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>
            </section>

            {/* Resources Section */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3 dark:text-[#6B7285]">
                            {t('help.resources.eyebrow')}
                        </p>
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('help.resources.title')}
                        </h2>
                        <p className="text-slate-500 dark:text-[#A3ADC2]">
                            {t('help.resources.description')}
                        </p>
                    </div>

                    <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {resources.map((resource, index) => {
                            const Icon = getIcon(resource.iconKey);
                            return (
                                <Card
                                    key={index}
                                    className="glass-card group hover:shadow-lg transition-all duration-300 cursor-pointer"
                                >
                                    <CardHeader className="space-y-4">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors dark:bg-[rgba(27,196,125,0.1)] dark:group-hover:bg-[rgba(27,196,125,0.2)]">
                                            <Icon className="w-6 h-6 text-[#1BC47D]" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="text-xs">
                                                {resource.type}
                                            </Badge>
                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <CardTitle className="text-lg text-[#0B1C2D] dark:text-[#E6EDF3]">
                                            {resource.title}
                                        </CardTitle>
                                        <CardDescription className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                                            {resource.description}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="py-20 px-6 bg-[#F5F7FA] dark:bg-[#0B1220]">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-3 dark:text-[#6B7285]">
                            {t('help.contact.eyebrow')}
                        </p>
                        <h2 className="text-3xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('help.contact.title')}
                        </h2>
                        <p className="text-slate-500 dark:text-[#A3ADC2]">
                            {t('help.contact.description')}
                        </p>
                    </div>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {t('help.contact.form.title')}
                            </CardTitle>
                            <CardDescription className="text-slate-500 dark:text-[#A3ADC2]">
                                {t('help.contact.form.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                                        {t('help.contact.form.fields.name.label')}
                                    </label>
                                    <Input
                                        placeholder={t('help.contact.form.fields.name.placeholder')}
                                        className="border-slate-200 dark:border-[#1E2A3D]"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                                        {t('help.contact.form.fields.email.label')}
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder={t('help.contact.form.fields.email.placeholder')}
                                        className="border-slate-200 dark:border-[#1E2A3D]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                                    {t('help.contact.form.fields.subject.label')}
                                </label>
                                <Input
                                    placeholder={t('help.contact.form.fields.subject.placeholder')}
                                    className="border-slate-200 dark:border-[#1E2A3D]"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                                    {t('help.contact.form.fields.message.label')}
                                </label>
                                <textarea
                                    className="w-full min-h-32 px-3 py-2 border border-slate-200 bg-white rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1BC47D] focus:ring-offset-2 dark:border-[#1E2A3D] dark:bg-[#0B1220] dark:text-[#E6EDF3]"
                                    placeholder={t('help.contact.form.fields.message.placeholder')}
                                />
                            </div>
                            <Button className="w-full btn-primary">{t('help.contact.form.submit')}</Button>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </>
    );
}
