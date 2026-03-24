"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

import { AuthSocialButtons } from "@/components/auth/social-auth-buttons";
import { TrustoraLandingFooter } from "@/components/homepage/trustora-landing/footer";
import { TrustoraLandingNavigation } from "@/components/homepage/trustora-landing/navigation";
import { TrustoraLandingThemeStyles } from "@/components/homepage/trustora-landing/theme-styles";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { buildOAuthRedirectUrl } from "@/lib/backend-url";
import { Link } from "@/lib/navigation";

type OAuthProvider = "google" | "github";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const badgeText = t("auth.signin.badge");
  const titlePrefix = t("auth.signin.title_prefix");
  const titleBrand = t("auth.signin.title_brand");
  const subtitleText = t("auth.signin.subtitle");
  const cardDescription = t("auth.signin.card_description");
  const emailLabel = t("auth.signin.email_label");
  const emailPlaceholder = t("auth.signin.email_placeholder");
  const passwordLabel = t("auth.signin.password_label");
  const passwordPlaceholder = t("auth.signin.password_placeholder");
  const forgotPassword = t("auth.signin.forgot_password");
  const rememberMeLabel = t("auth.signin.remember_me");
  const rememberMeHint = t("auth.signin.remember_me_hint");
  const loadingText = t("auth.signin.loading");
  const submitText = t("auth.signin.submit");
  const noAccountText = t("auth.signin.no_account");
  const registerText = t("auth.signin.register");
  const genericErrorText = t("auth.signin.generic_error");
  const welcomeBackText = t("auth.signin.welcome_back");
  const socialDividerText = t("auth.signin.social_divider");
  const heroKickerText = t("auth.signin.hero_kicker");
  const encryptionValue = t("auth.signin.metrics.encryption_value");
  const encryptionLabel = t("auth.signin.metrics.encryption_label");
  const protocolValue = t("auth.signin.metrics.protocol_value");
  const protocolLabel = t("auth.signin.metrics.protocol_label");
  const googleText = t("auth.signin.providers.google");
  const githubText = t("auth.signin.providers.github");
  const oauthUnavailableText = t("auth.signin.oauth_unavailable");

  const getSafeCallbackUrl = () => {
    const fallback = `/${locale}/dashboard`;
    const raw = searchParams.get("callbackUrl");
    if (!raw) return fallback;

    const decoded = (() => {
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    })();

    try {
      const parsed = new URL(decoded, window.location.origin);
      if (parsed.origin !== window.location.origin) return fallback;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return decoded.startsWith("/") ? decoded : fallback;
    }
  };

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

    try {
      await login(email, password, rememberMe);
      window.location.assign(getSafeCallbackUrl());
    } catch (caughtError: any) {
      setError(caughtError.message || genericErrorText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="trustora-signin-page relative isolate overflow-x-hidden bg-background text-foreground">
      <TrustoraLandingThemeStyles scopeClassName="trustora-signin-page" />
      <TrustoraLandingNavigation />

      <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-10rem] top-28 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-[-8rem] top-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto flex max-w-7xl items-center">
          <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="hidden lg:flex lg:flex-col lg:justify-center lg:space-y-8 lg:pr-12">
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
                  <span className="block text-2xl font-bold text-primary">{encryptionValue}</span>
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {encryptionLabel}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-2xl font-bold text-primary">{protocolValue}</span>
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {protocolLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="glass-effect relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-background/70 p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)] sm:p-10">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

                <div className="relative z-10 space-y-8">
                  <div className="space-y-3 text-center lg:text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                      {badgeText}
                    </p>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold tracking-tight">{welcomeBackText}</h2>
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
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="h-12 rounded-xl border-white/10 bg-background/40 pl-11 text-foreground placeholder:text-muted-foreground/70 dark:bg-[#08111B]"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {passwordLabel}
                        </Label>
                        <Link href="/auth/forgot-password" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary hover:underline">
                          {forgotPassword}
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={passwordPlaceholder}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="h-12 rounded-xl border-white/10 bg-background/40 pl-11 pr-11 text-foreground placeholder:text-muted-foreground/70 dark:bg-[#08111B]"
                          required
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

                    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-background/30 px-4 py-3 dark:bg-[#08111B]/80">
                      <div className="space-y-1">
                        <Label
                          htmlFor="remember-me"
                          className="text-sm font-medium text-foreground"
                        >
                          {rememberMeLabel}
                        </Label>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {rememberMeHint}
                        </p>
                      </div>
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="mt-0.5 h-5 w-5 rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
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
                    {noAccountText}
                    <Link href="/auth/signup" className="ml-1 font-semibold text-primary hover:underline">
                      {registerText}
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
