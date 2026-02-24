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
    connected_accounts?: ConnectedAccount[];
    [key: string]: any;
}
