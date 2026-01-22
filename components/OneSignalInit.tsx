"use client";

import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

export default function OneSignalInit() {
    const { user } = useAuth();
    // Folosim un ref global pentru a preveni re-inițializarea strictă
    const oneSignalInitialized = useRef(false);
    const oneSignalInitPromise = useRef<Promise<void> | null>(null);
    const linkUserToOneSignal = async (userId: string) => {
        const legacyLogin = (OneSignal as any).setExternalUserId;
        if (typeof legacyLogin === 'function') {
            await legacyLogin(userId);
            return;
        }

        if (typeof OneSignal.login === 'function') {
            await OneSignal.login(userId);
        }
    };

    useEffect(() => {
        const initOneSignal = async () => {
            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
            if (!appId) {
                return;
            }

            // 1. Prevenim apelarea multiplă
                if (oneSignalInitialized.current) {
                // Dacă e deja inițializat, doar actualizăm userul (dacă e cazul)
                if (user) {
                    try {
                        await linkUserToOneSignal(user.id.toString());
                    } catch (error) {
                        console.error("OneSignal login error:", error);
                    }
                }
                return;
            }

            try {
                // 2. Inițializarea
                if (!oneSignalInitPromise.current) {
                    oneSignalInitPromise.current = OneSignal.init({
                        appId,
                        allowLocalhostAsSecureOrigin: true, // CRITIC pentru localhost
                        notifyButton: {
                            enable: true,
                            showCredit: false,
                            prenotify: true,
                            position: 'bottom-right',
                            offset: { bottom: '15px', left: '15px', right: '15px' },
                            text: {
                                'tip.state.unsubscribed': 'Abonează-te la notificări',
                                'tip.state.subscribed': 'Ești abonat la notificări',
                                'tip.state.blocked': 'Ai blocat notificările',
                                'message.action.subscribed': 'Mulțumim pentru abonare!',
                                'message.action.resubscribed': 'Te-ai reabonat!',
                                'message.action.unsubscribed': 'Nu vei mai primi notificări',
                                'dialog.main.title': 'Setări Notificări',
                                'dialog.main.button.subscribe': 'Abonează-te',
                                'dialog.main.button.unsubscribe': 'Dezabonează-te',
                                'dialog.blocked.title': 'Deblochează Notificările',
                                'dialog.blocked.message': 'Urmează instrucțiunile pentru a permite notificările:'
                            }
                        } as any,
                    });
                }

                await oneSignalInitPromise.current;

                oneSignalInitialized.current = true;
                console.log("OneSignal Initialized Successfully");

                // 3. Ascultăm evenimentul de abonare
                OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
                    if (event.current.optedIn) {
                        const onesignalId = OneSignal.User.PushSubscription.id;
                        if (onesignalId) {
                            console.log("OneSignal ID:", onesignalId);
                            // Încercăm să trimitem tokenul la backend dacă avem user logat
                            // Nota: Dacă userul nu e logat la abonare, tokenul se va trimite la login
                            try {
                                await apiClient.updateOneSignalToken(onesignalId);
                            } catch (e) {
                                console.error("Token sync error", e);
                            }
                        }
                    }
                });

                // 4. Login user (dacă există deja la încărcare)
                if (user) {
                    try {
                        await linkUserToOneSignal(user.id.toString());
                    } catch (error) {
                        console.error("OneSignal login error:", error);
                    }
                }

            } catch (error: any) {
                // Ignorăm eroarea specifică "SDK already initialized"
                if (error?.message?.includes("SDK already initialized")) {
                    oneSignalInitialized.current = true;
                } else {
                    console.error("OneSignal Init Error:", error);
                }
            }
        };

        initOneSignal();
    }, [user]); // Rulăm efectul când user-ul se schimbă, dar init() e protejat de ref

    return null;
}
