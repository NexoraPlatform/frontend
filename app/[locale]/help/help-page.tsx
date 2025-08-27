"use client";

import { useState } from 'react';
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
            <section className="py-20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                            Centrul de Ajutor Nexora
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8">
                            Găsește răspunsuri la întrebările tale sau contactează echipa
                            noastră de suport
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto mb-8">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                <Input
                                    placeholder="Caută în întrebări frecvente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-4 py-6 text-lg bg-background/80 backdrop-blur border-2 focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support Options */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Ai nevoie de ajutor imediat?</h2>
                        <p className="text-muted-foreground">
                            Alege modalitatea de contact care ți se potrivește
                        </p>
                    </div>

                    <div className="grid xs:grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {supportOptions.map((option, index) => {
                            const Icon = getIcon(option.iconKey);
                            return (
                                <Card
                                    key={index}
                                    className={`text-center ${
                                        option.primary ? "border-primary border-2" : ""
                                    }`}
                                >
                                    <CardHeader>
                                        <div
                                            className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                                                option.primary
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            }`}
                                        >
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <CardTitle className="text-xl">{option.title}</CardTitle>
                                        <CardDescription>{option.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mb-4">
                                            <Clock className="w-4 h-4" />
                                            <span>{option.availability}</span>
                                        </div>
                                        <Button
                                            className="w-full"
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
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Întrebări Frecvente</h2>
                        <p className="text-muted-foreground">
                            Răspunsuri la cele mai comune întrebări despre Nexora
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <Tabs defaultValue={faqCategories[0]?.id ?? "general"} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
                                {faqCategories.map((category) => {
                                    const Icon = getIcon(category.iconKey);
                                    return (
                                        <TabsTrigger
                                            key={category.id}
                                            value={category.id}
                                            className="flex items-center space-x-2"
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="hidden sm:inline">{category.title}</span>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>

                            {faqCategories.map((category) => (
                                <TabsContent key={category.id} value={category.id}>
                                    <Accordion type="single" collapsible className="w-full">
                                        {(searchTerm
                                                ? filteredFAQs.find((c) => c.id === category.id)?.faqs || []
                                                : category.faqs
                                        ).map((faq, index) => (
                                            <AccordionItem key={index} value={`${category.id}-${index}`}>
                                                <AccordionTrigger className="text-left">
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>
            </section>

            {/* Resources Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Resurse Utile</h2>
                        <p className="text-muted-foreground">
                            Ghiduri, tutoriale și template-uri pentru a te ajuta să reușești
                        </p>
                    </div>

                    <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {resources.map((resource, index) => {
                            const Icon = getIcon(resource.iconKey);
                            return (
                                <Card
                                    key={index}
                                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                                >
                                    <CardHeader>
                                        <div className="w-12 h-12 mb-4 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="text-xs">
                                                {resource.type}
                                            </Badge>
                                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                                        <CardDescription className="text-sm">
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
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-4">Nu ai găsit răspunsul?</h2>
                            <p className="text-muted-foreground">
                                Trimite-ne o întrebare și îți vom răspunde în cel mai scurt timp
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Contactează Suportul</CardTitle>
                                <CardDescription>
                                    Completează formularul de mai jos și te vom contacta în maxim 2 ore
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Nume</label>
                                        <Input placeholder="Numele tău" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Email</label>
                                        <Input type="email" placeholder="email@exemplu.ro" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Subiect</label>
                                    <Input placeholder="Despre ce vrei să vorbești?" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Mesaj</label>
                                    <textarea
                                        className="w-full min-h-32 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        placeholder="Descrie problema ta în detaliu..."
                                    />
                                </div>
                                <Button className="w-full">Trimite Mesajul</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </>
    );
}
