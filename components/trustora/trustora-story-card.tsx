"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    FileText,
    Globe,
    Layers,
    Lock,
    Scale,
    Shield,
} from "lucide-react";

export const TrustoraStoryCard = () => {
    const [activeStep, setActiveStep] = useState(0);
    const t = useTranslations();
    const manifestLabel = t("trustora.early_access.story.manifest_label");
    const headingLine = t("trustora.early_access.story.heading_line");
    const headingHighlight = t("trustora.early_access.story.heading_highlight");
    const activeLabel = t("trustora.early_access.story.active_label");
    const nextStepLabel = t("trustora.early_access.story.next_step");
    const joinNetworkLabel = t("trustora.early_access.story.join_network");
    const paymentFailedLabel = t("trustora.early_access.story.payment_failed");
    const riskLabel = t("trustora.early_access.story.risk_label");
    const complianceGapLabel = t("trustora.early_access.story.compliance_gap");
    const protocolInitLabel = t("trustora.early_access.story.protocol_init");
    const legalWrapperLabel = t("trustora.early_access.story.legal_wrapper");
    const smartContractLabel = t("trustora.early_access.story.smart_contract");
    const connectingNodesLabel = t("trustora.early_access.story.connecting_nodes");
    const escrowLabel = t("trustora.early_access.story.escrow");
    const activeProtectionLabel = t("trustora.early_access.story.active_protection");
    const fundsLabel = t("trustora.early_access.story.funds_label");
    const globalInfrastructureLabel = t("trustora.early_access.story.global_infrastructure");
    const verifiedLabel = t("trustora.early_access.story.verified");
    const securedLabel = t("trustora.early_access.story.secured");
    const systemStatusLabel = t("trustora.early_access.story.system_status_label");
    const statusCritical = t("trustora.early_access.story.status.critical");
    const statusInitializing = t("trustora.early_access.story.status.initializing");
    const statusSecured = t("trustora.early_access.story.status.secured");
    const statusOptimal = t("trustora.early_access.story.status.optimal");
    const stepChaosTitle = t("trustora.early_access.story.steps.chaos.title");
    const stepChaosSubtitle = t("trustora.early_access.story.steps.chaos.subtitle");
    const stepChaosDescription = t("trustora.early_access.story.steps.chaos.description");
    const stepInfrastructureTitle = t("trustora.early_access.story.steps.infrastructure.title");
    const stepInfrastructureSubtitle = t("trustora.early_access.story.steps.infrastructure.subtitle");
    const stepInfrastructureDescription = t("trustora.early_access.story.steps.infrastructure.description");
    const stepMechanismTitle = t("trustora.early_access.story.steps.mechanism.title");
    const stepMechanismSubtitle = t("trustora.early_access.story.steps.mechanism.subtitle");
    const stepMechanismDescription = t("trustora.early_access.story.steps.mechanism.description");
    const stepSuccessTitle = t("trustora.early_access.story.steps.success.title");
    const stepSuccessSubtitle = t("trustora.early_access.story.steps.success.subtitle");
    const stepSuccessDescription = t("trustora.early_access.story.steps.success.description");

    // Culorile brandului Trustora
    const colors = {
        primary: "#0B1C2D", // Midnight Blue
        accent: "#1BC47D", // Emerald Green
        error: "#E5484D",
        bg: "#F5F7FA",
    };

    // Povestea structurată în 4 acte conform documentației de brand
    const steps = [
        {
            id: 0,
            title: stepChaosTitle,
            subtitle: stepChaosSubtitle,
            description: stepChaosDescription,
            icon: <AlertTriangle size={24} color={colors.error} />,
            visualState: "risk",
        },
        {
            id: 1,
            title: stepInfrastructureTitle,
            subtitle: stepInfrastructureSubtitle,
            description: stepInfrastructureDescription,
            icon: <Layers size={24} color="#3B82F6" />,
            visualState: "infrastructure",
        },
        {
            id: 2,
            title: stepMechanismTitle,
            subtitle: stepMechanismSubtitle,
            description: stepMechanismDescription,
            icon: <Lock size={24} color={colors.accent} />,
            visualState: "mechanism",
        },
        {
            id: 3,
            title: stepSuccessTitle,
            subtitle: stepSuccessSubtitle,
            description: stepSuccessDescription,
            icon: <Globe size={24} color={colors.primary} />,
            visualState: "success",
        },
    ];

    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep(activeStep + 1);
        }
    };

    const handleStepClick = (index: number) => {
        setActiveStep(index);
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 font-sans">
            {/* Main Card Container */}
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl transition-all duration-500 ease-in-out dark:border-slate-800 dark:bg-slate-900 md:flex-row">
                {/* Left Side: Interactive Story Navigation */}
                <div className="relative z-20 flex w-full flex-col justify-between bg-white p-8 dark:bg-slate-900 md:w-1/2 md:p-10">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0B1C2D]">
                                <div className="h-2.5 w-2.5 border-r-2 border-t-2 border-[#1BC47D]"></div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                {manifestLabel}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold leading-tight text-[#0B1C2D] dark:text-white">
                            {headingLine} <br />
                            <span style={{ color: colors.accent }}>{headingHighlight}</span>
                        </h2>
                    </div>

                    {/* Timeline Steps */}
                    <div className="relative z-10 flex-grow space-y-3">
                        {/* Connecting Line */}
                        <div className="absolute bottom-6 left-[27px] top-6 -z-10 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                onClick={() => handleStepClick(index)}
                                className={`group cursor-pointer rounded-xl border border-transparent p-3 transition-all duration-300 ${
                                    activeStep === index
                                        ? "translate-x-2 border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
                                        : "hover:border-slate-100 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 bg-white transition-all duration-300 ${
                                            activeStep === index
                                                ? "scale-110 border-[#1BC47D] dark:bg-slate-900"
                                                : "border-slate-200 grayscale dark:border-slate-700 dark:bg-slate-900"
                                        }`}
                                    >
                                        <div className="scale-75 transform">{step.icon}</div>
                                    </div>

                                    <div className="flex-grow">
                                        <div className="mb-1 flex items-center justify-between">
                                            <h3
                                                className={`text-sm font-bold ${
                                                    activeStep === index
                                                        ? "text-[#0B1C2D] dark:text-white"
                                                        : "text-slate-500 dark:text-slate-400"
                                                }`}
                                            >
                                                {step.title}
                                            </h3>
                                            {activeStep === index && (
                                                <span className="rounded-full bg-[#1BC47D]/10 px-2 py-0.5 text-[10px] font-bold text-[#1BC47D] dark:bg-[#1BC47D]/20">
                                                    {activeLabel}
                                                </span>
                                            )}
                                        </div>

                                        <p
                                            className={`text-xs font-semibold uppercase tracking-wide transition-colors ${
                                                activeStep === index
                                                    ? "text-slate-800 dark:text-slate-200"
                                                    : "text-slate-400 dark:text-slate-500"
                                            }`}
                                        >
                                            {step.subtitle}
                                        </p>

                                        {/* Expandable Description */}
                                        <div
                                            className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                                activeStep === index
                                                    ? "mt-2 max-h-40 opacity-100"
                                                    : "max-h-0 opacity-0"
                                            }`}
                                        >
                                            <p className="border-l-2 border-[#1BC47D]/30 pl-3 text-sm leading-relaxed text-slate-600 dark:border-[#1BC47D]/50 dark:text-slate-300">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Action Area */}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div className="flex gap-1.5">
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`h-1 rounded-full transition-all duration-500 ${
                                        activeStep === step.id
                                            ? "w-6 bg-[#1BC47D]"
                                            : "w-2 bg-slate-200 dark:bg-slate-700"
                                    }`}
                                />
                            ))}
                        </div>

                        {activeStep < steps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="group flex items-center gap-2 rounded px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0B1C2D] transition-colors hover:bg-slate-50 hover:text-[#1BC47D] dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                                {nextStepLabel}{" "}
                                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </button>
                        ) : (
                            <a
                                href="#early-access-client"
                                className="flex items-center gap-2 rounded-lg bg-[#0B1C2D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#0B1C2D]/20 transition-colors hover:bg-[#152a3d] dark:bg-slate-950 dark:hover:bg-slate-800"
                            >
                                {joinNetworkLabel} <ArrowRight size={14} />
                            </a>
                        )}
                    </div>
                </div>

                {/* Right Side: The Visual System (Animated) */}
                <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden bg-[#0B1C2D] p-8 md:w-1/2">
                    {/* Background Grid - Digital Infrastructure Feel */}
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage:
                                "linear-gradient(#1BC47D 0.5px, transparent 0.5px), linear-gradient(90deg, #1BC47D 0.5px, transparent 0.5px)",
                            backgroundSize: "40px 40px",
                            maskImage: "radial-gradient(circle at center, black, transparent 80%)",
                        }}
                    ></div>

                    {/* Dynamic Visual Content */}
                    <div className="relative z-10 flex aspect-square w-full max-w-xs flex-col items-center justify-center">
                        {/* STATE 0: HAOS / RISK */}
                        <div
                            className={`absolute flex w-full justify-center transition-all duration-700 ${
                                activeStep === 0
                                    ? "scale-100 opacity-100 blur-0"
                                    : "pointer-events-none scale-90 opacity-0 blur-sm"
                            }`}
                        >
                            <div className="relative h-64 w-64">
                                {/* Floating "Broken" Documents */}
                                <div className="absolute left-4 top-10 w-40 rotate-[-6deg] rounded border border-red-500/30 bg-white/5 p-3 animate-pulse">
                                    <div className="mb-2 h-2 w-12 rounded bg-red-500/40"></div>
                                    <div className="h-1 w-full rounded bg-slate-600 opacity-20"></div>
                                    <div className="mt-1 h-1 w-2/3 rounded bg-slate-600 opacity-20"></div>
                                    <div className="absolute -right-2 -top-2 text-red-500">
                                        <AlertTriangle size={20} />
                                    </div>
                                </div>
                                <div className="absolute bottom-12 right-0 w-32 rotate-[12deg] rounded border border-red-500/30 bg-white/5 p-3 delay-300 animate-pulse">
                                    <div className="text-[10px] font-mono text-red-400">{paymentFailedLabel}</div>
                                </div>
                                {/* Center Warning */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-center">
                                    <div className="select-none text-4xl font-bold tracking-tighter text-white opacity-20">
                                        {riskLabel}
                                    </div>
                                    <div className="mt-1 rounded border border-red-500/50 bg-red-900/20 px-2 py-1 text-xs font-mono uppercase tracking-widest text-red-400">
                                        {complianceGapLabel}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STATE 1: INFRASTRUCTURE / BLUEPRINT */}
                        <div
                            className={`absolute flex w-full justify-center transition-all duration-700 ${
                                activeStep === 1
                                    ? "scale-100 opacity-100 blur-0"
                                    : "pointer-events-none scale-90 opacity-0 blur-sm"
                            }`}
                        >
                            <div className="w-72 rounded-xl border border-blue-500/40 bg-[#0F172A] p-5 shadow-[0_0_30px_rgba(59,130,246,0.15)] backdrop-blur-sm">
                                <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="text-[10px] font-mono text-blue-400">{protocolInitLabel}</span>
                                    <div className="flex gap-1">
                                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                                        <div className="h-2 w-2 rounded-full bg-slate-700"></div>
                                    </div>
                                </div>
                                {/* Visual Layers */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 rounded border border-slate-700 bg-slate-800/50 p-2">
                                        <Scale size={16} className="text-slate-400" />
                                        <div className="flex-grow">
                                            <div className="text-[10px] font-bold text-slate-300">{legalWrapperLabel}</div>
                                            <div className="mt-1 h-1 w-full overflow-hidden rounded bg-blue-900/50">
                                                <div className="h-full w-full animate-[shimmer_2s_infinite] bg-blue-500"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 rounded border border-slate-700 bg-slate-800/50 p-2">
                                        <FileText size={16} className="text-slate-400" />
                                        <div className="text-[10px] font-bold text-slate-300">{smartContractLabel}</div>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <span className="text-[10px] font-mono text-slate-500">{connectingNodesLabel}</span>
                                </div>
                            </div>
                        </div>

                        {/* STATE 2: MECHANISM / SECURITY */}
                        <div
                            className={`absolute flex w-full justify-center transition-all duration-700 ${
                                activeStep === 2
                                    ? "scale-100 opacity-100 blur-0"
                                    : "pointer-events-none scale-90 opacity-0 blur-sm"
                            }`}
                        >
                            <div className="relative">
                                {/* Outer Rings */}
                                <div className="absolute inset-0 -m-12 h-64 w-64 animate-[spin_10s_linear_infinite] rounded-full border-2 border-[#1BC47D]/20"></div>
                                <div className="absolute inset-0 -m-8 h-56 w-56 animate-[spin_15s_linear_infinite_reverse] rounded-full border border-[#1BC47D]/10"></div>

                                {/* Central Hub */}
                                <div className="relative z-10 flex w-56 flex-col items-center rounded-2xl border-t-4 border-[#1BC47D] bg-white p-6 shadow-2xl">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#1BC47D]/10 text-[#1BC47D]">
                                        <Lock size={28} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-lg font-bold text-[#0B1C2D]">{escrowLabel}</div>
                                    <div className="mb-4 text-xs font-bold tracking-wider text-[#1BC47D]">
                                        {activeProtectionLabel}
                                    </div>

                                    {/* Transaction Simulation */}
                                    <div className="flex w-full items-center justify-between rounded border border-slate-100 bg-[#F5F7FA] p-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold uppercase text-slate-400">{fundsLabel}</span>
                                            <span className="text-xs font-mono font-bold text-[#0B1C2D]">$3,500.00</span>
                                        </div>
                                        <div className="rounded-full bg-[#1BC47D] p-1 text-white">
                                            <CheckCircle size={12} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STATE 3: SUCCESS / VISION */}
                        <div
                            className={`absolute flex w-full justify-center transition-all duration-700 ${
                                activeStep === 3
                                    ? "scale-100 opacity-100 blur-0"
                                    : "pointer-events-none scale-110 opacity-0 blur-sm"
                            }`}
                        >
                            <div className="relative text-center">
                                {/* Glow Effect */}
                                <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 transform bg-[#1BC47D] opacity-30 blur-[80px]"></div>

                                <div className="relative z-10">
                                    <Globe size={64} className="mx-auto mb-4 text-white opacity-90" strokeWidth={1} />
                                    <h3 className="mb-2 text-3xl font-bold tracking-tight text-white">TRUSTORA</h3>
                                    <p className="mb-6 text-xs font-medium uppercase tracking-widest text-[#1BC47D]">
                                        {globalInfrastructureLabel}
                                    </p>

                                    <div className="flex justify-center gap-3">
                                        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-mono text-white backdrop-blur">
                                            <CheckCircle size={10} className="text-[#1BC47D]" /> {verifiedLabel}
                                        </div>
                                        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-mono text-white backdrop-blur">
                                            <Shield size={10} className="text-[#1BC47D]" /> {securedLabel}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Bottom Text in Visual Area */}
                    <div className="absolute bottom-6 left-0 right-0 text-center opacity-40">
                        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white">
                            {systemStatusLabel}{" "}
                            {activeStep === 0
                                ? statusCritical
                                : activeStep === 1
                                  ? statusInitializing
                                  : activeStep === 2
                                    ? statusSecured
                                    : statusOptimal}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrustoraStoryCard;
