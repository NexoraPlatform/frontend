export type OAuthProvider = 'github' | 'google' | 'figma';

export interface ConnectedAccount {
    id: number;
    provider: OAuthProvider;
    provider_id: string;
    expires_at?: string;
    created_at: string;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    escrow_customer_id?: string | null;
    escrow_kyb_verified?: boolean | null;
    escrow_next_step?: string | null;
    connected_accounts?: ConnectedAccount[];
    [key: string]: any;
}
