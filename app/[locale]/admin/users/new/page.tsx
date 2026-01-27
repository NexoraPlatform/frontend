"use client";

import { useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

export default function NewUserPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'CLIENT',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const t = useTranslations();
  const addTitle = t('admin.users.new.title');
  const addSubtitle = t('admin.users.new.subtitle');
  const infoTitle = t('admin.users.new.info_title');
  const infoDescription = t('admin.users.new.info_description');
  const errorOccurred = t('admin.users.new.error_occurred');
  const firstNameLabel = t('admin.users.new.first_name_label');
  const lastNameLabel = t('admin.users.new.last_name_label');
  const emailLabel = t('admin.users.new.email_label');
  const passwordLabel = t('admin.users.new.password_label');
  const passwordHint = t('admin.users.new.password_hint');
  const roleLabel = t('admin.users.new.role_label');
  const phoneLabel = t('admin.users.new.phone_label');
  const phonePlaceholder = t('admin.users.new.phone_placeholder');
  const creatingLabel = t('admin.users.new.creating');
  const createUserLabel = t('admin.users.new.create_user');
  const cancelLabel = t('admin.users.new.cancel');
  const roleClient = t('admin.users.new.roles.CLIENT');
  const roleProvider = t('admin.users.new.roles.PROVIDER');
  const roleAdmin = t('admin.users.new.roles.ADMIN');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.createUser(formData);
      router.push('/admin/users');
    } catch (error: any) {
      setError(error.message || errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TrustoraThemeStyles />
      <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link href="/admin/users">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{addTitle}</h1>
              <p className="text-sm text-muted-foreground">
                {addSubtitle}
              </p>
            </div>
          </div>

          <div className="max-w-full">
            <Card className="glass-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                  <UserPlus className="w-5 h-5" />
                  <span>{infoTitle}</span>
                </CardTitle>
                <CardDescription>
                  {infoDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{firstNameLabel}</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                        className="bg-white/80 dark:bg-slate-900/60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{lastNameLabel}</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        required
                        className="bg-white/80 dark:bg-slate-900/60"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">{emailLabel}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="bg-white/80 dark:bg-slate-900/60"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">{passwordLabel}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength={6}
                      className="bg-white/80 dark:bg-slate-900/60"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {passwordHint}
                    </p>
                  </div>

                  <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">{roleLabel}</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                        <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLIENT">{roleClient}</SelectItem>
                          <SelectItem value="PROVIDER">{roleProvider}</SelectItem>
                          <SelectItem value="ADMIN">{roleAdmin}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phone">{phoneLabel}</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder={phonePlaceholder}
                        className="bg-white/80 dark:bg-slate-900/60"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-6">
                    <Button type="submit" disabled={loading} className="flex-1 btn-primary">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {creatingLabel}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          {createUserLabel}
                        </>
                      )}
                    </Button>
                    <Link href="/admin/users">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200/70 bg-white/70 dark:border-slate-700/60 dark:bg-slate-900/60"
                      >
                        {cancelLabel}
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
