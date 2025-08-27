"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  ArrowLeft,
  Save,
  Globe,
  DollarSign,
  Mail,
  Shield,
  Bell,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2, Clock
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Nexora',
    siteDescription: 'Platforma românească pentru servicii IT profesionale',
    siteUrl: 'https://nexora.ro',
    adminEmail: 'admin@nexora.ro',
    supportEmail: 'suport@nexora.ro',

    platformCommission: '5',
    minServicePrice: '50',
    maxServicePrice: '50000',
    defaultCurrency: 'RON',
    allowGuestBrowsing: true,
    requireEmailVerification: true,
    autoApproveServices: false,

    stripeEnabled: true,
    paypalEnabled: true,
    bankTransferEnabled: false,
    escrowEnabled: true,

    emailProvider: 'sendgrid',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',

    twoFactorRequired: false,
    passwordMinLength: '8',
    sessionTimeout: '24',
    maxLoginAttempts: '5',

    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,

    maintenanceMode: false,
    registrationOpen: true,
    featuredServicesCount: '8',
    recentServicesCount: '12'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Setări Platformă</h1>
            <p className="text-muted-foreground">
              Configurează setările generale ale platformei Nexora
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Se salvează...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvează Toate
            </>
          )}
        </Button>
      </div>

      {saved && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Setările au fost salvate cu succes!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Platformă</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Plăți</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Securitate</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificări</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Informații Site</span>
                </CardTitle>
                <CardDescription>
                  Configurează informațiile de bază ale site-ului
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Nume Site</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSetting('siteName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="siteDescription">Descriere Site</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => updateSetting('siteDescription', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">URL Site</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => updateSetting('siteUrl', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Contact</span>
                </CardTitle>
                <CardDescription>
                  Adresele de email pentru contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="adminEmail">Email Administrator</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => updateSetting('adminEmail', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Email Suport</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => updateSetting('supportEmail', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platform">
          <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Setări Financiare</span>
                </CardTitle>
                <CardDescription>
                  Configurează comisioanele și limitele de preț
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="platformCommission">Comision Platformă (%)</Label>
                  <Input
                    id="platformCommission"
                    type="number"
                    value={settings.platformCommission}
                    onChange={(e) => updateSetting('platformCommission', e.target.value)}
                    min="0"
                    max="50"
                  />
                </div>
                <div>
                  <Label htmlFor="minServicePrice">Preț Minim Serviciu (RON)</Label>
                  <Input
                    id="minServicePrice"
                    type="number"
                    value={settings.minServicePrice}
                    onChange={(e) => updateSetting('minServicePrice', e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="maxServicePrice">Preț Maxim Serviciu (RON)</Label>
                  <Input
                    id="maxServicePrice"
                    type="number"
                    value={settings.maxServicePrice}
                    onChange={(e) => updateSetting('maxServicePrice', e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultCurrency">Moneda Implicită</Label>
                  <Select value={settings.defaultCurrency} onValueChange={(value) => updateSetting('defaultCurrency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RON">RON - Leu Românesc</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - Dolar American</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Setări Utilizatori</span>
                </CardTitle>
                <CardDescription>
                  Configurează comportamentul utilizatorilor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permite navigarea fără cont</Label>
                    <p className="text-sm text-muted-foreground">
                      Utilizatorii pot vedea serviciile fără să se înregistreze
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowGuestBrowsing}
                    onCheckedChange={(checked) => updateSetting('allowGuestBrowsing', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Verificare email obligatorie</Label>
                    <p className="text-sm text-muted-foreground">
                      Utilizatorii trebuie să își verifice email-ul
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-aprobare servicii</Label>
                    <p className="text-sm text-muted-foreground">
                      Serviciile sunt aprobate automat
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoApproveServices}
                    onCheckedChange={(checked) => updateSetting('autoApproveServices', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Înregistrări deschise</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite înregistrarea de utilizatori noi
                    </p>
                  </div>
                  <Switch
                    checked={settings.registrationOpen}
                    onCheckedChange={(checked) => updateSetting('registrationOpen', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Metode de Plată</span>
                </CardTitle>
                <CardDescription>
                  Activează sau dezactivează metodele de plată
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <Label>Stripe</Label>
                      <p className="text-sm text-muted-foreground">
                        Carduri de credit și debit
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={settings.stripeEnabled ? "default" : "secondary"}>
                      {settings.stripeEnabled ? "Activ" : "Inactiv"}
                    </Badge>
                    <Switch
                      checked={settings.stripeEnabled}
                      onCheckedChange={(checked) => updateSetting('stripeEnabled', checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <Label>PayPal</Label>
                      <p className="text-sm text-muted-foreground">
                        Plăți prin PayPal
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={settings.paypalEnabled ? "default" : "secondary"}>
                      {settings.paypalEnabled ? "Activ" : "Inactiv"}
                    </Badge>
                    <Switch
                      checked={settings.paypalEnabled}
                      onCheckedChange={(checked) => updateSetting('paypalEnabled', checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <Label>Transfer Bancar</Label>
                      <p className="text-sm text-muted-foreground">
                        Plăți prin transfer bancar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={settings.bankTransferEnabled ? "default" : "secondary"}>
                      {settings.bankTransferEnabled ? "Activ" : "Inactiv"}
                    </Badge>
                    <Switch
                      checked={settings.bankTransferEnabled}
                      onCheckedChange={(checked) => updateSetting('bankTransferEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Securitate Plăți</span>
                </CardTitle>
                <CardDescription>
                  Configurează securitatea plăților
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sistem Escrow</Label>
                    <p className="text-sm text-muted-foreground">
                      Banii sunt ținuți în siguranță până la finalizarea proiectului
                    </p>
                  </div>
                  <Switch
                    checked={settings.escrowEnabled}
                    onCheckedChange={(checked) => updateSetting('escrowEnabled', checked)}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sistemul Escrow este recomandat pentru protecția atât a clienților cât și a prestatorilor.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Configurare Email</span>
              </CardTitle>
              <CardDescription>
                Configurează setările pentru trimiterea de email-uri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="emailProvider">Furnizor Email</Label>
                <Select value={settings.emailProvider} onValueChange={(value) => updateSetting('emailProvider', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="smtp">SMTP Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.emailProvider === 'smtp' && (
                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpHost}
                      onChange={(e) => updateSetting('smtpHost', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={settings.smtpPort}
                      onChange={(e) => updateSetting('smtpPort', e.target.value)}
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpUser">SMTP User</Label>
                    <Input
                      id="smtpUser"
                      value={settings.smtpUser}
                      onChange={(e) => updateSetting('smtpUser', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={settings.smtpPassword}
                      onChange={(e) => updateSetting('smtpPassword', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Autentificare</span>
                </CardTitle>
                <CardDescription>
                  Configurează securitatea autentificării
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autentificare cu 2 factori obligatorie</Label>
                    <p className="text-sm text-muted-foreground">
                      Toți utilizatorii trebuie să activeze 2FA
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorRequired}
                    onCheckedChange={(checked) => updateSetting('twoFactorRequired', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="passwordMinLength">Lungime minimă parolă</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => updateSetting('passwordMinLength', e.target.value)}
                    min="6"
                    max="20"
                  />
                </div>

                <div>
                  <Label htmlFor="maxLoginAttempts">Încercări maxime de login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => updateSetting('maxLoginAttempts', e.target.value)}
                    min="3"
                    max="10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Sesiuni</span>
                </CardTitle>
                <CardDescription>
                  Configurează durata sesiunilor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sessionTimeout">Timeout sesiune (ore)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', e.target.value)}
                    min="1"
                    max="168"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Utilizatorii vor fi deconectați automat după această perioadă de inactivitate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Setări Notificări</span>
              </CardTitle>
              <CardDescription>
                Configurează tipurile de notificări activate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificări Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Trimite notificări prin email pentru evenimente importante
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificări SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Trimite notificări prin SMS pentru evenimente critice
                  </p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificări Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Trimite notificări push în browser
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Email-uri Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite trimiterea de email-uri promoționale
                  </p>
                </div>
                <Switch
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
