/**
 * Early Access Service
 * Handles early access applications and newsletter subscriptions
 */

import { http } from '@/lib/fetch-client';

export type EarlyAccessPayload = {
    user_type: 'client' | 'provider';
    email: string;
    language?: string;
    contact_name?: string;
    company_name?: string;
    hiring_needs?: string;
    typical_project_budget?: number;
    hire_frequency?: string;
    lost_money?: boolean;
    escrow_help?: boolean;
    full_name?: string;
    country?: string;
    primary_skill?: string;
    years_experience?: number;
    has_clients?: boolean;
    unpaid_work?: boolean;
    wants_escrow?: boolean;
    profile_note?: string;
};

export type EarlyAccessApplication = {
    id: number;
    user_type: 'client' | 'provider';
    full_name: string | null;
    contact_name: string | null;
    company_name: string | null;
    email: string;
    country: string | null;
    primary_skill: string | null;
    years_experience: number | null;
    has_clients: boolean | null;
    unpaid_work: boolean | null;
    wants_escrow: boolean | null;
    hiring_needs: string | null;
    typical_project_budget: number | null;
    hire_frequency: string | null;
    lost_money: boolean | null;
    escrow_help: boolean | null;
    score: number;
    created_at: string;
    updated_at: string;
};

export type NewsletterSubscription = {
    email: string;
    user_type: 'client' | 'provider';
    name?: string;
    company?: string;
    language?: 'ro' | 'en';
};

export const earlyAccessService = {
    /**
     * Create a new early access application
     */
    async createApplication(payload: EarlyAccessPayload) {
        return http.post<{
            email_exists: boolean;
            application?: EarlyAccessApplication;
        }>('/early-access', payload);
    },

    /**
     * Verify early access application with code
     */
    async verifyApplication(payload: { code: string; language?: 'en' | 'ro' }) {
        return http.post<{
            verified: boolean;
            expired?: boolean;
            message?: string;
            application?: {
                id: number;
                user_type: 'client' | 'provider';
                email: string;
                email_verification: boolean;
                email_verification_expired: boolean;
            };
        }>('/early-access/verify', payload);
    },

    /**
     * Resend verification email
     */
    async resendVerification(payload: { application_id: string; language?: 'en' | 'ro' }) {
        return http.post<{
            resent: boolean;
            verified?: boolean;
            message?: string;
            application?: {
                id: number;
                user_type: 'client' | 'provider';
                email: string;
                application_id: string;
                email_verification: boolean;
            };
        }>('/early-access/resend', payload);
    },

    /**
     * Get grouped early access applications (admin)
     */
    async getGrouped(params?: { page?: number; per_page?: number }) {
        return http.get<{
            providers: any[];
            clients: any[];
            pagination?: {
                current_page: number;
                per_page: number;
                total: number;
                last_page: number;
            };
        }>('/early-access/grouped', { params });
    },

    /**
     * Subscribe to newsletter
     */
    async subscribeToNewsletter(payload: NewsletterSubscription) {
        return http.post<{
            success: boolean;
            data: {
                id: number;
                email: string;
                name: string | null;
                user_type: 'client' | 'provider';
                company: string | null;
                subscribed_at: string;
                unsubscribed_at: string | null;
                created_at: string;
                updated_at: string;
            };
        }>('/newsletter/subscribe', payload);
    },

    /**
     * Unsubscribe from newsletter
     */
    async unsubscribeFromNewsletter(token: string) {
        return http.post<{ unsubscribed: boolean }>('/newsletter/unsubscribe', { token });
    },

    /**
     * Get newsletter templates (admin)
     */
    async getNewsletterTemplates() {
        return http.get<{ templates: string[] }>('/newsletter/templates');
    },

    /**
     * Get newsletter template content (admin)
     */
    async getNewsletterTemplateContent(template: string) {
        return http.get<{ template: string; content: string }>(`/newsletter/templates/${template}`);
    },

    /**
     * Send newsletter (admin)
     */
    async sendNewsletter(payload: {
        template: string;
        subject: string;
        data?: Record<string, string>;
        user_type?: 'client' | 'provider';
        recipients?: string[];
        language?: 'ro' | 'en';
    }) {
        return http.post<{ sent: number }>('/newsletter/send', payload);
    },

    /**
     * Get newsletter subscribers (admin)
     */
    async getNewsletterSubscribers(params?: { per_page?: number; only_active?: boolean }) {
        return http.get<{
            data: Array<{
                id: number;
                email: string;
                name: string | null;
                user_type: 'client' | 'provider';
                company: string | null;
                language: 'ro' | 'en';
                unsubscribe_token: string;
                subscribed_at: string;
                unsubscribed_at: string | null;
                created_at: string;
                updated_at: string;
            }>;
            pagination?: {
                current_page: number;
                per_page: number;
                total: number;
                last_page: number;
            };
        }>('/newsletter', { params });
    },
};

export default earlyAccessService;
