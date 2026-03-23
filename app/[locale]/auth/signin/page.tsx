"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck, Zap } from "lucide-react";

import { TrustoraAuthShell } from "@/components/auth/trustora-auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "@/lib/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
  const benefitVerifiedContracts = t("auth.signin.benefits.verified_contracts");
  const benefitAutomatedEscrow = t("auth.signin.benefits.automated_escrow");
  const benefitProjectTimeline = t("auth.signin.benefits.project_timeline");
  const benefitSupport = t("auth.signin.benefits.support");
  const cardTitle = t("auth.signin.card_title");
  const cardDescription = t("auth.signin.card_description");
  const emailLabel = t("auth.signin.email_label");
  const emailPlaceholder = t("auth.signin.email_placeholder");
  const passwordLabel = t("auth.signin.password_label");
  const passwordPlaceholder = t("auth.signin.password_placeholder");
  const forgotPassword = t("auth.signin.forgot_password");
  const loadingText = t("auth.signin.loading");
  const submitText = t("auth.signin.submit");
  const noAccountText = t("auth.signin.no_account");
  const registerText = t("auth.signin.register");
  const genericErrorText = t("auth.signin.generic_error");

  const benefits = [
    benefitVerifiedContracts,
    benefitAutomatedEscrow,
    benefitProjectTimeline,
    benefitSupport,
  ];

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      window.location.assign(getSafeCallbackUrl());
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

                <div className="grid gap-4 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="rounded-2xl border border-white/10 bg-background/40 p-5"
                    >
                      <Zap className="mb-3 h-8 w-8 text-primary" />
                      <p className="text-sm leading-6 text-muted-foreground">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                  <p className="text-sm text-muted-foreground">{noAccountText}</p>
                  <Link href="/auth/signup" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
                    {registerText}
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
                    <div className="space-y-2">
                      <Label htmlFor="email">{emailLabel}</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={emailPlaceholder}
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="h-12 rounded-xl border-white/10 bg-white/70 pl-11 dark:bg-[#0B1220]"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{passwordLabel}</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={passwordPlaceholder}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="h-12 rounded-xl border-white/10 bg-white/70 pl-11 pr-11 dark:bg-[#0B1220]"
                          required
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

                    <div className="flex items-center justify-between">
                      <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">
                        {forgotPassword}
                      </Link>
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
                          <Zap className="mr-2 h-4 w-4" />
                          <span>{submitText}</span>
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">{noAccountText} </span>
                    <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                      {registerText}
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
