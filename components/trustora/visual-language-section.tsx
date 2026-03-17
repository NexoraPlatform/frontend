import { Locale } from "@/types/locale";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function TrustoraVisualLanguageSection({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: "trustora" });
    const title = t("visual.title");
    const moneyLabel = t("visual.money_label");
    const moneySub = t("visual.money_subtitle");
    const contractsLabel = t("visual.contracts_label");
    const contractsSub = t("visual.contracts_subtitle");
    const verificationLabel = t("visual.verification_label");
    const verificationSub = t("visual.verification_subtitle");

    return (
        <section className="py-24 px-6 bg-white overflow-hidden dark:bg-[#070C14]">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-16 text-[#0B1C2D] dark:text-[#E6EDF3]">{title}</h2>
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20">
                    <div className="w-48 h-48 glass-card flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 dark:bg-[#111B2D] dark:text-white">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <circle cx="12" cy="11" r="3" />
                                <path d="M12 7v1" />
                                <path d="M12 14v1" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider dark:text-[#E6EDF3]">{moneyLabel}</span>
                        <span className="text-[10px] text-slate-400 dark:text-[#6B7285]">{moneySub}</span>
                    </div>
                    <div className="hidden md:block w-20 h-px bg-slate-200 dark:bg-[#1E2A3D]" />
                    <div className="w-48 h-48 glass-card border-2 border-[#1BC47D] flex flex-col items-center justify-center p-6 text-center shadow-lg shadow-emerald-100">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4 dark:bg-[rgba(27,196,125,0.1)] dark:text-white">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-label="Smart Contract Icon"
                            >
                                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                <path d="M12 11l3 1.5v3l-3 1.5l-3-1.5v-3L12 11z" />
                                <path d="M10.5 14.5l1 1l2.5-2.5" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider dark:text-[#E6EDF3]">{contractsLabel}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-[#1BC47D]">{contractsSub}</span>
                    </div>
                    <div className="hidden md:block w-20 h-px bg-slate-200 dark:bg-[#1E2A3D]" />
                    <div className="w-48 h-48 glass-card flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 dark:bg-[#111B2D] dark:text-white">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-label="Biometric Identity Verification Icon"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="10" cy="7" r="4" />
                                <path d="M18 7h2a2 2 0 0 1 2 2v2" />
                                <path d="M22 13v2a2 2 0 0 1-2 2h-2" />
                                <path d="M14 11l2 2l4-4" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider dark:text-[#E6EDF3]">{verificationLabel}</span>
                        <span className="text-[10px] text-slate-400 dark:text-[#6B7285]">{verificationSub}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
