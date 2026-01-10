import { Button } from "@/components/ui/button";
import { TrustFlowNetworkLayer } from "@/components/hero/TrustFlowNetworkLayer";
import { t } from "@/lib/i18n";
import { Locale } from "@/types/locale";

export async function TrustoraHeroSection({ locale }: { locale: Locale }) {
    const [
        badgeText,
        title,
        titleHighlight,
        subtitle,
        primaryCta,
        secondaryCta,
        trustedLabel,
        dashboardLabel,
        securedLabel,
        contractName,
        contractValue,
        milestoneProgress,
        milestoneEta,
        nextMilestoneLabel,
        payoutLabel,
        payoutValue,
    ] = await Promise.all([
        t(locale, "trustora.hero.badge"),
        t(locale, "trustora.hero.title"),
        t(locale, "trustora.hero.title_highlight"),
        t(locale, "trustora.hero.subtitle"),
        t(locale, "trustora.hero.primary_cta"),
        t(locale, "trustora.hero.secondary_cta"),
        t(locale, "trustora.hero.trusted_label"),
        t(locale, "trustora.hero.dashboard_label"),
        t(locale, "trustora.hero.secured_label"),
        t(locale, "trustora.hero.contract_name"),
        t(locale, "trustora.hero.contract_value"),
        t(locale, "trustora.hero.milestone_progress"),
        t(locale, "trustora.hero.milestone_eta"),
        t(locale, "trustora.hero.next_milestone"),
        t(locale, "trustora.hero.payout_label"),
        t(locale, "trustora.hero.payout_value"),
    ]);

    return (
        <section className="relative min-h-screen overflow-hidden bg-[#0B1C2D] text-white">
            <TrustFlowNetworkLayer />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B1C2D]/50 to-[#0B1C2D] pointer-events-none" />
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 text-xs font-bold mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                            </span>
                            {badgeText}
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                            <span className="block text-white mb-4">{title}</span>
                            <span className="block bg-gradient-to-r from-[#1BC47D] via-[#2DD88F] to-[#1BC47D] bg-clip-text text-transparent">
                                {titleHighlight}
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed mt-6">{subtitle}</p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-8">
                            <Button
                                size="lg"
                                className="bg-[#1BC47D] hover:bg-[#16A368] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg shadow-[#1BC47D]/20 transition-all hover:shadow-xl hover:shadow-[#1BC47D]/30 hover:scale-105"
                            >
                                {primaryCta}
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30 px-8 py-6 text-lg font-semibold rounded-lg backdrop-blur-sm transition-all"
                            >
                                {secondaryCta}
                            </Button>
                        </div>
                        <div className="mt-10 flex items-center gap-4 text-sm text-gray-300">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full border-2 border-[#0B1C2D] bg-slate-700" />
                                <div className="w-8 h-8 rounded-full border-2 border-[#0B1C2D] bg-slate-600" />
                                <div className="w-8 h-8 rounded-full border-2 border-[#0B1C2D] bg-slate-500" />
                            </div>
                            <span>{trustedLabel}</span>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="glass-card rounded-2xl p-6 relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-bold mono uppercase tracking-wider text-slate-300">
                                    {dashboardLabel}
                                </span>
                                <span className="px-2 py-1 rounded-md bg-emerald-100/10 text-emerald-200 text-[10px] font-bold">
                                    {securedLabel}
                                </span>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-[#111B2D] border border-[#1E2A3D]">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-slate-100">{contractName}</span>
                                        <span className="mono text-sm font-bold text-slate-100">{contractValue}</span>
                                    </div>
                                    <div className="w-full bg-[#1E2A3D] h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-[#1BC47D] w-3/4 h-full" />
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                                        <span>{milestoneProgress}</span>
                                        <span>{milestoneEta}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1 p-3 rounded-xl border border-dashed border-[#1E2A3D] flex flex-col items-center justify-center text-slate-400 italic text-xs">
                                        <span>{nextMilestoneLabel}</span>
                                    </div>
                                    <div className="w-24 p-3 rounded-xl bg-[#0B1220] text-white flex flex-col items-center justify-center border border-[#1E2A3D]">
                                        <span className="text-[10px] opacity-70">{payoutLabel}</span>
                                        <span className="font-bold">{payoutValue}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl opacity-50 -z-0" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl opacity-50 -z-0" />
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1C2D] to-transparent pointer-events-none" />
        </section>
    );
}
