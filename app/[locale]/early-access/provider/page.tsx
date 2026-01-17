"use client";

import { useState } from "react";
import { CheckCircle, Mail, UserRound, Globe2, Award, Clock } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LocalizedLink } from "@/components/LocalizedLink";
import { TermsContent } from "@/components/terms-content";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { apiClient } from "@/lib/api";
import { usePathname } from "next/navigation";
import { useAsyncTranslation } from "@/hooks/use-async-translation";
import { Locale } from "@/types/locale";

export default function EarlyAccessProviderPage() {
    const pathname = usePathname();
    const locale = (pathname.split("/")[1] as Locale) || "ro";
    const badgeText = useAsyncTranslation(locale, "trustora.early_access.provider.badge", "Formular prestator");
    const titleText = useAsyncTranslation(locale, "trustora.early_access.provider.title", "Înscriere");
    const titleHighlightText = useAsyncTranslation(locale, "trustora.early_access.provider.title_highlight", "prestator");
    const titleSuffixText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.title_suffix",
        "pentru early access",
    );
    const subtitleText = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.subtitle",
        "Îți colectăm experiența și preferințele pentru a-ți potrivi rapid proiecte cu clienți serioși.",
    );
    const benefitOne = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.benefits.verification",
        "Profil publicat doar după verificare manuală",
    );
    const benefitTwo = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.benefits.projects",
        "Acces rapid la proiecte cu bugete clare",
    );
    const benefitThree = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.benefits.escrow",
        "Escrow opțional pentru plăți sigure",
    );
    const backLinkText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.back_link",
        "← Înapoi la alegerea tipului de cont",
    );
    const formTitle = useAsyncTranslation(locale, "trustora.early_access.provider.form_title", "Completează profilul");
    const formDescription = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.form_description",
        "Datele tale ne ajută să te potrivim cu proiecte relevante.",
    );
    const successText = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.success",
        "Mulțumim! Cererea ta a fost trimisă. Revenim cu detalii pe email.",
    );
    const skillErrorText = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.error_skill",
        "Selectează skill-ul principal.",
    );
    const genericErrorText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.error_generic",
        "A apărut o eroare. Încearcă din nou.",
    );
    const termsAcknowledgementText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.terms_acknowledgement",
        "Am luat la cunoștință și sunt de acord cu",
    );
    const termsAndText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.terms_and",
        "și",
    );
    const termsLinkText = useAsyncTranslation(locale, "common.terms_conditions", "Termenii și Condițiile");
    const privacyLinkText = useAsyncTranslation(locale, "common.privacy_policy", "Politica de Confidențialitate");
    const submitErrorText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.error_submit",
        "Nu am putut trimite formularul.",
    );
    const emailLabel = useAsyncTranslation(locale, "trustora.early_access.provider.fields.email_label", "Email");
    const emailPlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.fields.email_placeholder",
        "freelancer@example.com",
    );
    const fullNameLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.fields.full_name_label",
        "Nume complet",
    );
    const fullNamePlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.fields.full_name_placeholder",
        "Ana Popescu",
    );
    const countryLabel = useAsyncTranslation(locale, "trustora.early_access.provider.fields.country_label", "Țara");
    const countryPlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.fields.country_placeholder",
        "România",
    );
    const skillLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.fields.skill_label",
        "Skill principal",
    );
    const skillPlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.fields.skill_placeholder",
        "Alege skill",
    );
    const yearsLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.fields.years_label",
        "Ani experiență",
    );
    const yearsPlaceholder = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.fields.years_placeholder",
        "5",
    );
    const hasClientsLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.checkboxes.has_clients",
        "Am deja clienți activi.",
    );
    const unpaidWorkLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.checkboxes.unpaid_work",
        "Am făcut muncă neplătită recent.",
    );
    const wantsEscrowLabel = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.checkboxes.wants_escrow",
        "Doresc să folosesc escrow pentru fiecare proiect.",
    );
    const profileNote = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.profile_note",
        "Creștem scorul profilului dacă ai clienți activi și experiență solidă.",
    );
    const submitText = useAsyncTranslation(locale, "trustora.early_access.common.submit", "Trimite aplicația");
    const submittingText = useAsyncTranslation(
        locale,
        "trustora.early_access.common.submitting",
        "Trimitem aplicația...",
    );
    const skillDesign = useAsyncTranslation(locale, "trustora.early_access.provider.skills.design", "Design");
    const skillFrontend = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.skills.frontend",
        "Frontend development",
    );
    const skillBackend = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.skills.backend",
        "Backend development",
    );
    const skillFullstack = useAsyncTranslation(locale, "trustora.early_access.provider.skills.fullstack", "Full-stack");
    const skillProduct = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.skills.product",
        "Product management",
    );
    const skillQa = useAsyncTranslation(locale, "trustora.early_access.provider.skills.qa", "QA & testing");
    const skillDevops = useAsyncTranslation(locale, "trustora.early_access.provider.skills.devops", "DevOps");
    const skillMobile = useAsyncTranslation(
        locale,
        "trustora.early_access.provider.skills.mobile",
        "Mobile development",
    );

    const primarySkillOptions = [
        skillDesign,
        skillFrontend,
        skillBackend,
        skillFullstack,
        skillProduct,
        skillQa,
        skillDevops,
        skillMobile,
    ] as const;

    const [formData, setFormData] = useState({
        email: "",
        fullName: "",
        country: "",
        primarySkill: "",
        yearsExperience: "",
        hasClients: false,
        unpaidWork: false,
        wantsEscrow: false,
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
            if (!formData.primarySkill) {
                throw new Error(skillErrorText);
            }
            if (!formData.agreeToTerms) {
                throw new Error("Trebuie să accepți termenii și condițiile.");
            }

            const payload: Parameters<typeof apiClient.createEarlyAccessApplication>[0] = {
                user_type: "provider",
                email: formData.email,
                full_name: formData.fullName,
                country: formData.country,
                primary_skill: formData.primarySkill,
                years_experience: Number(formData.yearsExperience),
                has_clients: formData.hasClients,
                unpaid_work: formData.unpaidWork,
                wants_escrow: formData.wantsEscrow,
            };

            await apiClient.createEarlyAccessApplication(payload);

            setSuccess(true);
            setFormData({
                email: "",
                fullName: "",
                country: "",
                primarySkill: "",
                yearsExperience: "",
                hasClients: false,
                unpaidWork: false,
                wantsEscrow: false,
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
                                        <Label htmlFor="fullName">{fullNameLabel}</Label>
                                        <div className="relative">
                                            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="fullName"
                                                placeholder={fullNamePlaceholder}
                                                value={formData.fullName}
                                                onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="country">{countryLabel}</Label>
                                        <div className="relative">
                                            <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="country"
                                                placeholder={countryPlaceholder}
                                                value={formData.country}
                                                onChange={(event) => setFormData({ ...formData, country: event.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="primarySkill">{skillLabel}</Label>
                                            <Select
                                                value={formData.primarySkill}
                                                onValueChange={(value) => setFormData({ ...formData, primarySkill: value })}
                                            >
                                                <SelectTrigger id="primarySkill">
                                                    <SelectValue placeholder={skillPlaceholder} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {primarySkillOptions.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="yearsExperience">{yearsLabel}</Label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="yearsExperience"
                                                    type="number"
                                                    min={0}
                                                    max={80}
                                                    placeholder={yearsPlaceholder}
                                                    value={formData.yearsExperience}
                                                    onChange={(event) =>
                                                        setFormData({ ...formData, yearsExperience: event.target.value })
                                                    }
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Checkbox
                                                id="hasClients"
                                                checked={formData.hasClients}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, hasClients: checked as boolean })
                                                }
                                            />
                                            <Label htmlFor="hasClients" className="text-sm text-slate-600 dark:text-slate-300">
                                                {hasClientsLabel}
                                            </Label>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Checkbox
                                                id="unpaidWork"
                                                checked={formData.unpaidWork}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, unpaidWork: checked as boolean })
                                                }
                                            />
                                            <Label htmlFor="unpaidWork" className="text-sm text-slate-600 dark:text-slate-300">
                                                {unpaidWorkLabel}
                                            </Label>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Checkbox
                                                id="wantsEscrow"
                                                checked={formData.wantsEscrow}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, wantsEscrow: checked as boolean })
                                                }
                                            />
                                            <Label htmlFor="wantsEscrow" className="text-sm text-slate-600 dark:text-slate-300">
                                                {wantsEscrowLabel}
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 text-xs text-slate-500 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220] dark:text-slate-300">
                                        <Award className="h-4 w-4 text-emerald-500" />
                                        {profileNote}
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                                        <div className="max-h-64 overflow-y-auto pr-2">
                                            <TermsContent className="text-xs" headingClassName="text-base" locale={locale} />
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
                                            {termsAcknowledgementText}{" "}
                                            <LocalizedLink
                                                href="/terms"
                                                className="font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                                            >
                                                {termsLinkText}
                                            </LocalizedLink>{" "}
                                            {termsAndText}{" "}
                                            <LocalizedLink
                                                href="/privacy"
                                                className="font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                                            >
                                                {privacyLinkText}
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
