"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from 'next-intl';
import { Check, CheckCircle, Mail, UserRound, Building2, ClipboardList, Globe2, ChevronsUpDown } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Link } from '@/lib/navigation';
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { TermsContent } from "@/components/terms-content";
import { apiClient } from "@/lib/api";

const COUNTRY_CODES = [
    "AF", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
    "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BR", "IO",
    "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN", "CO", "KM",
    "CG", "CD", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV",
    "GQ", "ER", "EE", "ET", "FJ", "FI", "FR", "GF", "PF", "GA", "GM", "GE", "DE", "GH", "GI",
    "GR", "GL", "GD", "GP", "GU", "GT", "GN", "GW", "GY", "HT", "HN", "HK", "HU", "IS", "IN",
    "ID", "IR", "IQ", "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI", "KP", "KR", "KW",
    "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV",
    "ML", "MT", "MH", "MQ", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ",
    "MM", "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG", "NO", "OM", "PK", "PW", "PA", "PG",
    "PY", "PE", "PH", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "KN", "LC", "VC", "WS",
    "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "ES", "LK",
    "SD", "SR", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TG", "TO", "TT", "TN", "TR", "TM",
    "TC", "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VU", "VA", "VE", "VN", "VG", "VI", "YE",
    "ZM", "ZW"
];

const getFlagEmoji = (code: string) =>
    code
        .toUpperCase()
        .split("")
        .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
        .join("");

