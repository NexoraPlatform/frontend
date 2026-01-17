"use client";

import { useState } from "react";
import { CheckCircle, Mail, UserRound, Building2, ClipboardList } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LocalizedLink } from "@/components/LocalizedLink";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";

const hireFrequencyOptions = ["O dată pe lună", "Trimestrial", "La nevoie", "Proiect unic"] as const;

export default function EarlyAccessClientPage() {
    const [formData, setFormData] = useState({
        email: "",
        contactName: "",
        companyName: "",
        hiringNeeds: "",
        typicalProjectBudget: "",
        hireFrequency: "",
        lostMoney: false,
        escrowHelp: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setSuccess(false);
        setIsSubmitting(true);

        try {
            if (!formData.hireFrequency) {
                throw new Error("Selectează frecvența de recrutare.");
            }

            const payload = {
                user_type: "client",
                email: formData.email,
                contact_name: formData.contactName,
                company_name: formData.companyName,
                hiring_needs: formData.hiringNeeds,
                typical_project_budget: Number(formData.typicalProjectBudget),
                hire_frequency: formData.hireFrequency,
                lost_money: formData.lostMoney,
                escrow_help: formData.escrowHelp,
            };

            const response = await fetch("/api/early-access", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                const message = errorBody?.message ?? "A apărut o eroare. Încearcă din nou.";
                throw new Error(message);
            }

            setSuccess(true);
            setFormData({
                email: "",
                contactName: "",
                companyName: "",
                hiringNeeds: "",
                typicalProjectBudget: "",
                hireFrequency: "",
                lostMoney: false,
                escrowHelp: false,
            });
        } catch (submitError: any) {
            setError(submitError?.message ?? "Nu am putut trimite formularul.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />

            <div className="relative mt-8 overflow-hidden">
                <div className="absolute inset-0 hero-gradient" />
                <div className="relative container mx-auto px-4 py-16">
                    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] items-start">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-100/60 px-4 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                Formular client
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                                    Înscriere <span className="text-[#1BC47D]">client</span> pentru early access
                                </h1>
                                <p className="text-lg text-slate-600 dark:text-slate-300">
                                    Spune-ne despre compania ta și nevoile de recrutare. Îți trimitem acces prioritar la prestatorii
                                    potriviți.
                                </p>
                            </div>
                            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                {[
                                    "Preselectăm prestatori verificați pentru tine",
                                    "Primești un scoring transparent al aplicațiilor",
                                    "Poți activa escrow automat din prima etapă",
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
                            <div>
                                <LocalizedLink href="/early-access" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                                    ← Înapoi la alegerea tipului de cont
                                </LocalizedLink>
                            </div>
                        </div>

                        <Card className="glass-card border border-slate-200/60 bg-white/90 shadow-2xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
                            <CardHeader className="space-y-2 text-left">
                                <CardTitle className="text-2xl text-[#0F172A] dark:text-white">Completează datele</CardTitle>
                                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                                    Toate câmpurile sunt obligatorii pentru accesul early access.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                {success && (
                                    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Mulțumim! Cererea ta a fost trimisă. Revenim cu detalii pe email.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email companie</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="company@example.com"
                                                value={formData.email}
                                                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactName">Persoană de contact</Label>
                                        <div className="relative">
                                            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="contactName"
                                                placeholder="Nume și prenume"
                                                value={formData.contactName}
                                                onChange={(event) => setFormData({ ...formData, contactName: event.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Companie</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="companyName"
                                                placeholder="Numele companiei"
                                                value={formData.companyName}
                                                onChange={(event) => setFormData({ ...formData, companyName: event.target.value })}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hiringNeeds">Nevoi de recrutare</Label>
                                        <Textarea
                                            id="hiringNeeds"
                                            placeholder="Ex: dezvoltare web, UI/UX, QA automation"
                                            value={formData.hiringNeeds}
                                            onChange={(event) => setFormData({ ...formData, hiringNeeds: event.target.value })}
                                            className="min-h-[120px]"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="budget">Buget tipic proiect (€)</Label>
                                            <div className="relative">
                                                <ClipboardList className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="budget"
                                                    type="number"
                                                    min={0}
                                                    placeholder="3500"
                                                    value={formData.typicalProjectBudget}
                                                    onChange={(event) =>
                                                        setFormData({ ...formData, typicalProjectBudget: event.target.value })
                                                    }
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="hireFrequency">Frecvență recrutare</Label>
                                            <Select
                                                value={formData.hireFrequency}
                                                onValueChange={(value) => setFormData({ ...formData, hireFrequency: value })}
                                            >
                                                <SelectTrigger id="hireFrequency">
                                                    <SelectValue placeholder="Alege frecvența" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {hireFrequencyOptions.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Checkbox
                                                id="lostMoney"
                                                checked={formData.lostMoney}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, lostMoney: checked as boolean })
                                                }
                                            />
                                            <Label htmlFor="lostMoney" className="text-sm text-slate-600 dark:text-slate-300">
                                                Am avut proiecte în care am pierdut bani sau timp din cauza livrării slabe.
                                            </Label>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Checkbox
                                                id="escrowHelp"
                                                checked={formData.escrowHelp}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, escrowHelp: checked as boolean })
                                                }
                                            />
                                            <Label htmlFor="escrowHelp" className="text-sm text-slate-600 dark:text-slate-300">
                                                Vreau să folosesc escrow pentru plăți sigure.
                                            </Label>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full btn-primary text-white" disabled={isSubmitting}>
                                        {isSubmitting ? "Trimitem aplicația..." : "Trimite aplicația"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
