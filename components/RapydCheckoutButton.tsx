'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from "@/lib/api";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle, Shield, X } from "lucide-react";
import { PriceDisplay } from "@/components/PriceDisplay";

// Definim tipurile pentru Rapyd Toolkit
declare global {
    interface Window {
        RapydCheckoutToolkit: any;
        onCheckoutPaymentSuccess: (event: any) => void;
        onCheckoutFailure: (event: any) => void;
    }
}

interface RapydCheckoutButtonProps {
    project: any;
    milestone: any;
    countryCode?: string;
    onSuccess?: () => void;
}

export default function RapydCheckoutButton({
                                                project,
                                                milestone,
                                                countryCode = 'RO',
                                                onSuccess
    }: RapydCheckoutButtonProps) {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const t = useTranslations();
    const locale = useLocale();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const checkoutInstance = useRef<any>(null);
    const checkoutContainerId = 'rapyd-checkout';

    const getMilestoneId = useCallback((milestone: any) => {
        return milestone?.id ?? milestone?.milestone_id ?? milestone?.milestoneId ?? null;
    }, []);

    const getProjectMilestones = useCallback((projectData: any) => {
        if (!projectData) {
            return [];
        }

        const rootMilestones = Array.isArray(projectData.project_line_milestones)
            ? projectData.project_line_milestones
            : [];
        if (rootMilestones.length > 0) {
            return rootMilestones;
        }

        const lineMilestones = Array.isArray(projectData.project_lines)
            ? projectData.project_lines.flatMap((line: any) => {
                const lineMilestonesRaw = Array.isArray(line?.milestones) ? line.milestones : [];
                return lineMilestonesRaw.map((entry: any) => ({
                    ...entry,
                    project_line_id: entry?.project_line_id ?? entry?.projectLineId ?? line?.id,
                    service_name: entry?.service_name ?? line?.service_name,
                    service_id: entry?.service_id ?? line?.service_id,
                }));
            })
            : [];
        if (lineMilestones.length > 0) {
            return lineMilestones;
        }

        if (Array.isArray(projectData.milestones)) {
            return projectData.milestones.flatMap((milestoneGroup: any) =>
                Array.isArray(milestoneGroup?.milestones)
                    ? milestoneGroup.milestones.map((entry: any) => ({
                        ...entry,
                        providerId: milestoneGroup?.providerId,
                    }))
                    : []
            );
        }

        return [];
    }, []);

    const resetCheckoutContainer = useCallback(() => {
        if (typeof document === 'undefined') return;
        const container = document.getElementById(checkoutContainerId);
        if (container) {
            container.innerHTML = '';
        }
    }, [checkoutContainerId]);

    const waitForCheckoutContainer = useCallback(async () => {
        if (typeof document === 'undefined') return null;
        for (let i = 0; i < 40; i += 1) {
            const node = document.getElementById(checkoutContainerId);
            if (node) return node;
            await new Promise((resolve) => setTimeout(resolve, 25));
        }
        return null;
    }, [checkoutContainerId]);

    const wait = useCallback((ms: number) => {
        return new Promise<void>((resolve) => {
            setTimeout(() => resolve(), ms);
        });
    }, []);

    const closeCheckoutToolkit = useCallback(() => {
        const instance = checkoutInstance.current;
        if (instance) {
            try {
                if (typeof instance.closeToolkit === 'function') {
                    instance.closeToolkit();
                }
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('Failed to close Rapyd checkout toolkit:', error);
                }
            } finally {
                checkoutInstance.current = null;
            }
        }
    }, []);

    // 1. Inițializăm Event Listeners pentru Rapyd
    useEffect(() => {
        const handleSuccess = (event: any) => {
            toast.success('Plata a fost efectuată cu succes!');
            if (typeof onSuccess === 'function') {
                onSuccess();
            }
            setIsModalVisible(false);
            setIsLoading(false);
            closeCheckoutToolkit();
        };


        const handleFailure = (event: any) => {
            console.error('Rapyd Error:', event.detail);
            toast.error('Plata a eșuat sau a fost anulată.');
            closeCheckoutToolkit();
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        };

        // Rapyd emite evenimente pe window
        window.addEventListener('onCheckoutPaymentSuccess', handleSuccess);
        window.addEventListener('onCheckoutFailure', handleFailure);

        return () => {
            window.removeEventListener('onCheckoutPaymentSuccess', handleSuccess);
            window.removeEventListener('onCheckoutFailure', handleFailure);
            closeCheckoutToolkit();
        };
    }, [closeCheckoutToolkit, onSuccess]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isScriptLoaded) return;

        if (window.RapydCheckoutToolkit) {
            setIsScriptLoaded(true);
            return;
        }

        const intervalId = window.setInterval(() => {
            if (window.RapydCheckoutToolkit) {
                setIsScriptLoaded(true);
                window.clearInterval(intervalId);
            }
        }, 250);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isScriptLoaded]);

    // 2. Funcția de start plată
    const handlePayment = async () => {
        if (!isScriptLoaded) {
            toast.error('Sistemul de plată se încarcă. Te rugăm să încerci din nou în câteva secunde.');
            return;
        }
        if (isLoading) {
            return;
        }

        closeCheckoutToolkit();
        resetCheckoutContainer();
        setIsModalVisible(true);
        setIsLoading(true);

        try {
            const currency =
                String(
                    milestone?.currency ??
                    project?.budget?.currency ??
                    project?.currency ??
                    'USD'
                ).toUpperCase();

            // A. Cerem checkout_id de la Backend-ul Laravel
            const data = await apiClient.rapydCheckoutSession(
                project.id,
                currency,
                countryCode,
                getMilestoneId(milestone),
                locale
            );


            if (!data.checkout_id) {
                throw new Error('Nu am primit ID-ul de checkout.');
            }

            // Asigură că modalul și containerul sunt montate înainte de init toolkit.
            await wait(30);
            const checkoutContainer = await waitForCheckoutContainer();
            if (!checkoutContainer) {
                throw new Error('Container-ul de plată nu a fost inițializat. Încearcă din nou.');
            }
            resetCheckoutContainer();

            // B. Lansăm Rapyd Toolkit (Dialog/Modal)
            if (!window.RapydCheckoutToolkit) {
                throw new Error('Librăria Rapyd nu este încărcată.');
            }
            const checkout = new window.RapydCheckoutToolkit({
                pay_button_text: `Plătește acum`,
                id: data.checkout_id,
                container_id: checkoutContainerId,
                close_on_complete: true
            });
            checkoutInstance.current = checkout;
            checkout.displayCheckout();

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        } finally {
            setIsLoading(false);
        }
    };

    const getMilestoneAndProviderDetails = useCallback((projectData: any, targetMilestoneId: any) => {
        if (!projectData || targetMilestoneId === null || targetMilestoneId === undefined) {
            return { found: false, providerName: '', position: 0, isFirst: false };
        }

        const allMilestones = getProjectMilestones(projectData);
        if (allMilestones.length === 0) {
            return { found: false, providerName: '', position: 0, isFirst: false };
        }

        const target = allMilestones.find(
            (entry: any) => String(getMilestoneId(entry)) === String(targetMilestoneId)
        );
        if (!target) {
            return { found: false, providerName: '', position: 0, isFirst: false };
        }

        const targetLineId = target?.project_line_id ?? target?.projectLineId;
        const scopedMilestones = targetLineId !== null && targetLineId !== undefined
            ? allMilestones.filter(
                (entry: any) =>
                    String(entry?.project_line_id ?? entry?.projectLineId) === String(targetLineId)
            )
            : allMilestones;

        const milestoneIndex = scopedMilestones.findIndex(
            (entry: any) => String(getMilestoneId(entry)) === String(targetMilestoneId)
        );

        const projectLines = Array.isArray(projectData?.project_lines) ? projectData.project_lines : [];
        const matchedLine = targetLineId !== null && targetLineId !== undefined
            ? projectLines.find((line: any) => String(line?.id) === String(targetLineId))
            : null;

        const legacyProviderId = target?.providerId ?? target?.provider_id;
        const providers = Array.isArray(projectData?.providers) ? projectData.providers : [];
        const providerInfo = legacyProviderId !== null && legacyProviderId !== undefined
            ? providers.find((provider: any) => String(provider?.id) === String(legacyProviderId))
            : null;

        const providerName =
            String(matchedLine?.service_name ?? '').trim() ||
            String(target?.service_name ?? '').trim() ||
            (providerInfo ? `${providerInfo.firstName ?? ''} ${providerInfo.lastName ?? ''}`.trim() : '') ||
            'Unknown Provider';

        return {
            found: true,
            providerName,
            position: milestoneIndex >= 0 ? milestoneIndex + 1 : 0,
            isFirst: milestoneIndex === 0,
        };
    }, [getMilestoneId, getProjectMilestones]);

    const selectedMilestoneId = getMilestoneId(milestone);
    const isMilestonePayment = milestone != null;
    const selectedMilestoneAmount = milestone?.amount != null
        ? Number(milestone.amount)
        : null;
    const projectBudgetAmount = (() => {
        if (project?.budget?.amount != null) {
            const numeric = Number(project.budget.amount);
            return Number.isFinite(numeric) ? numeric : null;
        }
        const fallback = Number(project?.budget);
        return Number.isFinite(fallback) ? fallback : null;
    })();
    const milestoneDetails = useMemo(
        () => getMilestoneAndProviderDetails(project, selectedMilestoneId),
        [getMilestoneAndProviderDetails, project, selectedMilestoneId]
    );
    const isFirstMilestone = isMilestonePayment ? milestoneDetails.isFirst : false;
    const platformFeeBase = projectBudgetAmount != null
        ? Math.min(projectBudgetAmount * 0.10, 150)
        : null;
    const displayedValueAmount = isMilestonePayment ? selectedMilestoneAmount : projectBudgetAmount;
    const displayedFeeAmount = isMilestonePayment
        ? (isFirstMilestone ? platformFeeBase : 0)
        : platformFeeBase;
    const displayedTotalAmount = displayedValueAmount != null && displayedFeeAmount != null
        ? displayedValueAmount + displayedFeeAmount
        : null;

    return (
        <>
            {/* Încărcăm scriptul Rapyd (Sandbox sau Prod) */}
            <Script
                id="rapyd-checkout-toolkit-script"
                src="https://sandboxcheckouttoolkit.rapyd.net"
                strategy="afterInteractive"
                onLoad={() => {
                    setIsScriptLoaded(true);
                }}
                onReady={() => {
                    setIsScriptLoaded(true);
                }}
            />

            <Button
                onClick={handlePayment}
                disabled={isLoading || !isScriptLoaded}
                className="w-full"
            >
                <Shield className="w-3.5 h-3.5 mr-2" />
                {isLoading ? 'Se procesează...' : t('client.project_requests.actions.secure_payment') || "Secure Payment"}
            </Button>

            {isModalVisible ? (
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 p-4 sm:p-6 opacity-100 pointer-events-auto"
            >
                <div className={`bg-white dark:bg-[#0B1220] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] transition-transform duration-300 ${
                    isModalVisible ? 'scale-100' : 'scale-95'
                }`}>

                    {/* Header - Am adăugat flex-shrink-0 ca să nu se sufoce pe ecrane mici */}
                    <div className="bg-[#0B1C2D] p-5 sm:p-6 text-white flex-shrink-0 rounded-t-2xl">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#1BC47D]" />
                                </div>
                                <div className="text-base sm:text-lg font-bold leading-tight">
                                    {t('client.project_requests.checkout.title')}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    closeCheckoutToolkit();
                                    resetCheckoutContainer();
                                    if (typeof window !== 'undefined') {
                                        window.location.reload();
                                    }
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Secțiunea de detalii - Folosim grid pentru a preveni overflow-ul textului */}
                        <div className="bg-white/5 rounded-lg p-3 sm:p-4 backdrop-blur-sm space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                <span className="text-blue-100 opacity-70">{t('client.project_requests.checkout.project_label')}</span>
                                <span className="font-semibold text-right truncate">{project?.title}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                <span className="text-blue-100 opacity-70">Milestone:</span>
                                <span className="font-semibold text-right">
                                    {selectedMilestoneId ? `#${milestoneDetails.position || 1}` : '-'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                <span className="text-blue-100 opacity-70">{t('dashboard.hero.role.provider')}</span>
                                <span className="font-semibold text-right truncate">
                                    {milestoneDetails.providerName || '-'}
                                </span>
                            </div>

                            <hr className="border-white/10 my-2" />

                            <div className="flex items-center justify-between text-xs sm:text-sm font-bold pt-1">
                                <span className="text-blue-100">{t('client.project_requests.checkout.total_value')}</span>
                                <span className="text-base sm:text-xl text-[#1BC47D]">
                        {displayedTotalAmount != null ? <PriceDisplay value={displayedTotalAmount} /> : '-'}
                    </span>
                            </div>
                        </div>
                    </div>

                    {/* Body - Overflow controlat */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar overflow-x-hidden">
                        {/* Steps - Hide on very small screens or make vertical */}
                        <div className="hidden sm:block text-center mb-6">
                            <div className="grid grid-cols-3 gap-4 text-[11px] sm:text-xs">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="space-y-1">
                                        <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center mx-auto dark:bg-emerald-900/20">
                                            <span className="font-bold text-[#1BC47D]">{step}</span>
                                        </div>
                                        <p className="text-slate-500 dark:text-[#A3ADC2] line-clamp-2">
                                            {t(`client.project_requests.checkout.how_it_works.step_${step}`)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Alert/Guarantee */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-lg p-3 mb-6">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-4 h-4 text-[#1BC47D] mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-[#A3ADC2]">
                                    {t('client.project_requests.checkout.guarantee.description')}
                                </p>
                            </div>
                        </div>

                        {/* Iframe Wrapper */}
                        <div className="relative min-h-[300px] w-full">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#0B1220] z-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1BC47D] mb-2"></div>
                                    <p className="text-xs text-slate-400 italic">Securing connection...</p>
                                </div>
                            )}

                            <div
                                id={checkoutContainerId}
                                className="w-full"
                                style={{ minHeight: '350px' }}
                            ></div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-center flex-shrink-0">
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Shield className="w-3 h-3 text-[#1BC47D]" /> Secure Payment Gateway
                        </p>
                    </div>
                </div>
            </div>
            ) : null}
        </>
    );
}
