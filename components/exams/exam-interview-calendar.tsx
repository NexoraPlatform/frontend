'use client';

import { useEffect } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';

type ExamInterviewCalendarProps = {
    fullName: string;
    email: string;
    note: string;
    serviceId: string;
};

export default function ExamInterviewCalendar({
    fullName,
    email,
    note,
    serviceId,
}: ExamInterviewCalendarProps) {
    useEffect(() => {
        (async function () {
            const cal = await getCalApi({ apiKey: process.env.CAL_API_KEY } as any);
            cal('ui', {
                styles: {
                    branding: {
                        brandColor: '#000000',
                    },
                },
                hideEventTypeDetails: false,
                layout: 'month_view',
            });
        })();
    }, []);

    return (
        <Cal
            namespace="verificare-identitate"
            calLink={`Trustora-app/verificare-identitate?name=${fullName}&email=${email}&notes=${note}&service_id=${serviceId}`}
            style={{ width: '100%', height: '100%', overflow: 'scroll' }}
            config={{ layout: 'month_view' }}
        />
    );
}