export default function EarlyAccessClientPage() {
    const locale = useLocale();
    const t = useTranslations();
    const badgeText = t("trustora.early_access.client.badge");
    const titleText = t("trustora.early_access.client.title");
    const titleHighlightText = t("trustora.early_access.client.title_highlight");
    const titleSuffixText = t("trustora.early_access.common.title_suffix");
    const subtitleText = t("trustora.early_access.client.subtitle");
    const benefitOne = t("trustora.early_access.client.benefits.preselect");
    const benefitTwo = t("trustora.early_access.client.benefits.scoring");
    const benefitThree = t("trustora.early_access.client.benefits.escrow");
    const backLinkText = t("trustora.early_access.common.back_link");
    const formTitle = t("trustora.early_access.client.form_title");
    const formDescription = t("trustora.early_access.client.form_description");
    const successText = t("trustora.early_access.client.success");
    const frequencyErrorText = t("trustora.early_access.client.error_frequency");
    const countryErrorText = t("trustora.early_access.client.error_country");
    const emailExistsErrorText = t("trustora.early_access.client.error_email_exists");
    const genericErrorText = t("trustora.early_access.common.error_generic");
    const termsRequiredErrorText = t("trustora.early_access.common.error_terms_required");
    const termsAcknowledgementText = t("trustora.early_access.common.terms_acknowledgement");
    const termsAndText = t("trustora.early_access.common.terms_and");
    const termsLinkText = t("common.terms_conditions");
    const privacyLinkText = t("common.privacy_policy");
    const submitErrorText = t("trustora.early_access.common.error_submit");
    const emailLabel = t("trustora.early_access.client.fields.email_label");
    const emailPlaceholder = t("trustora.early_access.client.fields.email_placeholder");
    const contactLabel = t("trustora.early_access.client.fields.contact_label");
    const contactPlaceholder = t("trustora.early_access.client.fields.contact_placeholder");
    const companyLabel = t("trustora.early_access.client.fields.company_label");
    const companyPlaceholder = t("trustora.early_access.client.fields.company_placeholder");
    const countryLabel = t("trustora.early_access.client.fields.country_label");
    const countryPlaceholder = t("trustora.early_access.client.fields.country_placeholder");
    const countrySearchPlaceholder = t("trustora.early_access.client.fields.country_search_placeholder");
    const countryEmptyText = t("trustora.early_access.client.fields.country_empty");
    const needsLabel = t("trustora.early_access.client.fields.needs_label");
    const needsPlaceholder = t("trustora.early_access.client.fields.needs_placeholder");
    const budgetLabel = t("trustora.early_access.client.fields.budget_label");
    const budgetPlaceholder = t("trustora.early_access.client.fields.budget_placeholder");
    const frequencyLabel = t("trustora.early_access.client.fields.frequency_label");
    const frequencyPlaceholder = t("trustora.early_access.client.fields.frequency_placeholder");
    const frequencyMonthly = t("trustora.early_access.client.fields.frequency_monthly");
    const frequencyQuarterly = t("trustora.early_access.client.fields.frequency_quarterly");
    const frequencyOnDemand = t("trustora.early_access.client.fields.frequency_on_demand");
    const frequencyOneProject = t("trustora.early_access.client.fields.frequency_one_project");
    const lostMoneyLabel = t("trustora.early_access.client.checkboxes.lost_money");
    const escrowHelpLabel = t("trustora.early_access.client.checkboxes.escrow_help");
    const submitText = t("trustora.early_access.common.submit");
    const submittingText = t("trustora.early_access.common.submitting");

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
        country: "",
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
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
    const countries = useMemo(() => {
        const displayNames = typeof Intl !== "undefined" && "DisplayNames" in Intl
            ? new Intl.DisplayNames([locale], { type: "region" })
            : null;
        return COUNTRY_CODES
            .map((code) => ({
                code,
                label: displayNames?.of(code) ?? code,
                flag: getFlagEmoji(code),
            }))
            .sort((a, b) => a.label.localeCompare(b.label, locale));
    }, [locale]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setSuccess(false);
        setIsSubmitting(true);

        try {
            if (!formData.hireFrequency) {
                throw new Error(frequencyErrorText);
            }
            if (!formData.country) {
                throw new Error(countryErrorText);
            }
            if (!formData.agreeToTerms) {
                throw new Error(termsRequiredErrorText);
            }

            const payload: Parameters<typeof apiClient.createEarlyAccessApplication>[0] = {
                user_type: "client",
                email: formData.email,
                language: locale,
                contact_name: formData.contactName,
                company_name: formData.companyName,
                country: formData.country,
                hiring_needs: formData.hiringNeeds,
                typical_project_budget: Number(formData.typicalProjectBudget),
                hire_frequency: formData.hireFrequency,
                lost_money: formData.lostMoney,
                escrow_help: formData.escrowHelp,
            };

            const response = await apiClient.createEarlyAccessApplication(payload);
            if (response?.email_exists) {
                throw new Error(emailExistsErrorText);
            }

            setSuccess(true);
            scrollToTop();
            setFormData({
                email: "",
                contactName: "",
                companyName: "",
                country: "",
                hiringNeeds: "",
                typicalProjectBudget: "",
                hireFrequency: "",
                lostMoney: false,
                escrowHelp: false,
                agreeToTerms: false,
            });
        } catch (submitError: any) {
            setError(submitError?.message ?? submitErrorText);
            scrollToTop();
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
                                <Link href="/early-access" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                                    {backLinkText}
                                </Link>
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
                                        <Label htmlFor="country">{countryLabel}</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                {formData.country
                                                    ? countries.find((country) => country.label === formData.country)?.flag
                                                    : <Globe2 className="h-4 w-4" />}
                                            </span>
                                            <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="country"
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={isCountryOpen}
                                                        className="w-full justify-between !pl-8 !pr-4"
                                                    >
                                                        {formData.country ? (
                                                            <span className="flex items-center gap-2">
                                                                <span>{formData.country}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">{countryPlaceholder}</span>
                                                        )}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                        <CommandInput placeholder={countrySearchPlaceholder} />
                                                        <CommandList>
                                                            <CommandEmpty>{countryEmptyText}</CommandEmpty>
                                                            <CommandGroup>
                                                                {countries.map((country) => (
                                                                    <CommandItem
                                                                        key={country.code}
                                                                        value={country.label}
                                                                        onSelect={() => {
                                                                            setFormData({ ...formData, country: country.label });
                                                                            setIsCountryOpen(false);
                                                                        }}
                                                                    >
                                                                        <span className="mr-2">{country.flag}</span>
                                                                        <span>{country.label}</span>
                                                                        {formData.country === country.label && (
                                                                            <Check className="ml-auto h-4 w-4" />
                                                                        )}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
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
                                            <Link
                                                href="/terms"
                                                className="font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                                            >
                                                {termsLinkText}
                                            </Link>{" "}
                                            {termsAndText}{" "}
                                            <Link
                                                href="/privacy"
                                                className="font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                                            >
                                                {privacyLinkText}
                                            </Link>
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
