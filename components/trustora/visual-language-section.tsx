import { t } from "@/lib/i18n";
import { Locale } from "@/types/locale";

export async function TrustoraVisualLanguageSection({ locale }: { locale: Locale }) {
    const [
        title,
        moneyLabel,
        moneySub,
        contractsLabel,
        contractsSub,
        verificationLabel,
        verificationSub,
    ] = await Promise.all([
        t(locale, "homepage.trustora.visual.title"),
        t(locale, "homepage.trustora.visual.money_label"),
        t(locale, "homepage.trustora.visual.money_subtitle"),
        t(locale, "homepage.trustora.visual.contracts_label"),
        t(locale, "homepage.trustora.visual.contracts_subtitle"),
        t(locale, "homepage.trustora.visual.verification_label"),
        t(locale, "homepage.trustora.visual.verification_subtitle"),
    ]);

    return (
        <section className="py-24 px-6 bg-white overflow-hidden dark:bg-[#070C14]">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-16 text-[#0B1C2D] dark:text-[#E6EDF3]">{title}</h2>
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20">
                    <div className="w-48 h-48 glass-card flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 dark:bg-[#111B2D]">💰</div>
                        <span className="text-xs font-bold uppercase tracking-wider dark:text-[#E6EDF3]">{moneyLabel}</span>
                        <span className="text-[10px] text-slate-400 dark:text-[#6B7285]">{moneySub}</span>
                    </div>
                    <div className="hidden md:block w-20 h-px bg-slate-200 dark:bg-[#1E2A3D]" />
                    <div className="w-48 h-48 glass-card border-2 border-[#1BC47D] flex flex-col items-center justify-center p-6 text-center shadow-lg shadow-emerald-100">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4 dark:bg-[rgba(27,196,125,0.1)]">📑</div>
                        <span className="text-xs font-bold uppercase tracking-wider dark:text-[#E6EDF3]">{contractsLabel}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-[#1BC47D]">{contractsSub}</span>
                    </div>
                    <div className="hidden md:block w-20 h-px bg-slate-200 dark:bg-[#1E2A3D]" />
                    <div className="w-48 h-48 glass-card flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 dark:bg-[#111B2D]">👤</div>
                        <span className="text-xs font-bold uppercase tracking-wider dark:text-[#E6EDF3]">{verificationLabel}</span>
                        <span className="text-[10px] text-slate-400 dark:text-[#6B7285]">{verificationSub}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
