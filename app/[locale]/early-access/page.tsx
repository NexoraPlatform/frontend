"use client";

import { Briefcase, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LocalizedLink } from "@/components/LocalizedLink";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";

export default function EarlyAccessPage() {
    return (
        <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />

            <div className="relative mt-8 overflow-hidden">
                <div className="absolute inset-0 hero-gradient" />
                <div className="relative container mx-auto px-4 py-16">
                    <div className="mx-auto max-w-3xl space-y-8 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-100/60 px-4 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            Înscrieri early access
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                                Alege tipul de cont <span className="text-[#1BC47D]">Trustora</span>
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-300">
                                Înscrierile sunt pentru early access: în curând vom lansa early beta, iar cei înscriși vor primi
                                primii invitațiile. Dacă ești client, te ajutăm să găsești prestatori verificați. Dacă ești
                                prestator, îți pregătim profilul pentru proiecte plătite în siguranță.
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 mb-12 grid gap-6 lg:grid-cols-2">
                        <Card className="glass-card flex h-full flex-col border border-slate-200/60 bg-white/90 pb-6 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
                            <CardHeader className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    <UserRound className="h-6 w-6" />
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-2xl">Sunt client</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                                        Completează datele despre companie și nevoile de recrutare. Vei primi acces la prestatori cu
                                        scor ridicat.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <div className="mt-auto px-6">
                                <Button asChild className="w-full btn-primary text-white">
                                    <LocalizedLink href="/early-access/client">Încep formularul pentru client</LocalizedLink>
                                </Button>
                            </div>
                        </Card>

                        <Card className="glass-card flex h-full flex-col border border-slate-200/60 bg-white/90 pb-6 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
                            <CardHeader className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-2xl">Sunt prestator</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                                        Spune-ne experiența ta și setările preferate. Îți pregătim profilul pentru proiecte sigure.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <div className="mt-auto px-6">
                                <Button asChild className="w-full btn-primary text-white">
                                    <LocalizedLink href="/early-access/provider">Încep formularul pentru prestator</LocalizedLink>
                                </Button>
                            </div>
                        </Card>
                    </div>

                    <Card className="group relative overflow-hidden border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(16,185,129,0.6)] dark:border-emerald-500/20 dark:from-[#0B1220] dark:via-[#0F172A] dark:to-emerald-500/10">
                        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl transition-transform duration-500 group-hover:scale-110 dark:bg-emerald-400/10" />
                        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl transition-transform duration-500 group-hover:scale-110 dark:bg-emerald-300/10" />
                        <CardHeader className="relative z-10 space-y-4 p-8 md:p-10">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/80 px-4 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                Povestea Trustora
                            </div>
                            <CardTitle className="text-3xl font-semibold text-[#0F172A] dark:text-white">
                                De ce construim Trustora și cum te ajută în early access
                            </CardTitle>
                            <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                                Am pornit Trustora pentru a aduce încredere în colaborările dintre clienți și prestatori: proiecte
                                clare, plăți sigure și recomandări bazate pe scor real. Early access înseamnă acces prioritar la primele
                                proiecte, feedback direct către echipă și influență asupra funcțiilor care contează pentru tine.
                            </CardDescription>
                            <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300 md:flex-row md:items-center md:gap-6">
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100/70 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    ✔ Acces prioritar
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100/70 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    ✔ Feedback direct
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100/70 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    ✔ Comunitate selectă
                                </span>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </div>

            <Footer />
        </div>
    );
}
