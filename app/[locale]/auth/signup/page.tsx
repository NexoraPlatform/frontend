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
  const locale = pathname.split('/')[1] || 'ro';
  const router = useRouter();
  const { register } = useAuth();
  const termsHref = `/${locale}/terms`;
  const privacyHref = `/${locale}/privacy`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Parolele nu se potrivesc');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Trebuie să accepți termenii și condițiile');
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
      setError(error.message || 'A apărut o eroare. Încearcă din nou.');
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
                Începe cu Trustora
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                  Creează-ți contul <span className="text-[#1BC47D]">Trustora</span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300">
                  Configurează profilul tău și pregătește-ți proiectele pentru colaborări sigure și transparente.
                </p>
              </div>
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                {[
                  'Contracte digitale cu escrow automatizat',
                  'Verificări rapide pentru clienți și prestatori',
                  'Dashboard unificat pentru proiecte și plăți',
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
            </div>

            <Card className="glass-card border border-slate-200/60 bg-white/90 shadow-2xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
              <CardHeader className="space-y-2 text-left">
                <CardTitle className="text-2xl text-[#0F172A] dark:text-white">Înregistrare</CardTitle>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  Completează datele pentru a-ți crea contul Trustora.
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
                      <Label htmlFor="firstName">Prenume</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="firstName"
                          placeholder="Ion"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nume</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="lastName"
                          placeholder="Popescu"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@exemplu.ro"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="phone"
                          placeholder="+40 123 456 789"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Tip cont</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLIENT">Client - Caut servicii IT</SelectItem>
                          <SelectItem value="PROVIDER">Prestator - Ofer servicii IT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.role === 'PROVIDER' && (
                    <div className="space-y-2">
                      <Label htmlFor="company">Companie (opțional)</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="company"
                          placeholder="Numele companiei"
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Parola</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minim 8 caractere"
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
                      <Label htmlFor="confirmPassword">Confirmă parola</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repetă parola"
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
                      Sunt de acord cu{' '}
                      <Link href={termsHref} className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
                        Termenii și Condițiile
                      </Link>{' '}
                      și{' '}
                      <Link href={privacyHref} className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
                        Politica de Confidențialitate
                      </Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full btn-primary text-white" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Se creează contul...</span>
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Creează contul
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Ai deja cont? </span>
                  <Link href="/auth/signin" className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
                    Conectează-te
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
