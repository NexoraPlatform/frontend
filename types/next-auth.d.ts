import type { AuthUser } from '@/lib/auth/user';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: AuthUser & DefaultSession['user'];
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    accessTokenExpiresAt?: number;
    rememberMe?: boolean;
    error?: string;
  }

  interface User extends AuthUser {
    __backendAccessToken?: string;
    __backendRefreshToken?: string;
    __backendTokenType?: string;
    __backendAccessTokenExpiresAt?: number;
    __rememberMe?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: AuthUser;
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    accessTokenExpiresAt?: number;
    rememberMe?: boolean;
    error?: string;
  }
}
