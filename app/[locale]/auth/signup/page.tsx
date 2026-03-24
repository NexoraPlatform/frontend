"use client";

import { useState } from "react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { AlertCircle, Building, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { AuthSocialButtons } from "@/components/auth/social-auth-buttons";
import { BillingDetailsForm } from "@/components/forms/BillingDetailsForm";
import { TrustoraLandingFooter } from "@/components/homepage/trustora-landing/footer";
import { TrustoraLandingNavigation } from "@/components/homepage/trustora-landing/navigation";
import { TrustoraLandingThemeStyles } from "@/components/homepage/trustora-landing/theme-styles";
import { TermsContent } from "@/components/terms-content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { buildOAuthRedirectUrl } from "@/lib/backend-url";
import { Link, useRouter } from "@/lib/navigation";
import { billingDetailsSchema, type BillingDetailsFormValues } from "@/types/user-forms";

type OAuthProvider = "google" | "github";

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
  const socialDividerText = t("auth.signup.social_divider");
  const heroKickerText = t("auth.signup.hero_kicker");
  const accountValue = t("auth.signup.metrics.account_value");
  const accountLabel = t("auth.signup.metrics.account_label");
  const securityValue = t("auth.signup.metrics.security_value");
  const securityLabel = t("auth.signup.metrics.security_label");
  const googleText = t("auth.signup.providers.google");
  const githubText = t("auth.signup.providers.github");
  const oauthUnavailableText = t("auth.signup.oauth_unavailable");

  const handleSocialSignIn = (provider: OAuthProvider) => {
    const redirectUrl = buildOAuthRedirectUrl(provider);
    if (!redirectUrl) {
      setError(oauthUnavailableText);
      return;
    }

    window.location.assign(redirectUrl);
  };

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
    <div className="trustora-signup-page relative isolate overflow-x-hidden bg-background text-foreground">
      <TrustoraLandingThemeStyles scopeClassName="trustora-signup-page" />
      <TrustoraLandingNavigation />

      <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-10rem] top-28 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-[-8rem] top-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="hidden lg:flex lg:flex-col lg:justify-start lg:space-y-8 lg:pr-12 lg:pt-10">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  {heroKickerText}
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="max-w-2xl text-5xl font-bold leading-[0.95] tracking-tight xl:text-7xl">
                  {titlePrefix}
                  <br />
                  <span className="text-gradient">{titleBrand}</span>
                </h1>

                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  {subtitleText}
                </p>
              </div>

              <div className="grid max-w-lg grid-cols-2 gap-6 pt-2">
                <div className="space-y-1">
                  <span className="block text-2xl font-bold text-primary">{accountValue}</span>
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {accountLabel}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-2xl font-bold text-primary">{securityValue}</span>
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {securityLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="glass-effect relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-background/70 p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)] sm:p-10">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

                <div className="relative z-10 space-y-8">
                  <div className="space-y-3 text-center lg:text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                      {badgeText}
                    </p>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold tracking-tight">{cardTitle}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">{cardDescription}</p>
                    </div>
                  </div>

                  <AuthSocialButtons
                    githubText={githubText}
                    googleText={googleText}
                    onProviderSelect={handleSocialSignIn}
                  />

                  <div className="relative flex items-center py-1">
                    <div className="flex-1 border-t border-white/10" />
                    <span className="mx-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {socialDividerText}
                    </span>
                    <div className="flex-1 border-t border-white/10" />
                  </div>

                  {error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {firstNameLabel}
                        </Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="firstName"
                            placeholder={firstNamePlaceholder}
                            value={formData.firstName}
                            onChange={(event) =>
                              setFormData({ ...formData, firstName: event.target.value })
                            }
                            className="h-12 rounded-xl border-white/10 bg-background/40 pl-11 text-foreground placeholder:text-muted-foreground/70 dark:bg-[#08111B]"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {lastNameLabel}
                        </Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="lastName"
                            placeholder={lastNamePlaceholder}
                            value={formData.lastName}
                            onChange={(event) =>
                              setFormData({ ...formData, lastName: event.target.value })
                            }
                            className="h-12 rounded-xl border-white/10 bg-background/40 pl-11 text-foreground placeholder:text-muted-foreground/70 dark:bg-[#08111B]"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {emailLabel}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={emailPlaceholder}
                          value={formData.email}
                          onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                          className="h-12 rounded-xl border-white/10 bg-background/40 pl-11 text-foreground placeholder:text-muted-foreground/70 dark:bg-[#08111B]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {phoneLabel}
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="phone"
                            placeholder={phonePlaceholder}
                            value={formData.phone}
                            onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                            className="h-12 rounded-xl border-white/10 bg-background/40 pl-11 text-foreground placeholder:text-muted-foreground/70 dark:bg-[#08111B]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {roleLabel}
                        </Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-white/10 bg-background/40 text-foreground dark:bg-[#08111B]">
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
                      <Label htmlFor="company" className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {companyLabel}
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="company"
                          placeholder={companyPlaceholder}
                          value={formData.company}
                          onChange={(event) => setFormData({ ...formData, company: event.target.value })}
                          className="h-12 rounded-xl border-white/10 bg-background/40 pl-11 text-foreground placeholder:text-muted-foreground/70 dark:bg-[#08111B]"
                        />
                      </div>
                    </div>

                    <Form {...billingForm}>
                      <BillingDetailsForm className="rounded-2xl border border-white/10 bg-background/40 p-4" />
                    </Form>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {passwordLabel}
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={passwordPlaceholder}
                            value={formData.password}
                            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                            className="h-12 rounded-xl border-white/10 bg-background/40 pl-11 pr-11 text-foreground placeholder:text-muted-foreground/70 dark:bg-[#08111B]"
                            required
                            minLength={8}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-primary"
                            onClick={() => setShowPassword((value) => !value)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {confirmPasswordLabel}
                        </Label>
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
                            className="h-12 rounded-xl border-white/10 bg-background/40 pl-11 pr-11 text-foreground placeholder:text-muted-foreground/70 dark:bg-[#08111B]"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-primary"
                            onClick={() => setShowConfirmPassword((value) => !value)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                      <div className="max-h-64 overflow-y-auto pr-2">
                        <TermsContent className="text-xs" headingClassName="text-base" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/30 p-4">
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
                      className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          <span>{loadingText}</span>
                        </div>
                      ) : (
                        submitText
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground">
                    {hasAccountText}
                    <Link href="/auth/signin" className="ml-1 font-semibold text-primary hover:underline">
                      {signinText}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <TrustoraLandingFooter />
    </div>
  );
}
