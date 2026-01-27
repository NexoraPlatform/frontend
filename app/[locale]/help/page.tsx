import type {Metadata} from "next";
import {generateSEO} from "@/lib/seo";
import HelpPageComponent from "@/app/[locale]/help/help-page";
import { Footer } from "@/components/footer";
import { Header } from '@/components/header';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { getTranslations } from 'next-intl/server';

type HelpPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: HelpPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith('en');

  return generateSEO({
    title: isEnglish ? 'FAQ - Frequently Asked Questions' : 'FAQ - Întrebări Frecvente',
    description: isEnglish
      ? 'Have a question? Check the FAQ section for fast answers to the most common questions about Trustora.'
      : 'Ai o intrebare? Verifica sectiunea de întrebări frecvente pentru răspunsuri rapide la cele mai comune întrebări despre Trustora.',
    url: '/help',
  });
}

export default async function HelpPage() {
    const t = await getTranslations();
    const faqCategories = [
        {
            id: "general",
            title: t('help.faq.categories.general.title'),
            iconKey: "HelpCircle",
            faqs: [
                {
                    question: t('help.faq.categories.general.items.0.question'),
                    answer: t('help.faq.categories.general.items.0.answer'),
                },
                {
                    question: t('help.faq.categories.general.items.1.question'),
                    answer: t('help.faq.categories.general.items.1.answer'),
                },
                {
                    question: t('help.faq.categories.general.items.2.question'),
                    answer: t('help.faq.categories.general.items.2.answer'),
                },
                {
                    question: t('help.faq.categories.general.items.3.question'),
                    answer: t('help.faq.categories.general.items.3.answer'),
                },
            ],
        },
        {
            id: "payments",
            title: t('help.faq.categories.payments.title'),
            iconKey: "CreditCard",
            faqs: [
                {
                    question: t('help.faq.categories.payments.items.0.question'),
                    answer: t('help.faq.categories.payments.items.0.answer'),
                },
                {
                    question: t('help.faq.categories.payments.items.1.question'),
                    answer: t('help.faq.categories.payments.items.1.answer'),
                },
                {
                    question: t('help.faq.categories.payments.items.2.question'),
                    answer: t('help.faq.categories.payments.items.2.answer'),
                },
                {
                    question: t('help.faq.categories.payments.items.3.question'),
                    answer: t('help.faq.categories.payments.items.3.answer'),
                },
            ],
        },
        {
            id: "projects",
            title: t('help.faq.categories.projects.title'),
            iconKey: "FileText",
            faqs: [
                {
                    question: t('help.faq.categories.projects.items.0.question'),
                    answer: t('help.faq.categories.projects.items.0.answer'),
                },
                {
                    question: t('help.faq.categories.projects.items.1.question'),
                    answer: t('help.faq.categories.projects.items.1.answer'),
                },
                {
                    question: t('help.faq.categories.projects.items.2.question'),
                    answer: t('help.faq.categories.projects.items.2.answer'),
                },
                {
                    question: t('help.faq.categories.projects.items.3.question'),
                    answer: t('help.faq.categories.projects.items.3.answer'),
                },
            ],
        },
        {
            id: "security",
            title: t('help.faq.categories.security.title'),
            iconKey: "Shield",
            faqs: [
                {
                    question: t('help.faq.categories.security.items.0.question'),
                    answer: t('help.faq.categories.security.items.0.answer'),
                },
                {
                    question: t('help.faq.categories.security.items.1.question'),
                    answer: t('help.faq.categories.security.items.1.answer'),
                },
                {
                    question: t('help.faq.categories.security.items.2.question'),
                    answer: t('help.faq.categories.security.items.2.answer'),
                },
            ],
        },
    ] as const;

    const supportOptions = [
        {
            title: t('help.support.options.chat.title'),
            description: t('help.support.options.chat.description'),
            iconKey: "MessageCircle",
            availability: t('help.support.options.chat.availability'),
            action: t('help.support.options.chat.action'),
            primary: true,
        },
        {
            title: t('help.support.options.phone.title'),
            description: t('help.support.options.phone.description'),
            iconKey: "Phone",
            availability: t('help.support.options.phone.availability'),
            action: t('help.support.options.phone.action'),
            primary: false,
        },
        {
            title: t('help.support.options.email.title'),
            description: t('help.support.options.email.description'),
            iconKey: "Mail",
            availability: t('help.support.options.email.availability'),
            action: t('help.support.options.email.action'),
            primary: false,
        },
    ] as const;

    const resources = [
        {
            title: t('help.resources.items.0.title'),
            description: t('help.resources.items.0.description'),
            iconKey: "BookOpen",
            type: t('help.resources.items.0.type'),
            link: "#",
        },
        {
            title: t('help.resources.items.1.title'),
            description: t('help.resources.items.1.description'),
            iconKey: "Video",
            type: t('help.resources.items.1.type'),
            link: "#",
        },
        {
            title: t('help.resources.items.2.title'),
            description: t('help.resources.items.2.description'),
            iconKey: "Download",
            type: t('help.resources.items.2.type'),
            link: "#",
        },
        {
            title: t('help.resources.items.3.title'),
            description: t('help.resources.items.3.description'),
            iconKey: "CheckCircle",
            type: t('help.resources.items.3.type'),
            link: "#",
        },
    ] as const;

    return (
        <div className="min-h-screen bg-white dark:bg-[#070C14]">
            <Header />
            <TrustoraThemeStyles />
            <HelpPageComponent
                faqCategories={faqCategories as any}
                supportOptions={supportOptions as any}
                resources={resources as any}
            />
            <Footer />
        </div>
    );
}
