"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { Link } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Zap } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/contexts/auth-context';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations();
  const router = useRouter();
  const { login } = useAuth();
  const badgeText = t('auth.signin.badge');
  const titlePrefix = t('auth.signin.title_prefix');
  const titleBrand = t('auth.signin.title_brand');
  const subtitleText = t('auth.signin.subtitle');
  const benefitVerifiedContracts = t('auth.signin.benefits.verified_contracts');
  const benefitAutomatedEscrow = t('auth.signin.benefits.automated_escrow');
  const benefitProjectTimeline = t('auth.signin.benefits.project_timeline');
  const benefitSupport = t('auth.signin.benefits.support');
  const cardTitle = t('auth.signin.card_title');
  const cardDescription = t('auth.signin.card_description');
  const emailLabel = t('auth.signin.email_label');
  const emailPlaceholder = t('auth.signin.email_placeholder');
  const passwordLabel = t('auth.signin.password_label');
  const passwordPlaceholder = t('auth.signin.password_placeholder');
  const forgotPassword = t('auth.signin.forgot_password');
  const loadingText = t('auth.signin.loading');
  const submitText = t('auth.signin.submit');
  const noAccountText = t('auth.signin.no_account');
  const registerText = t('auth.signin.register');
  const genericErrorText = t('auth.signin.generic_error');
  const benefits = [benefitVerifiedContracts, benefitAutomatedEscrow, benefitProjectTimeline, benefitSupport];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || genericErrorText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />

      <div className="relative mt-8 overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-100/60 px-4 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {badgeText}
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                  {titlePrefix} <span className="text-[#1BC47D]">{titleBrand}</span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300">
                  {subtitleText}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {benefits.map((item) => (
                    <div
                      key={item}
                      className="glass-card flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {item}
                    </div>
                  ))}
              </div>
            </div>

            <Card className="glass-card border border-slate-200/60 bg-white/90 shadow-2xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
              <CardHeader className="space-y-2 text-left">
                <CardTitle className="text-2xl text-[#0F172A] dark:text-white">{cardTitle}</CardTitle>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  {cardDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{emailLabel}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{passwordLabel}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={passwordPlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                    >
                      {forgotPassword}
                    </Link>
                  </div>

                  <Button type="submit" className="w-full btn-primary text-white" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{loadingText}</span>
                      </div>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        <span className="relative z-10">{submitText}</span>
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">{noAccountText} </span>
                  <Link href="/auth/signup" className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
                    {registerText}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
