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

                    <Card className="group relative overflow-hidden border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_80px_-32px_rgba(16,185,129,0.65)] dark:border-emerald-500/20 dark:from-[#0B1220] dark:via-[#0F172A] dark:to-emerald-500/10">
                        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl transition-transform duration-500 group-hover:scale-110 dark:bg-emerald-400/10" />
                        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl transition-transform duration-500 group-hover:scale-110 dark:bg-emerald-300/10" />
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <CardHeader className="relative z-10 grid gap-8 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-10">
                            <div className="space-y-5">
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/80 px-4 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    Povestea Trustora
                                </div>
                                <CardTitle className="text-3xl font-semibold text-[#0F172A] dark:text-white">
                                    Încredere reală între clienți și prestatori, cu plăți sigure și proiecte transparente
                                </CardTitle>
                                <CardDescription className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                                    Am pornit Trustora pentru a elimina riscurile din colaborări: proiecte bine definite, escrow pentru
                                    plăți și recomandări bazate pe scor real. Early access înseamnă acces prioritar la primele proiecte,
                                    feedback direct către echipă și influență asupra funcțiilor care contează pentru tine.
                                </CardDescription>
                                <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 dark:border-emerald-500/10 dark:bg-white/5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">
                                            Beneficiu
                                        </p>
                                        <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">Acces prioritar</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Vezi primele proiecte și primești invitații înaintea publicului larg.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 dark:border-emerald-500/10 dark:bg-white/5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">
                                            Comunitate
                                        </p>
                                        <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">Selectă & activă</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Influențezi roadmap-ul și primești sprijin direct de la echipă.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-emerald-200/60 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1 dark:border-emerald-500/20 dark:bg-white/5">
                                <div className="space-y-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-200">
                                        Ce primești
                                    </p>
                                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                                            Proiecte mai clare, cu briefuri validate
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                                            Plăți protejate prin escrow
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                                            Matching rapid cu scoruri reale
                                        </li>
                                    </ul>
                                </div>
                                <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-4 text-sm text-emerald-900 shadow-inner dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                                    <p className="font-semibold">Sună bine?</p>
                                    <p className="mt-1 text-xs">
                                        Intră în early access și primești acces înainte de lansarea oficială.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </div>

            <Footer />
        </div>
    );
}
