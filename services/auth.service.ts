/**
 * Authentication Service
 * Handles user authentication, registration, and profile operations
 */

import { http } from '@/lib/fetch-client';
import { ensureCsrfCookie } from '@/lib/csrf';
import type { ConnectedAccount } from '@/types/integration';

export type LoginCredentials = {
    email: string;
    password: string;
};

export type RegisterData = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    company_name?: string;
    tax_id?: string;
    trade_registry_number?: string;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
};

export type AuthResponse = {
    access_token: string;
    user: any;
    roles?: any[];
    permissions?: string[];
};

export const authService = {
    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        await ensureCsrfCookie();
        return http.post<AuthResponse>('/auth/login', credentials);
    },

    /**
     * Register a new user account
     */
    async register(userData: RegisterData): Promise<AuthResponse> {
        await ensureCsrfCookie();
        return http.post<AuthResponse>('/auth/register', userData);
    },

    /**
     * Get current authenticated user
     */
    async getMe(): Promise<any> {
        return http.get('/auth/me', {
            params: { include: 'connected_accounts' },
        });
    },

    async me(): Promise<any> {
        return http.get('/auth/me', {
            params: { include: 'connected_accounts' },
        });
    },

    async getConnectedAccounts(): Promise<ConnectedAccount[]> {
        const response = await http.get<any>('/auth/me', {
            params: { include: 'connected_accounts' },
        });
        const user = response?.user ?? response;
        return Array.isArray(user?.connected_accounts) ? user.connected_accounts : [];
    },

    /**
     * Logout current authenticated user
     */
    async logout(): Promise<any> {
        await ensureCsrfCookie();
        return http.post('/auth/logout');
    },

    /**
     * Get user profile
     */
    async getProfile(): Promise<any> {
        return http.get('/auth/profile');
    },

    /**
     * Get test exams details for the authenticated user
     */
    async getTestExamsDetails(): Promise<any> {
        return http.get('/auth/test-exams-details');
    },

    /**
     * Get test result by ID
     */
    async getTestResult(id: string): Promise<any> {
        return http.get(`/test/result/${id}`);
    },
};

export default authService;
