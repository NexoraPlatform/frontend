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
        <section className="pt-40 pb-20 px-6 hero-gradient">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        {badgeText}
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-bold text-[#0B1C2D] leading-[1.1] mb-6">
                        {title} <span className="text-[#1BC47D]">{titleHighlight}</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">{subtitle}</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button className="px-8 py-4 btn-primary text-white font-semibold rounded-xl text-lg shadow-lg shadow-emerald-200/50">
                            {primaryCta}
                        </button>
                        <button className="px-8 py-4 bg-white border border-slate-200 text-[#0B1C2D] font-semibold rounded-xl text-lg hover:bg-slate-50">
                            {secondaryCta}
                        </button>
                    </div>
                    <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300" />
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400" />
                        </div>
                        <span>{trustedLabel}</span>
                    </div>
                </div>

                <div className="relative">
                    <div className="glass-card rounded-2xl p-6 relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-bold mono uppercase tracking-wider text-slate-400">{dashboardLabel}</span>
                            <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                {securedLabel}
                            </span>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold">{contractName}</span>
                                    <span className="mono text-sm font-bold">{contractValue}</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[#1BC47D] w-3/4 h-full" />
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                                    <span>{milestoneProgress}</span>
                                    <span>{milestoneEta}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 p-3 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 italic text-xs">
                                    <span>{nextMilestoneLabel}</span>
                                </div>
                                <div className="w-24 p-3 rounded-xl bg-[#0B1C2D] text-white flex flex-col items-center justify-center">
                                    <span className="text-[10px] opacity-70">{payoutLabel}</span>
                                    <span className="font-bold">{payoutValue}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-0" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 -z-0" />
                </div>
            </div>
        </section>
    );
}
