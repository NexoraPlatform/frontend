"use client";

import { useState } from "react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { AlertCircle, Building, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { TrustoraAuthShell } from "@/components/auth/trustora-auth-shell";
import { BillingDetailsForm } from "@/components/forms/BillingDetailsForm";
import { TermsContent } from "@/components/terms-content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { Link, useRouter } from "@/lib/navigation";
import { billingDetailsSchema, type BillingDetailsFormValues } from "@/types/user-forms";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "CLIENT",
    company: "",
    agreeToTerms: false,
  });
  const billingForm = useForm<BillingDetailsFormValues>({
    resolver: valibotResolver(billingDetailsSchema),
    defaultValues: {
      company_name: "",
      tax_id: "",
      trade_registry_number: "",
      billing_address: "",
      billing_city: "",
      billing_state: "",
      billing_postal_code: "",
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations();
  const router = useRouter();
  const { register } = useAuth();
  const termsHref = "/terms";
  const privacyHref = "/privacy";

  const badgeText = t("auth.signup.badge");
  const titlePrefix = t("auth.signup.title_prefix");
  const titleBrand = t("auth.signup.title_brand");
  const subtitleText = t("auth.signup.subtitle");
  const benefitDigitalContracts = t("auth.signup.benefits.digital_contracts");
  const benefitFastVerifications = t("auth.signup.benefits.fast_verifications");
  const benefitUnifiedDashboard = t("auth.signup.benefits.unified_dashboard");
  const cardTitle = t("auth.signup.card_title");
  const cardDescription = t("auth.signup.card_description");
  const firstNameLabel = t("auth.signup.first_name_label");
  const firstNamePlaceholder = t("auth.signup.first_name_placeholder");
  const lastNameLabel = t("auth.signup.last_name_label");
  const lastNamePlaceholder = t("auth.signup.last_name_placeholder");
  const emailLabel = t("auth.signup.email_label");
  const emailPlaceholder = t("auth.signup.email_placeholder");
  const phoneLabel = t("auth.signup.phone_label");
  const phonePlaceholder = t("auth.signup.phone_placeholder");
  const roleLabel = t("auth.signup.role_label");
  const roleClient = t("auth.signup.role_client");
  const roleProvider = t("auth.signup.role_provider");
  const companyLabel = t("auth.signup.company_label");
  const companyPlaceholder = t("auth.signup.company_placeholder");
  const passwordLabel = t("auth.signup.password_label");
  const passwordPlaceholder = t("auth.signup.password_placeholder");
  const confirmPasswordLabel = t("auth.signup.confirm_password_label");
  const confirmPasswordPlaceholder = t("auth.signup.confirm_password_placeholder");
  const termsPrefix = t("auth.signup.terms_prefix");
  const termsAnd = t("auth.signup.terms_and");
  const termsLinkText = t("auth.signup.terms_link");
  const privacyLinkText = t("auth.signup.privacy_link");
  const loadingText = t("auth.signup.loading");
  const submitText = t("auth.signup.submit");
  const hasAccountText = t("auth.signup.has_account");
  const signinText = t("auth.signup.signin");
  const errorPasswordMismatch = t("auth.signup.error_password_mismatch");
  const errorTermsRequired = t("auth.signup.error_terms_required");
  const genericErrorText = t("auth.signup.generic_error");

  const benefits = [
    benefitDigitalContracts,
    benefitFastVerifications,
    benefitUnifiedDashboard,
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(errorPasswordMismatch);
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError(errorTermsRequired);
      setIsLoading(false);
      return;
    }

    const billingValid = await billingForm.trigger();
    if (!billingValid) {
      setIsLoading(false);
      return;
    }

    try {
      const billingValues = billingForm.getValues();
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        company: formData.company,
        ...billingValues,
      });
      router.push("/dashboard");
    } catch (caughtError: any) {
      setError(caughtError.message || genericErrorText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TrustoraAuthShell
      badge={badgeText}
      subtitle={subtitleText}
      title={
        <>
          {titlePrefix} <span className="text-gradient">{titleBrand}</span>
        </>
      }
    >
      <section className="border-y border-white/5 bg-black/[0.02] py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="glass-effect relative overflow-hidden rounded-[2rem] border border-white/10 p-8 shadow-2xl">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {cardTitle}
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold leading-tight">{cardTitle}</h2>
                    <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                      {cardDescription}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="rounded-2xl border border-white/10 bg-background/40 p-5"
                    >
                      <UserPlus className="mb-3 h-8 w-8 text-primary" />
                      <p className="text-sm leading-6 text-muted-foreground">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {roleLabel}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{roleClient}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-background/40 p-5">
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {roleLabel}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{roleProvider}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                  <p className="text-sm text-muted-foreground">{hasAccountText}</p>
                  <Link href="/auth/signin" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
                    {signinText}
                  </Link>
                </div>
              </div>

              <Card className="glass-effect rounded-[2rem] border border-white/10 bg-background/70 shadow-none">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-2xl">{cardTitle}</CardTitle>
                  <CardDescription className="text-sm leading-6 text-muted-foreground">
                    {cardDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{firstNameLabel}</Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="firstName"
                            placeholder={firstNamePlaceholder}
                            value={formData.firstName}
                            onChange={(event) =>
                              setFormData({ ...formData, firstName: event.target.value })
                            }
                            className="h-12 rounded-xl border-white/10 bg-white/70 pl-11 dark:bg-[#0B1220]"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">{lastNameLabel}</Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="lastName"
                            placeholder={lastNamePlaceholder}
                            value={formData.lastName}
                            onChange={(event) =>
                              setFormData({ ...formData, lastName: event.target.value })
                            }
                            className="h-12 rounded-xl border-white/10 bg-white/70 pl-11 dark:bg-[#0B1220]"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{emailLabel}</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={emailPlaceholder}
                          value={formData.email}
                          onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                          className="h-12 rounded-xl border-white/10 bg-white/70 pl-11 dark:bg-[#0B1220]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">{phoneLabel}</Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="phone"
                            placeholder={phonePlaceholder}
                            value={formData.phone}
                            onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                            className="h-12 rounded-xl border-white/10 bg-white/70 pl-11 dark:bg-[#0B1220]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">{roleLabel}</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/70 dark:bg-[#0B1220]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLIENT">{roleClient}</SelectItem>
                            <SelectItem value="PROVIDER">{roleProvider}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">{companyLabel}</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="company"
                          placeholder={companyPlaceholder}
                          value={formData.company}
                          onChange={(event) => setFormData({ ...formData, company: event.target.value })}
                          className="h-12 rounded-xl border-white/10 bg-white/70 pl-11 dark:bg-[#0B1220]"
                        />
                      </div>
                    </div>

                    <Form {...billingForm}>
                      <BillingDetailsForm className="rounded-2xl border border-white/10 bg-background/40 p-4" />
                    </Form>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="password">{passwordLabel}</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={passwordPlaceholder}
                            value={formData.password}
                            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                            className="h-12 rounded-xl border-white/10 bg-white/70 pl-11 pr-11 dark:bg-[#0B1220]"
                            required
                            minLength={8}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                            onClick={() => setShowPassword((value) => !value)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{confirmPasswordLabel}</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={confirmPasswordPlaceholder}
                            value={formData.confirmPassword}
                            onChange={(event) =>
                              setFormData({ ...formData, confirmPassword: event.target.value })
                            }
                            className="h-12 rounded-xl border-white/10 bg-white/70 pl-11 pr-11 dark:bg-[#0B1220]"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                            onClick={() => setShowConfirmPassword((value) => !value)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                      <div className="max-h-64 overflow-y-auto pr-2">
                        <TermsContent className="text-xs" headingClassName="text-base" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-background/30 p-4">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, agreeToTerms: checked as boolean })
                        }
                      />
                      <Label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
                        {termsPrefix}{" "}
                        <Link href={termsHref} className="font-medium text-primary hover:underline">
                          {termsLinkText}
                        </Link>{" "}
                        {termsAnd}{" "}
                        <Link href={privacyHref} className="font-medium text-primary hover:underline">
                          {privacyLinkText}
                        </Link>
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="h-12 w-full rounded-xl bg-primary text-base font-medium text-white hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>{loadingText}</span>
                        </div>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          {submitText}
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">{hasAccountText} </span>
                    <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                      {signinText}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </TrustoraAuthShell>
  );
}
