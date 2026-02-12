import type { ConnectedAccount as AuthConnectedAccount, User } from '@/types/auth';

export type IntegrationProvider = AuthConnectedAccount['provider'];

export interface ConnectedAccount extends AuthConnectedAccount {}

export interface UserWithIntegrations extends User {
  connected_accounts: ConnectedAccount[];
}
