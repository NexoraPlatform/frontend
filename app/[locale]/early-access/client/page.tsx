"use client";

import { useState } from "react";
import { CheckCircle, Mail, UserRound, Building2, ClipboardList } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LocalizedLink } from "@/components/LocalizedLink";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { TermsContent } from "@/components/terms-content";
import { apiClient } from "@/lib/api";
import { usePathname } from "next/navigation";
import { useAsyncTranslation } from "@/hooks/use-async-translation";
import { Locale } from "@/types/locale";

export default function EarlyAccessClientPage() {
    const pathname = usePathname();
    const locale = (pathname.split("/")[1] as Locale) || "ro";
    const badgeText = useAsyncTranslation(locale, "trustora.early_access.client.badge", "Formular client");
    const titleText = useAsyncTranslation(locale, "trustora.early_access.client.title", "Înscriere");
    const titleHighlightText = useAsyncTranslation(locale, "trustora.early_access.client.title_highlight", "client");
    const titleSuffixText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.title_suffix",
        "pentru early access",
    );
    const subtitleText = useAsyncTranslation(
        locale,
        "trustora.early_access.client.subtitle",
        "Spune-ne despre compania ta și nevoile de recrutare. Îți trimitem acces prioritar la prestatorii potriviți.",
    );
    const benefitOne = useAsyncTranslation(
        locale,
        "trustora.early_access.client.benefits.preselect",
        "Preselectăm prestatori verificați pentru tine",
    );
    const benefitTwo = useAsyncTranslation(
        locale,
        "trustora.early_access.client.benefits.scoring",
        "Primești un scoring transparent al aplicațiilor",
    );
    const benefitThree = useAsyncTranslation(
        locale,
        "trustora.early_access.client.benefits.escrow",
        "Poți activa escrow automat din prima etapă",
    );
    const backLinkText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.back_link",
        "← Înapoi la alegerea tipului de cont",
    );
    const formTitle = useAsyncTranslation(locale, "trustora.early_access.client.form_title", "Completează datele");
    const formDescription = useAsyncTranslation(
        locale,
        "trustora.early_access.client.form_description",
        "Toate câmpurile sunt obligatorii pentru accesul early access.",
    );
    const successText = useAsyncTranslation(
        locale,
        "trustora.early_access.client.success",
        "Mulțumim! Cererea ta a fost trimisă. Revenim cu detalii pe email.",
    );
    const frequencyErrorText = useAsyncTranslation(
        locale,
        "trustora.early_access.client.error_frequency",
        "Selectează frecvența de recrutare.",
    );
    const genericErrorText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.error_generic",
        "A apărut o eroare. Încearcă din nou.",
    );
    const submitErrorText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.error_submit",
        "Nu am putut trimite formularul.",
    );
    const emailLabel = useAsyncTranslation(locale, "trustora.early_access.client.fields.email_label", "Email companie");
    const emailPlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.email_placeholder",
        "company@example.com",
    );
    const contactLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.contact_label",
        "Persoană de contact",
    );
    const contactPlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.contact_placeholder",
        "Nume și prenume",
    );
    const companyLabel = useAsyncTranslation(locale, "trustora.early_access.client.fields.company_label", "Companie");
    const companyPlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.company_placeholder",
        "Numele companiei",
    );
    const needsLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.needs_label",
        "Nevoi de recrutare",
    );
    const needsPlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.needs_placeholder",
        "Ex: dezvoltare web, UI/UX, QA automation",
    );
    const budgetLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.budget_label",
        "Buget tipic proiect (€)",
    );
    const budgetPlaceholder = useAsyncTranslation(locale, "trustora.early_access.client.fields.budget_placeholder", "3500");
    const frequencyLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.frequency_label",
        "Frecvență recrutare",
    );
    const frequencyPlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.frequency_placeholder",
        "Alege frecvența",
    );
    const frequencyMonthly = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.frequency_monthly",
        "O dată pe lună",
    );
    const frequencyQuarterly = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.frequency_quarterly",
        "Trimestrial",
    );
    const frequencyOnDemand = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.frequency_on_demand",
        "La nevoie",
    );
    const frequencyOneProject = useAsyncTranslation(
        locale,
        "trustora.early_access.client.fields.frequency_one_project",
        "Proiect unic",
    );
    const lostMoneyLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.client.checkboxes.lost_money",
        "Am avut proiecte în care am pierdut bani sau timp din cauza livrării slabe.",
    );
    const escrowHelpLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.client.checkboxes.escrow_help",
        "Vreau să folosesc escrow pentru plăți sigure.",
    );
    const submitText = useAsyncTranslation(locale, "trustora.early_access.common.submit", "Trimite aplicația");
    const submittingText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.submitting",
        "Trimitem aplicația...",
    );

    const hireFrequencyOptions = [
        frequencyMonthly,
        frequencyQuarterly,
        frequencyOnDemand,
        frequencyOneProject,
    ] as const;

    const [formData, setFormData] = useState({
        email: "",
        contactName: "",
        companyName: "",
        hiringNeeds: "",
        typicalProjectBudget: "",
        hireFrequency: "",
        lostMoney: false,
        escrowHelp: false,
        agreeToTerms: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setSuccess(false);
        setIsSubmitting(true);

        try {
            if (!formData.hireFrequency) {
                throw new Error(frequencyErrorText);
            }
            if (!formData.agreeToTerms) {
                throw new Error("Trebuie să accepți termenii și condițiile.");
            }

            const payload: Parameters<typeof apiClient.createEarlyAccessApplication>[0] = {
                user_type: "client",
                email: formData.email,
                contact_name: formData.contactName,
                company_name: formData.companyName,
                hiring_needs: formData.hiringNeeds,
                typical_project_budget: Number(formData.typicalProjectBudget),
                hire_frequency: formData.hireFrequency,
                lost_money: formData.lostMoney,
                escrow_help: formData.escrowHelp,
            };

            await apiClient.createEarlyAccessApplication(payload);

            setSuccess(true);
            setFormData({
                email: "",
                contactName: "",
                companyName: "",
                hiringNeeds: "",
                typicalProjectBudget: "",
                hireFrequency: "",
                lostMoney: false,
                escrowHelp: false,
                agreeToTerms: false,
            });
        } catch (submitError: any) {
            setError(submitError?.message ?? submitErrorText);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />

            <div className="relative mt-8 overflow-hidden">
                <div className="absolute inset-0 hero-gradient" />
                <div className="relative container mx-auto px-4 py-16">
                    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] items-start">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-100/60 px-4 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                {badgeText}
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                                    {titleText} <span className="text-[#1BC47D]">{titleHighlightText}</span> {titleSuffixText}
                                </h1>
                                <p className="text-lg text-slate-600 dark:text-slate-300">
                                    {subtitleText}
                                </p>
                            </div>
                            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                {[
                                    benefitOne,
                                    benefitTwo,
                                    benefitThree,
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="glass-card flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 font-medium shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <LocalizedLink href="/early-access" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                                    {backLinkText}
                                </LocalizedLink>
                            </div>
                        </div>

                        <Card className="glass-card border border-slate-200/60 bg-white/90 shadow-2xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
                            <CardHeader className="space-y-2 text-left">
                                <CardTitle className="text-2xl text-[#0F172A] dark:text-white">{formTitle}</CardTitle>
                                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                                    {formDescription}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                {success && (
                                    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            {successText}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{emailLabel}</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder={emailPlaceholder}
                                                value={formData.email}
                                                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactName">{contactLabel}</Label>
                                        <div className="relative">
                                            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="contactName"
                                                placeholder={contactPlaceholder}
                                                value={formData.contactName}
                                                onChange={(event) => setFormData({ ...formData, contactName: event.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">{companyLabel}</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="companyName"
                                                placeholder={companyPlaceholder}
                                                value={formData.companyName}
                                                onChange={(event) => setFormData({ ...formData, companyName: event.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hiringNeeds">{needsLabel}</Label>
                                        <Textarea
                                            id="hiringNeeds"
                                            placeholder={needsPlaceholder}
                                            value={formData.hiringNeeds}
                                            onChange={(event) => setFormData({ ...formData, hiringNeeds: event.target.value })}
                                            className="min-h-[120px]"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="budget">{budgetLabel}</Label>
                                            <div className="relative">
                                                <ClipboardList className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="budget"
                                                    type="number"
                                                    min={0}
                                                    placeholder={budgetPlaceholder}
                                                    value={formData.typicalProjectBudget}
                                                    onChange={(event) =>
                                                        setFormData({ ...formData, typicalProjectBudget: event.target.value })
                                                    }
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="hireFrequency">{frequencyLabel}</Label>
                                            <Select
                                                value={formData.hireFrequency}
                                                onValueChange={(value) => setFormData({ ...formData, hireFrequency: value })}
                                            >
                                                <SelectTrigger id="hireFrequency">
                                                    <SelectValue placeholder={frequencyPlaceholder} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {hireFrequencyOptions.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Checkbox
                                                id="lostMoney"
                                                checked={formData.lostMoney}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, lostMoney: checked as boolean })
                                                }
                                            />
                                            <Label htmlFor="lostMoney" className="text-sm text-slate-600 dark:text-slate-300">
                                                {lostMoneyLabel}
                                            </Label>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Checkbox
                                                id="escrowHelp"
                                                checked={formData.escrowHelp}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, escrowHelp: checked as boolean })
                                                }
                                            />
                                            <Label htmlFor="escrowHelp" className="text-sm text-slate-600 dark:text-slate-300">
                                                {escrowHelpLabel}
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                                        <div className="max-h-64 overflow-y-auto pr-2">
                                            <TermsContent className="text-xs" headingClassName="text-base" />
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Checkbox
                                            id="terms"
                                            checked={formData.agreeToTerms}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, agreeToTerms: checked as boolean })
                                            }
                                        />
                                        <Label htmlFor="terms" className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                            Am luat la cunoștință și sunt de acord cu{" "}
                                            <LocalizedLink
                                                href="/terms"
                                                className="font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                                            >
                                                Termenii și Condițiile
                                            </LocalizedLink>{" "}
                                            și{" "}
                                            <LocalizedLink
                                                href="/privacy"
                                                className="font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                                            >
                                                Politica de Confidențialitate
                                            </LocalizedLink>
                                            .
                                        </Label>
                                    </div>

                                    <Button type="submit" className="w-full btn-primary text-white" disabled={isSubmitting}>
                                        {isSubmitting ? submittingText : submitText}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
