import { t } from "@/lib/i18n";
import { Locale } from "@/types/locale";

export async function TrustoraMessagingSection({ locale }: { locale: Locale }) {
    const [
        clientsBadge,
        clientsTitle,
        clientsBody,
        clientsBenefitOne,
        clientsBenefitTwo,
        clientsLink,
        prosBadge,
        prosTitle,
        prosBody,
        prosBenefitOne,
        prosBenefitTwo,
        prosLink,
    ] = await Promise.all([
        t(locale, "trustora.messaging.clients_badge"),
        t(locale, "trustora.messaging.clients_title"),
        t(locale, "trustora.messaging.clients_body"),
        t(locale, "trustora.messaging.clients_benefit_one"),
        t(locale, "trustora.messaging.clients_benefit_two"),
        t(locale, "trustora.messaging.clients_link"),
        t(locale, "trustora.messaging.pros_badge"),
        t(locale, "trustora.messaging.pros_title"),
        t(locale, "trustora.messaging.pros_body"),
        t(locale, "trustora.messaging.pros_benefit_one"),
        t(locale, "trustora.messaging.pros_benefit_two"),
        t(locale, "trustora.messaging.pros_link"),
    ]);

    return (
        <section className="py-24 px-6 bg-white dark:bg-[#070C14]" id="how">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden shadow-xl dark:bg-[#1E2A3D] dark:border-[#1E2A3D]">
                    <div className="bg-white p-12 lg:p-20 dark:bg-[#0B1220]">
                        <span className="text-[10px] font-bold text-[#0B1C2D] bg-slate-100 px-2 py-1 rounded mb-6 inline-block dark:text-[#E6EDF3] dark:bg-[#111B2D]">
                            {clientsBadge}
                        </span>
                        <h2 className="text-4xl font-bold text-[#0B1C2D] mb-6 dark:text-[#E6EDF3]">{clientsTitle}</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed dark:text-[#A3ADC2]">
                            {clientsBody}
                        </p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-sm font-medium dark:text-[#E6EDF3]">
                                <span className="text-[#1BC47D]">✅</span> {clientsBenefitOne}
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium dark:text-[#E6EDF3]">
                                <span className="text-[#1BC47D]">✅</span> {clientsBenefitTwo}
                            </li>
                        </ul>
                        <a href="#" className="font-bold text-[#0B1C2D] border-b-2 border-[#1BC47D] pb-1 dark:text-[#E6EDF3]">
                            {clientsLink}
                        </a>
                    </div>
                    <div className="bg-[#0B1C2D] p-12 lg:p-20 text-white dark:bg-[#0B1220]">
                        <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded mb-6 inline-block dark:bg-[#111B2D]">
                            {prosBadge}
                        </span>
                        <h2 className="text-4xl font-bold mb-6">{prosTitle}</h2>
                        <p className="text-slate-300 mb-8 leading-relaxed dark:text-[#A3ADC2]">
                            {prosBody}
                        </p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="text-[#1BC47D]">✅</span> {prosBenefitOne}
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="text-[#1BC47D]">✅</span> {prosBenefitTwo}
                            </li>
                        </ul>
                        <a href="#" className="font-bold text-white border-b-2 border-[#1BC47D] pb-1">
                            {prosLink}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
