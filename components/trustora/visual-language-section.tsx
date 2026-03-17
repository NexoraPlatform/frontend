import { Locale } from "@/types/locale";
import { getTranslations } from "next-intl/server";

export async function TrustoraVisualLanguageSection({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: "trustora" });
    const badge = t("visual.badge");
    const title = t("visual.title");
    const subtitle = t("visual.subtitle");
    const stepOneLabel = t("visual.step_one.label");
    const stepOneTitle = t("visual.step_one.title");
    const stepOneBody = t("visual.step_one.body");
    const stepTwoLabel = t("visual.step_two.label");
    const stepTwoTitle = t("visual.step_two.title");
    const stepTwoBody = t("visual.step_two.body");
    const stepThreeLabel = t("visual.step_three.label");
    const stepThreeTitle = t("visual.step_three.title");
    const stepThreeBody = t("visual.step_three.body");
    const contractBadge = t("visual.contract.badge");
    const contractTitle = t("visual.contract.title");
    const partiesLabel = t("visual.contract.parties_label");
    const partiesValue = t("visual.contract.parties_value");
    const escrowLabel = t("visual.contract.escrow_label");
    const escrowValue = t("visual.contract.escrow_value");
    const proofLabel = t("visual.contract.proof_label");
    const proofValue = t("visual.contract.proof_value");
    const milestoneLabel = t("visual.contract.milestone_label");
    const amountLabel = t("visual.contract.amount_label");
    const statusLabel = t("visual.contract.status_label");
    const milestoneOneTitle = t("visual.contract.milestone_one.title");
    const milestoneOneAmount = t("visual.contract.milestone_one.amount");
    const milestoneOneStatus = t("visual.contract.milestone_one.status");
    const milestoneTwoTitle = t("visual.contract.milestone_two.title");
    const milestoneTwoAmount = t("visual.contract.milestone_two.amount");
    const milestoneTwoStatus = t("visual.contract.milestone_two.status");
    const milestoneThreeTitle = t("visual.contract.milestone_three.title");
    const milestoneThreeAmount = t("visual.contract.milestone_three.amount");
    const milestoneThreeStatus = t("visual.contract.milestone_three.status");
    const footer = t("visual.contract.footer");

    const steps = [
        { label: stepOneLabel, title: stepOneTitle, body: stepOneBody },
        { label: stepTwoLabel, title: stepTwoTitle, body: stepTwoBody },
        { label: stepThreeLabel, title: stepThreeTitle, body: stepThreeBody },
    ];

    const milestones = [
        { title: milestoneOneTitle, amount: milestoneOneAmount, status: milestoneOneStatus, tone: "emerald" },
        { title: milestoneTwoTitle, amount: milestoneTwoAmount, status: milestoneTwoStatus, tone: "cyan" },
        { title: milestoneThreeTitle, amount: milestoneThreeAmount, status: milestoneThreeStatus, tone: "amber" },
    ] as const;

    return (
        <section className="overflow-hidden bg-[#08101F] px-6 py-24 text-white">
            <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#9BC0E5]">
                        {badge}
                    </span>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                        {title}
                    </h2>
                    <p className="mt-5 text-lg leading-8 text-slate-300">
                        {subtitle}
                    </p>
                </div>

                <div className="mt-14 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
                    <div className="space-y-4">
                        {steps.map((step, index) => (
                            <article
                                key={step.title}
                                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-[#1BC47D]">
                                        0{index + 1}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8FA9C7]">
                                            {step.label}
                                        </p>
                                        <h3 className="mt-2 text-xl font-semibold text-white">
                                            {step.title}
                                        </h3>
                                        <p className="mt-3 text-sm leading-7 text-slate-300">
                                            {step.body}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(27,196,125,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_34%)] blur-3xl" />
                        <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0B1220] shadow-[0_36px_120px_rgba(0,0,0,0.36)]">
                            <div className="border-b border-white/10 px-8 py-6">
                                <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                                    {contractBadge}
                                </span>
                                <h3 className="mt-4 text-2xl font-semibold text-white">
                                    {contractTitle}
                                </h3>
                            </div>

                            <div className="grid gap-4 border-b border-white/10 px-8 py-6 sm:grid-cols-3">
                                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7FA0C1]">
                                        {partiesLabel}
                                    </p>
                                    <p className="mt-3 text-sm font-medium text-slate-100">
                                        {partiesValue}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7FA0C1]">
                                        {escrowLabel}
                                    </p>
                                    <p className="mt-3 text-sm font-medium text-slate-100">
                                        {escrowValue}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7FA0C1]">
                                        {proofLabel}
                                    </p>
                                    <p className="mt-3 text-sm font-medium text-slate-100">
                                        {proofValue}
                                    </p>
                                </div>
                            </div>

                            <div className="px-8 py-6">
                                <div className="grid grid-cols-12 gap-3 border-b border-white/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7FA0C1]">
                                    <div className="col-span-6">{milestoneLabel}</div>
                                    <div className="col-span-3 text-right">{amountLabel}</div>
                                    <div className="col-span-3 text-right">{statusLabel}</div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {milestones.map((milestone) => (
                                        <div
                                            key={milestone.title}
                                            className="grid grid-cols-12 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                                        >
                                            <div className="col-span-6">
                                                <p className="text-sm font-medium text-white">{milestone.title}</p>
                                            </div>
                                            <div className="col-span-3 text-right text-sm font-medium text-slate-200">
                                                {milestone.amount}
                                            </div>
                                            <div className="col-span-3 flex justify-end">
                                                <span
                                                    className={[
                                                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                                        milestone.tone === "emerald"
                                                            ? "bg-emerald-500/15 text-emerald-200"
                                                            : milestone.tone === "cyan"
                                                              ? "bg-cyan-500/15 text-cyan-200"
                                                              : "bg-amber-500/15 text-amber-200",
                                                    ].join(" ")}
                                                >
                                                    {milestone.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/10 bg-white/[0.02] px-8 py-5 text-sm text-slate-300">
                                {footer}
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    );
}
