import { Locale } from "@/types/locale";
import { getTranslations } from "next-intl/server";

export async function TrustoraFinalCtaSection({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale });
    const title = t("trustora.final_cta.title");
    const subtitle = t("trustora.final_cta.subtitle");
    const ctaLabel = t("trustora.final_cta.cta_label");
    const escrowLabel = t("trustora.final_cta.escrow_label");
    const verifiedLabel = t("trustora.final_cta.verified_label");
    const legalLabel = t("trustora.final_cta.legal_label");

    return (
        <section className="py-32 px-6 bg-[#0B1C2D] text-white text-center dark:bg-[#0B1220]">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl lg:text-5xl font-bold mb-8">{title}</h2>
                <p className="text-slate-400 mb-12 text-lg dark:text-[#A3ADC2]">{subtitle}</p>
                <button className="px-10 py-5 btn-primary font-bold rounded-lg text-xl">{ctaLabel}</button>
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-40 grayscale dark:border-[#1E2A3D]">
                    <span className="font-bold mono uppercase tracking-widest text-sm">{escrowLabel}</span>
                    <span className="font-bold mono uppercase tracking-widest text-sm">{verifiedLabel}</span>
                    <span className="font-bold mono uppercase tracking-widest text-sm">{legalLabel}</span>
                </div>
            </div>
        </section>
    );
}
