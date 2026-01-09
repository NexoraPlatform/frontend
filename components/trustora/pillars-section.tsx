import { t } from "@/lib/i18n";
import { Locale } from "@/types/locale";

export async function TrustoraPillarsSection({ locale }: { locale: Locale }) {
    const [
        verifiedTitle,
        verifiedDescription,
        protectedTitle,
        protectedDescription,
        deliveryTitle,
        deliveryDescription,
        legalTitle,
        legalDescription,
    ] = await Promise.all([
        t(locale, "homepage.trustora.pillars.verified_title"),
        t(locale, "homepage.trustora.pillars.verified_description"),
        t(locale, "homepage.trustora.pillars.protected_title"),
        t(locale, "homepage.trustora.pillars.protected_description"),
        t(locale, "homepage.trustora.pillars.delivery_title"),
        t(locale, "homepage.trustora.pillars.delivery_description"),
        t(locale, "homepage.trustora.pillars.legal_title"),
        t(locale, "homepage.trustora.pillars.legal_description"),
    ]);

    return (
        <section className="py-24 px-6 bg-[#F5F7FA] dark:bg-[#0B1220]" id="pillars">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <svg className="w-6 h-6 pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#0B1C2D] dark:text-[#E6EDF3]">{verifiedTitle}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed dark:text-[#A3ADC2]">
                            {verifiedDescription}
                        </p>
                    </div>
                    <div className="space-y-4">
                        <svg className="w-6 h-6 pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#0B1C2D] dark:text-[#E6EDF3]">{protectedTitle}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed dark:text-[#A3ADC2]">
                            {protectedDescription}
                        </p>
                    </div>
                    <div className="space-y-4">
                        <svg className="w-6 h-6 pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#0B1C2D] dark:text-[#E6EDF3]">{deliveryTitle}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed dark:text-[#A3ADC2]">
                            {deliveryDescription}
                        </p>
                    </div>
                    <div className="space-y-4">
                        <svg className="w-6 h-6 pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#0B1C2D] dark:text-[#E6EDF3]">{legalTitle}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed dark:text-[#A3ADC2]">
                            {legalDescription}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
