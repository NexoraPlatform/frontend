'use client';

import { useEffect, useMemo } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';

type ExamInterviewCalendarProps = {
    fullName: string;
    email: string;
    note: string;
    serviceId: string;
};

const CAL_NAMESPACE = 'verificare-identitate';

export default function ExamInterviewCalendar({
    fullName,
    email,
    note,
    serviceId,
}: ExamInterviewCalendarProps) {
    const calLink = useMemo(() => {
        const params = new URLSearchParams();

        if (fullName.trim()) {
            params.set('name', fullName.trim());
        }

        if (email.trim()) {
            params.set('email', email.trim());
        }

        if (note.trim()) {
            params.set('notes', note.trim());
        }

        if (serviceId.trim()) {
            params.set('service_id', serviceId.trim());
        }

        const query = params.toString();
        return query
            ? `Trustora-app/${CAL_NAMESPACE}?${query}`
            : `Trustora-app/${CAL_NAMESPACE}`;
    }, [email, fullName, note, serviceId]);

    useEffect(() => {
        let cancelled = false;

        void (async function () {
            try {
                const cal = await getCalApi({ namespace: CAL_NAMESPACE });
                if (cancelled) return;

                cal('ui', {
                    styles: {
                        branding: {
                            brandColor: '#000000',
                        },
                    },
                    hideEventTypeDetails: false,
                    layout: 'month_view',
                });
            } catch {
                // Leave the inline embed visible even if the Cal API bootstrap fails.
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Cal
            namespace={CAL_NAMESPACE}
            calLink={calLink}
            style={{ width: '100%', height: '100%', overflow: 'scroll' }}
            config={{ layout: 'month_view' }}
        />
    );
}
