'use client';

import React, {useState, useEffect, useCallback, useRef} from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button'; // Folosim butonul tău UI
import { toast } from 'sonner'; // Sau hook-ul tău de toast
import { useAuth } from '@/contexts/auth-context';
import apiClient from "@/lib/api";
import {useTranslations} from "next-intl";
import {AlertCircle, CheckCircle, Globe, Shield, X} from "lucide-react";
import {Dialog, DialogContent, DialogDescription, DialogTitle} from "@/components/ui/dialog";
import {PriceDisplay} from "@/components/PriceDisplay";
import {Alert, AlertDescription} from "@/components/ui/alert"; // Presupunând că ai nevoie de token

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
    const { user } = useAuth(); // Dacă ai nevoie de user pt auth headers
    const t = useTranslations();
    const [checkoutDialog, setCheckoutDialog] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const checkoutInstance = useRef<any>(null);

    const getMilestoneId = useCallback((milestone: any) => {
        return milestone?.id ?? milestone?.milestone_id ?? milestone?.milestoneId ?? null;
    }, []);

    // 1. Inițializăm Event Listeners pentru Rapyd
    useEffect(() => {
        const handleSuccess = (event: any) => {
            console.log('Rapyd Success:', event.detail);
            setSuccessMessage('Rapyd Success: ' + event.detail);
            toast.success('Plata a fost efectuată cu succes!');
            // if (onSuccess) onSuccess();/**/
            setIsModalVisible(false);
            checkoutInstance.current.closeToolkit();
        };


        const handleFailure = (event: any) => {
            console.error('Rapyd Error:', event.detail);
            setErrorMessage('Rapyd Error: ' + event.detail);
            toast.error('Plata a eșuat sau a fost anulată.');
            setTimeout(() => {
                setCheckoutDialog(false);
                setIsLoading(false);
            }, 500);
        };

        // Rapyd emite evenimente pe window
        window.addEventListener('onCheckoutPaymentSuccess', handleSuccess);
        window.addEventListener('onCheckoutFailure', handleFailure);

        return () => {
            window.removeEventListener('onCheckoutPaymentSuccess', handleSuccess);
            window.removeEventListener('onCheckoutFailure', handleFailure);
        };
    }, []);

    // 2. Funcția de start plată
    const handlePayment = async () => {
        setIsModalVisible(true);

        if (checkoutInstance.current) {
            return;
        }
        if (!isScriptLoaded) {
            toast.error('Sistemul de plată se încarcă. Te rugăm să încerci din nou în câteva secunde.');
            setErrorMessage('Rapyd Error: Sistemul de plată se încarcă. Te rugăm să încerci din nou în câteva secunde.');
            return;
        }

        setIsLoading(true);
        setCheckoutDialog(true);

        try {
            // A. Cerem checkout_id de la Backend-ul Laravel
            const response = await apiClient.rapydCheckoutSession(project.id, milestone.currency, countryCode, getMilestoneId(milestone));

            const data = await response;


            if (!data.checkout_id) {
                throw new Error('Nu am primit ID-ul de checkout.');
            }

            // B. Lansăm Rapyd Toolkit (Dialog/Modal)
            if (window.RapydCheckoutToolkit) {
                const checkout = new window.RapydCheckoutToolkit({
                    pay_button_text: `Plătește acum`,
                    id: data.checkout_id,
                    container_id: 'rapyd-checkout',
                    close_on_complete: true // Modul de încasare
                });

                checkoutInstance.current = checkout;
                checkout.displayCheckout();
            } else {
                throw new Error('Librăria Rapyd nu este încărcată.');
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
            setErrorMessage(error.message);
            setTimeout(() => {
                setCheckoutDialog(false);
                setIsLoading(false);
            }, 500);
        } finally {
            setIsLoading(false);
        }
    };

    const getMilestoneAndProviderDetails = (projectData: any, targetMilestoneId: any) => {
        // 1. Găsim grupul de milestone-uri și providerId-ul asociat
        let foundProviderId: any = null;
        let milestoneIndex = -1;

        for (const group of projectData.milestones) {
            const idx = group.milestones.findIndex((m: any) => m.id === targetMilestoneId);
            if (idx !== -1) {
                foundProviderId = group.providerId;
                milestoneIndex = idx;
                break;
            }
        }

        if (foundProviderId === null) {
            return { found: false };
        }

        // 2. Găsim detaliile providerului (numele) în array-ul "providers"
        const providerInfo = projectData.providers.find((p: any) => p.id === foundProviderId);

        return {
            found: true,
            providerId: foundProviderId,
            providerName: providerInfo ? `${providerInfo.firstName} ${providerInfo.lastName}` : "Unknown Provider",
            position: milestoneIndex + 1,
            isFirst: milestoneIndex === 0,
            avatar: providerInfo?.avatar
        };
    };

    const isMilestonePayment = milestone != null;
    const selectedMilestoneAmount = milestone?.amount != null
        ? Number(milestone.amount)
        : null;
    const projectBudgetAmount = milestone?.budget?.amount != null
        ? Number(milestone.budget.amount)
        : null;
    const isFirstMilestone = (() => {
        if (!isMilestonePayment || !project || !milestone.id || !milestone.providerId) return false;
        const providerMilestones = project.milestones
            ?.find((milestoneGroup: any) => String(milestoneGroup.providerId) === String(milestone.providerId))
            ?.milestones ?? [];
        const index = providerMilestones.findIndex(
            (milestone: any) => String(getMilestoneId(milestone)) === String(milestone.id)
        );
        return index === 0;
    })();
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
                src="https://sandboxcheckouttoolkit.rapyd.net"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log('Rapyd Script Loaded');
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

            <div
                className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 p-4 sm:p-6 ${
                    isModalVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
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
                                onClick={() => setIsModalVisible(false)}
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
                                <span className="font-semibold text-right">#{getMilestoneAndProviderDetails(project, milestone.id).position}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                <span className="text-blue-100 opacity-70">{t('dashboard.hero.role.provider')}</span>
                                <span className="font-semibold text-right truncate">{getMilestoneAndProviderDetails(project, milestone.id).providerName}</span>
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
                                id="rapyd-checkout"
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
        </>
    );
}
