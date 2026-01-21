import { Locale } from "@/types/locale";
import { getTranslations } from "next-intl/server";
export async function TrustoraHeroSection({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: "trustora" });
    const badgeText = t("hero.badge");
    const title = t("hero.title");
    const titleHighlight = t("hero.title_highlight");
    const subtitle = t("hero.subtitle");
    const primaryCta = t("hero.primary_cta");
    const secondaryCta = t("hero.secondary_cta");
    const trustedLabel = t("hero.trusted_label");
    const dashboardLabel = t("hero.dashboard_label");
    const securedLabel = t("hero.secured_label");
    const contractName = t("hero.contract_name");
    const contractValue = t("hero.contract_value");
    const milestoneProgress = t("hero.milestone_progress");
    const milestoneEta = t("hero.milestone_eta");
    const nextMilestoneLabel = t("hero.next_milestone");
    const payoutLabel = t("hero.payout_label");
    const payoutValue = t("hero.payout_value");

    return (
        <section className="relative overflow-hidden pt-8 pb-20 px-6 bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#F5F7FA]/85 via-[#F5F7FA]/65 to-white dark:from-[#0B1C2D]/70 dark:via-[#0B1C2D]/60 dark:to-[#070C14]/90" />
            </div>
            <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-700 text-xs font-bold mb-6 dark:text-emerald-200">
                        <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        {badgeText}
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-bold text-[#0F172A] leading-[1.1] mb-6 dark:text-white">
                        {title} <span className="text-[#1BC47D]">{titleHighlight}</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed dark:text-slate-200">{subtitle}</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button className="px-8 py-4 btn-primary text-white font-semibold rounded-xl text-lg shadow-lg shadow-emerald-200/50">
                            {primaryCta}
                        </button>
                        <button className="px-8 py-4 bg-transparent border border-[#0B1C2D]/30 text-[#0B1C2D] font-semibold rounded-xl text-lg hover:bg-[#0B1C2D]/5 dark:border-[#1BC47D] dark:text-[#1BC47D] dark:hover:bg-[#1BC47D]/10">
                            {secondaryCta}
                        </button>
                    </div>
                    <div className="mt-10 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-300">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-[#F5F7FA] bg-slate-200 dark:border-[#0B1C2D]" />
                            <div className="w-8 h-8 rounded-full border-2 border-[#F5F7FA] bg-slate-300 dark:border-[#0B1C2D]" />
                            <div className="w-8 h-8 rounded-full border-2 border-[#F5F7FA] bg-slate-400 dark:border-[#0B1C2D]" />
                        </div>
                        <span>{trustedLabel}</span>
                    </div>
                </div>

                <div className="relative">
                    <div className="glass-card rounded-2xl p-6 relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-bold mono uppercase tracking-wider text-slate-500 dark:text-slate-400">{dashboardLabel}</span>
                            <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold dark:bg-[#1BC47D]/15 dark:text-[#1BC47D]">
                                {securedLabel}
                            </span>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white border border-slate-200 dark:bg-[#111B2D] dark:border-[#1E2A3D]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{contractName}</span>
                                    <span className="mono text-sm font-bold text-slate-800 dark:text-slate-100">{contractValue}</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden dark:bg-[#1E2A3D]">
                                    <div className="bg-[#1BC47D] w-3/4 h-full" />
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-medium dark:text-slate-400">
                                    <span>{milestoneProgress}</span>
                                    <span>{milestoneEta}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 p-3 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 italic text-xs dark:border-[#1E2A3D] dark:text-[#6B7285]">
                                    <span>{nextMilestoneLabel}</span>
                                </div>
                                <div className="w-24 p-3 rounded-xl bg-[#0B1C2D] text-white flex flex-col items-center justify-center dark:bg-[#0B1220] dark:border dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
                                    <span className="text-[10px] opacity-70">{payoutLabel}</span>
                                    <span className="font-bold">{payoutValue}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-0 dark:bg-[#1BC47D]/20" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-0 dark:bg-[#0B1C2D]/60" />
                </div>
            </div>
        </section>
    );
}
