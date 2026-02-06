// utils/audit.ts
import axios from '@/lib/axios';

export async function logEvent(action: string, metadata: Record<string, any> = {}, subject?: { type?: string; id?: number }, token?: string) {
    const body: any = { action, metadata };
    if (subject?.type) body.subject_type = subject.type;
    if (subject?.id)   body.subject_id   = subject.id;

    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/logs`, body, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'X-Device-Id': getDeviceId(),       // optional
            'X-Request-Id': crypto.randomUUID() // pass through correlation if you want
        },
    });
}

function getDeviceId() {
    // store a random UUID in localStorage once
    const key = 'device_id';
    let id = localStorage.getItem(key);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
    return id;
}
