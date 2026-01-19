"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, UserPlus, Building } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/contexts/auth-context';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { TermsContent } from '@/components/terms-content';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import type { Locale } from '@/types/locale';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CLIENT',
    company: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';
  const router = useRouter();
  const { register } = useAuth();
  const termsHref = `/${locale}/terms`;
  const privacyHref = `/${locale}/privacy`;
  const badgeText = useAsyncTranslation(locale, 'auth.signup.badge', 'Începe cu Trustora');
  const titlePrefix = useAsyncTranslation(locale, 'auth.signup.title_prefix', 'Creează-ți contul');
  const titleBrand = useAsyncTranslation(locale, 'auth.signup.title_brand', 'Trustora');
  const subtitleText = useAsyncTranslation(
    locale,
    'auth.signup.subtitle',
    'Configurează profilul tău și pregătește-ți proiectele pentru colaborări sigure și transparente.',
  );
  const benefitDigitalContracts = useAsyncTranslation(
    locale,
    'auth.signup.benefits.digital_contracts',
    'Contracte digitale cu escrow automatizat',
  );
  const benefitFastVerifications = useAsyncTranslation(
    locale,
    'auth.signup.benefits.fast_verifications',
    'Verificări rapide pentru clienți și prestatori',
  );
  const benefitUnifiedDashboard = useAsyncTranslation(
    locale,
    'auth.signup.benefits.unified_dashboard',
    'Dashboard unificat pentru proiecte și plăți',
  );
  const cardTitle = useAsyncTranslation(locale, 'auth.signup.card_title', 'Înregistrare');
  const cardDescription = useAsyncTranslation(
    locale,
    'auth.signup.card_description',
    'Completează datele pentru a-ți crea contul Trustora.',
  );
  const firstNameLabel = useAsyncTranslation(locale, 'auth.signup.first_name_label', 'Prenume');
  const firstNamePlaceholder = useAsyncTranslation(locale, 'auth.signup.first_name_placeholder', 'Ion');
  const lastNameLabel = useAsyncTranslation(locale, 'auth.signup.last_name_label', 'Nume');
  const lastNamePlaceholder = useAsyncTranslation(locale, 'auth.signup.last_name_placeholder', 'Popescu');
  const emailLabel = useAsyncTranslation(locale, 'auth.signup.email_label', 'Email');
  const emailPlaceholder = useAsyncTranslation(locale, 'auth.signup.email_placeholder', 'email@exemplu.ro');
  const phoneLabel = useAsyncTranslation(locale, 'auth.signup.phone_label', 'Telefon');
  const phonePlaceholder = useAsyncTranslation(locale, 'auth.signup.phone_placeholder', '+40 123 456 789');
  const roleLabel = useAsyncTranslation(locale, 'auth.signup.role_label', 'Tip cont');
  const roleClient = useAsyncTranslation(locale, 'auth.signup.role_client', 'Client - Caut servicii IT');
  const roleProvider = useAsyncTranslation(locale, 'auth.signup.role_provider', 'Prestator - Ofer servicii IT');
  const companyLabel = useAsyncTranslation(locale, 'auth.signup.company_label', 'Companie (opțional)');
  const companyPlaceholder = useAsyncTranslation(locale, 'auth.signup.company_placeholder', 'Numele companiei');
  const passwordLabel = useAsyncTranslation(locale, 'auth.signup.password_label', 'Parola');
  const passwordPlaceholder = useAsyncTranslation(locale, 'auth.signup.password_placeholder', 'Minim 8 caractere');
  const confirmPasswordLabel = useAsyncTranslation(locale, 'auth.signup.confirm_password_label', 'Confirmă parola');
  const confirmPasswordPlaceholder = useAsyncTranslation(
    locale,
    'auth.signup.confirm_password_placeholder',
    'Repetă parola',
  );
  const termsPrefix = useAsyncTranslation(locale, 'auth.signup.terms_prefix', 'Sunt de acord cu');
  const termsAnd = useAsyncTranslation(locale, 'auth.signup.terms_and', 'și');
  const termsLinkText = useAsyncTranslation(locale, 'auth.signup.terms_link', 'Termenii și Condițiile');
  const privacyLinkText = useAsyncTranslation(locale, 'auth.signup.privacy_link', 'Politica de Confidențialitate');
  const loadingText = useAsyncTranslation(locale, 'auth.signup.loading', 'Se creează contul...');
  const submitText = useAsyncTranslation(locale, 'auth.signup.submit', 'Creează contul');
  const hasAccountText = useAsyncTranslation(locale, 'auth.signup.has_account', 'Ai deja cont?');
  const signinText = useAsyncTranslation(locale, 'auth.signup.signin', 'Conectează-te');
  const errorPasswordMismatch = useAsyncTranslation(
    locale,
    'auth.signup.error_password_mismatch',
    'Parolele nu se potrivesc',
  );
  const errorTermsRequired = useAsyncTranslation(
    locale,
    'auth.signup.error_terms_required',
    'Trebuie să accepți termenii și condițiile',
  );
  const genericErrorText = useAsyncTranslation(
    locale,
    'auth.signup.generic_error',
    'A apărut o eroare. Încearcă din nou.',
  );
  const benefits = [benefitDigitalContracts, benefitFastVerifications, benefitUnifiedDashboard];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });
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
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] items-start">
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
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                {benefits.map((item) => (
                  <div
                    key={item}
                    className="glass-card flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 font-medium shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]"
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
                  <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{firstNameLabel}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="firstName"
                          placeholder={firstNamePlaceholder}
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">{lastNameLabel}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="lastName"
                          placeholder={lastNamePlaceholder}
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{emailLabel}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={emailPlaceholder}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{phoneLabel}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="phone"
                          placeholder={phonePlaceholder}
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">{roleLabel}</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLIENT">{roleClient}</SelectItem>
                          <SelectItem value="PROVIDER">{roleProvider}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.role === 'PROVIDER' && (
                    <div className="space-y-2">
                      <Label htmlFor="company">{companyLabel}</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="company"
                          placeholder={companyPlaceholder}
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">{passwordLabel}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={passwordPlaceholder}
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="pl-10 pr-10"
                          required
                          minLength={8}
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

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{confirmPasswordLabel}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder={confirmPasswordPlaceholder}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
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
                      onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {termsPrefix}{' '}
                      <Link href={termsHref} className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
                        {termsLinkText}
                      </Link>{' '}
                      {termsAnd}{' '}
                      <Link href={privacyHref} className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
                        {privacyLinkText}
                      </Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full btn-primary text-white" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{loadingText}</span>
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {submitText}
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">{hasAccountText} </span>
                  <Link href="/auth/signin" className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
                    {signinText}
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
