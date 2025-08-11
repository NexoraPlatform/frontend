'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    ArrowLeft,
    Plus,
    AlertCircle,
    Loader2,
    DollarSign,
    Clock,
    Package,
    Zap,
    CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

type ClientProps = {
    serviceId?: string; // vine din searchParams
};

export default function NewProviderServiceClient({ serviceId }: ClientProps) {
    const { user, loading } = useAuth();
    const [service, setService] = useState<any>(null);
    const [formData, setFormData] = useState({
        pricingType: 'FIXED',
        basePrice: '',
        hourlyRate: '',
        dailyRate: '',
        weeklyRate: '',
        monthlyRate: '',
        negotiable: false,
        minBudget: '',
        maxBudget: '',
        deliveryTime: '',
        revisions: '3',
        rushDelivery: false,
        rushMultiplier: '1.5',
        packages: {
            basic: { name: '', price: '', deliveryTime: '', features: [] as string[] },
            standard: { name: '', price: '', deliveryTime: '', features: [] as string[] },
            premium: { name: '', price: '', deliveryTime: '', features: [] as string[] },
        },
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Guard de autentificare/rol + încărcare serviciu
    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/auth/signin');
            return;
        }

        if (user.role !== 'PROVIDER') {
            router.push('/dashboard');
            return;
        }

        if (serviceId) {
            (async () => {
                try {
                    const serviceData = await apiClient.getService(serviceId);
                    setService(serviceData);
                } catch {
                    setError('Nu s-a putut încărca serviciul');
                }
            })();
        }
    }, [loading, user, router, serviceId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!serviceId) {
            setError('ID-ul serviciului lipsește');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const providerData = {
                pricingType: formData.pricingType,
                basePrice: parseFloat(formData.basePrice),
                hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
                dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
                weeklyRate: formData.weeklyRate ? parseFloat(formData.weeklyRate) : undefined,
                monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : undefined,
                negotiable: formData.negotiable,
                minBudget: formData.minBudget ? parseFloat(formData.minBudget) : undefined,
                maxBudget: formData.maxBudget ? parseFloat(formData.maxBudget) : undefined,
                deliveryTime: formData.deliveryTime ? parseInt(formData.deliveryTime) : undefined,
                revisions: parseInt(formData.revisions),
                rushDelivery: formData.rushDelivery,
                rushMultiplier: formData.rushDelivery ? parseFloat(formData.rushMultiplier) : undefined,
                packages: formData.packages,
            };

            await apiClient.addServiceProvider(serviceId, providerData);
            router.push('/dashboard?tab=services');
        } catch (err: any) {
            setError(err?.message || 'A apărut o eroare');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[40vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'PROVIDER') return null;

    return (
        <>
            {/* Header local pentru pagină */}
            <div className="flex items-center space-x-4 mb-8">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Oferă Serviciul</h1>
                    <p className="text-muted-foreground">Setează-ți tarifele și condițiile pentru acest serviciu</p>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {service && (
                <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{service.title}</h3>
                                <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">{service.description}</p>
                                <Badge className="bg-blue-600 text-white">{service.category?.name}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
                {/* Pricing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <DollarSign className="w-5 h-5" />
                            <span>Configurare Tarife</span>
                        </CardTitle>
                        <CardDescription>Alege tipul de tarif și setează prețurile tale</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="pricingType">Tip Tarif *</Label>
                            <Select
                                value={formData.pricingType}
                                onValueChange={(value) => setFormData({ ...formData, pricingType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIXED">Preț Fix per Proiect</SelectItem>
                                    <SelectItem value="HOURLY">Tarif pe Oră</SelectItem>
                                    <SelectItem value="DAILY">Tarif pe Zi</SelectItem>
                                    <SelectItem value="WEEKLY">Tarif pe Săptămână</SelectItem>
                                    <SelectItem value="MONTHLY">Tarif pe Lună</SelectItem>
                                    <SelectItem value="CUSTOM">Preț Personalizat/Negociabil</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="basePrice">Preț de Bază (RON) *</Label>
                                <Input
                                    id="basePrice"
                                    type="number"
                                    value={formData.basePrice}
                                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                    placeholder="1500"
                                    required
                                />
                            </div>

                            {formData.pricingType === 'HOURLY' && (
                                <div>
                                    <Label htmlFor="hourlyRate">Tarif pe Oră (RON)</Label>
                                    <Input
                                        id="hourlyRate"
                                        type="number"
                                        value={formData.hourlyRate}
                                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                        placeholder="50"
                                    />
                                </div>
                            )}

                            {formData.pricingType === 'DAILY' && (
                                <div>
                                    <Label htmlFor="dailyRate">Tarif pe Zi (RON)</Label>
                                    <Input
                                        id="dailyRate"
                                        type="number"
                                        value={formData.dailyRate}
                                        onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                                        placeholder="400"
                                    />
                                </div>
                            )}

                            {formData.pricingType === 'CUSTOM' && (
                                <>
                                    <div>
                                        <Label htmlFor="minBudget">Buget Minim (RON)</Label>
                                        <Input
                                            id="minBudget"
                                            type="number"
                                            value={formData.minBudget}
                                            onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                                            placeholder="500"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="maxBudget">Buget Maxim (RON)</Label>
                                        <Input
                                            id="maxBudget"
                                            type="number"
                                            value={formData.maxBudget}
                                            onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                                            placeholder="10000"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Preț Negociabil</Label>
                                <p className="text-sm text-muted-foreground">Permite clienților să negocieze prețul</p>
                            </div>
                            <Switch
                                checked={formData.negotiable}
                                onCheckedChange={(checked) => setFormData({ ...formData, negotiable: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery & Terms */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>Livrare și Condiții</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="deliveryTime">Timp de Livrare (zile)</Label>
                                <Input
                                    id="deliveryTime"
                                    type="number"
                                    value={formData.deliveryTime}
                                    onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                                    placeholder="14"
                                />
                            </div>
                            <div>
                                <Label htmlFor="revisions">Revizuiri Incluse</Label>
                                <Input
                                    id="revisions"
                                    type="number"
                                    value={formData.revisions}
                                    onChange={(e) => setFormData({ ...formData, revisions: e.target.value })}
                                    placeholder="3"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Livrare Urgentă</Label>
                                <p className="text-sm text-muted-foreground">
                                    Oferă opțiunea de livrare urgentă cu cost suplimentar
                                </p>
                            </div>
                            <Switch
                                checked={formData.rushDelivery}
                                onCheckedChange={(checked) => setFormData({ ...formData, rushDelivery: checked })}
                            />
                        </div>

                        {formData.rushDelivery && (
                            <div>
                                <Label htmlFor="rushMultiplier">Multiplicator Urgență</Label>
                                <Input
                                    id="rushMultiplier"
                                    type="number"
                                    step="0.1"
                                    value={formData.rushMultiplier}
                                    onChange={(e) => setFormData({ ...formData, rushMultiplier: e.target.value })}
                                    placeholder="1.5"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Prețul va fi înmulțit cu acest factor pentru livrare urgentă
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex space-x-4">
                    <Button type="submit" disabled={submitting} className="flex-1" onClick={handleSubmit}>
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Se înregistrează...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Oferă Serviciul
                            </>
                        )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Anulează
                    </Button>
                </div>
            </form>
        </>
    );
}
