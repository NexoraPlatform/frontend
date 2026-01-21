"use client";

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { Link } from '@/lib/navigation';
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
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const { register } = useAuth();
  const termsHref = `/${locale}/terms`;
  const privacyHref = `/${locale}/privacy`;
  const badgeText = t('auth.signup.badge');
  const titlePrefix = t('auth.signup.title_prefix');
  const titleBrand = t('auth.signup.title_brand');
  const subtitleText = t('auth.signup.subtitle');
  const benefitDigitalContracts = t('auth.signup.benefits.digital_contracts');
  const benefitFastVerifications = t('auth.signup.benefits.fast_verifications');
  const benefitUnifiedDashboard = t('auth.signup.benefits.unified_dashboard');
  const cardTitle = t('auth.signup.card_title');
  const cardDescription = t('auth.signup.card_description');
  const firstNameLabel = t('auth.signup.first_name_label');
  const firstNamePlaceholder = t('auth.signup.first_name_placeholder');
  const lastNameLabel = t('auth.signup.last_name_label');
  const lastNamePlaceholder = t('auth.signup.last_name_placeholder');
  const emailLabel = t('auth.signup.email_label');
  const emailPlaceholder = t('auth.signup.email_placeholder');
  const phoneLabel = t('auth.signup.phone_label');
  const phonePlaceholder = t('auth.signup.phone_placeholder');
  const roleLabel = t('auth.signup.role_label');
  const roleClient = t('auth.signup.role_client');
  const roleProvider = t('auth.signup.role_provider');
  const companyLabel = t('auth.signup.company_label');
  const companyPlaceholder = t('auth.signup.company_placeholder');
  const passwordLabel = t('auth.signup.password_label');
  const passwordPlaceholder = t('auth.signup.password_placeholder');
  const confirmPasswordLabel = t('auth.signup.confirm_password_label');
  const confirmPasswordPlaceholder = t('auth.signup.confirm_password_placeholder');
  const termsPrefix = t('auth.signup.terms_prefix');
  const termsAnd = t('auth.signup.terms_and');
  const termsLinkText = t('auth.signup.terms_link');
  const privacyLinkText = t('auth.signup.privacy_link');
  const loadingText = t('auth.signup.loading');
  const submitText = t('auth.signup.submit');
  const hasAccountText = t('auth.signup.has_account');
  const signinText = t('auth.signup.signin');
  const errorPasswordMismatch = t('auth.signup.error_password_mismatch');
  const errorTermsRequired = t('auth.signup.error_terms_required');
  const genericErrorText = t('auth.signup.generic_error');
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
