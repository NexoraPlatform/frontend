import { Locale } from "@/types/locale";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";

export async function TrustoraFinalCtaSection({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: "trustora" });
    const title = t("final_cta.title");
    const subtitle = t("final_cta.subtitle");
    const clientCtaLabel = t("final_cta.client_cta_label");
    const providerCtaLabel = t("final_cta.provider_cta_label");
    const note = t("final_cta.note");
    const escrowLabel = t("final_cta.escrow_label");
    const verifiedLabel = t("final_cta.verified_label");
    const legalLabel = t("final_cta.legal_label");

    return (
        <section className="py-32 px-6 bg-[#0B1C2D] text-white text-center dark:bg-[#0B1220]">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl lg:text-5xl font-bold mb-8">{title}</h2>
                <p className="text-slate-400 mb-12 text-lg dark:text-[#A3ADC2]">{subtitle}</p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Link
                        href="/early-access/client"
                        className="inline-flex items-center justify-center rounded-xl bg-[#1BC47D] px-8 py-4 text-lg font-semibold text-[#071A12] shadow-lg shadow-emerald-500/25 transition-colors hover:bg-[#17b672]"
                    >
                        {clientCtaLabel}
                    </Link>
                    <Link
                        href="/early-access/provider"
                        className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition-colors hover:border-[#1BC47D]/70 hover:bg-[#1BC47D]/10"
                    >
                        {providerCtaLabel}
                    </Link>
                </div>
                <p className="mt-4 text-sm text-slate-400 dark:text-[#A3ADC2]">{note}</p>
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-40 grayscale dark:border-[#1E2A3D]">
                    <span className="font-bold mono uppercase tracking-widest text-sm">{escrowLabel}</span>
                    <span className="font-bold mono uppercase tracking-widest text-sm">{verifiedLabel}</span>
                    <span className="font-bold mono uppercase tracking-widest text-sm">{legalLabel}</span>
                </div>
            </div>
        </section>
    );
}
