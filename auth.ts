import NextAuth, { CredentialsSignin, type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {
  exchangePassportPasswordGrant,
  fetchPassportUserProfile,
  refreshPassportAccessToken,
  revokePassportAccessToken,
} from '@/lib/auth/passport';
import { hasSessionAuthTokens } from '@/lib/auth/session';
import { normalizeAuthUser } from '@/lib/auth/user';

type InternalAuthUser = Record<string, any> & {
  __backendAccessToken?: string;
  __backendRefreshToken?: string;
  __backendTokenType?: string;
  __backendAccessTokenExpiresAt?: number;
  __rememberMe?: boolean;
};

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

class PassportCredentialsSignin extends CredentialsSignin {
  constructor(code: string, cause?: unknown) {
    super();
    this.code = code;
    if (cause instanceof Error) {
      this.cause = { err: cause };
    } else if (cause && typeof cause === 'object') {
      this.cause = cause as Record<string, unknown>;
    }
  }
}

const resolvePassportErrorCode = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('missing passport client credentials')) {
    return 'passport_client';
  }

  if (message.includes('authorization grant type is not supported')) {
    return 'passport_grant';
  }

  if (message.includes('invalid_client')) {
    return 'passport_client';
  }

  if (
    message.includes('invalid_grant') ||
    message.includes('credentials are incorrect') ||
    message.includes('provided credentials are incorrect')
  ) {
    return 'invalid_credentials';
  }

  if (message.includes('profile')) {
    return 'passport_profile';
  }

  return 'passport_error';
};

const buildClearedToken = (token: Record<string, any>, error: string) => ({
  ...token,
  user: undefined,
  accessToken: undefined,
  refreshToken: undefined,
  tokenType: undefined,
  accessTokenExpiresAt: undefined,
  name: undefined,
  email: undefined,
  picture: undefined,
  sub: undefined,
  error,
});

async function refreshAccessToken(token: Record<string, any>) {
  const refreshToken =
    typeof token.refreshToken === 'string' && token.refreshToken.length > 0
      ? token.refreshToken
      : null;

  if (!refreshToken) {
    return buildClearedToken(token, 'MissingRefreshToken');
  }

  try {
    const refreshed = await refreshPassportAccessToken({
      refreshToken,
    });

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token || refreshToken,
      tokenType:
        typeof refreshed.token_type === 'string' && refreshed.token_type.length > 0
          ? refreshed.token_type
          : token.tokenType || 'Bearer',
      accessTokenExpiresAt: Date.now() + Number(refreshed.expires_in || 0) * 1000,
      error: undefined,
    };
  } catch {
    return buildClearedToken(token, 'RefreshAccessTokenError');
  }
}

const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        remember: { label: 'Remember me', type: 'text' },
      },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        const rememberMe =
          credentials?.remember === true ||
          credentials?.remember === 'true' ||
          credentials?.remember === '1' ||
          credentials?.remember === 'on';

        if (!email || !password) return null;

        const origin = request.headers?.get('origin');
        let passportToken;

        try {
          passportToken = await exchangePassportPasswordGrant({
            username: email,
            password,
            origin,
          });
        } catch (error) {
          throw new PassportCredentialsSignin(resolvePassportErrorCode(error), error);
        }

        if (!passportToken?.access_token) {
          throw new PassportCredentialsSignin('passport_token');
        }

        let rawUser;
        try {
          rawUser = await fetchPassportUserProfile(passportToken.access_token, {
            origin,
            includeConnectedAccounts: true,
          });
        } catch (error) {
          throw new PassportCredentialsSignin('passport_profile', error);
        }

        const user = normalizeAuthUser(rawUser);

        if (!user?.id) {
          throw new PassportCredentialsSignin('passport_profile');
        }

        const tokenType =
          typeof passportToken.token_type === 'string' && passportToken.token_type.trim().length > 0
            ? passportToken.token_type.trim()
            : passportToken.access_token
              ? 'Bearer'
              : undefined;
        const expiresInSeconds = Number(passportToken.expires_in ?? 0);
        const accessTokenExpiresAt =
          Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
            ? Date.now() + expiresInSeconds * 1000
            : undefined;

        return {
          ...user,
          __backendAccessToken: passportToken.access_token,
          __backendRefreshToken: passportToken.refresh_token,
          __backendTokenType: tokenType,
          __backendAccessTokenExpiresAt: accessTokenExpiresAt,
          __rememberMe: rememberMe,
        } satisfies InternalAuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const authUser = user as InternalAuthUser;
        const {
          __backendAccessToken,
          __backendRefreshToken,
          __backendTokenType,
          __backendAccessTokenExpiresAt,
          __rememberMe,
          ...safeUser
        } = authUser;
        token.user = normalizeAuthUser(safeUser) ?? undefined;
        token.accessToken = __backendAccessToken;
        token.refreshToken = __backendRefreshToken;
        token.tokenType = __backendTokenType;
        token.accessTokenExpiresAt = __backendAccessTokenExpiresAt;
        token.rememberMe = Boolean(__rememberMe);
        token.error = undefined;
      } else if (trigger === 'update' && session) {
        if (session.user) {
          const mergedUser = normalizeAuthUser({
            ...(token.user as Record<string, unknown> | undefined),
            ...(session.user as Record<string, unknown>),
          });
          token.user = mergedUser ?? token.user;
        }
        if (typeof session.accessToken === 'string' && session.accessToken.length > 0) {
          token.accessToken = session.accessToken;
        } else if (session.accessToken === null) {
          token.accessToken = undefined;
        }
        if (typeof session.refreshToken === 'string' && session.refreshToken.length > 0) {
          token.refreshToken = session.refreshToken;
        } else if (session.refreshToken === null) {
          token.refreshToken = undefined;
        }
        if (typeof session.tokenType === 'string' && session.tokenType.length > 0) {
          token.tokenType = session.tokenType;
        } else if (session.tokenType === null) {
          token.tokenType = undefined;
        }
        if (typeof session.accessTokenExpiresAt === 'number') {
          token.accessTokenExpiresAt = session.accessTokenExpiresAt;
        } else if (session.accessTokenExpiresAt === null) {
          token.accessTokenExpiresAt = undefined;
        }
        if (typeof session.rememberMe === 'boolean') {
          token.rememberMe = session.rememberMe;
        }
        if (typeof session.error === 'string' && session.error.length > 0) {
          token.error = session.error;
        } else if (session.error === null) {
          token.error = undefined;
        }
      }

      const isAccessTokenUsable =
        typeof token.accessToken === 'string' &&
        token.accessToken.length > 0 &&
        typeof token.accessTokenExpiresAt === 'number' &&
        Date.now() < token.accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS;

      if (isAccessTokenUsable) {
        return token;
      }

      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      if (token.accessToken) {
        return buildClearedToken(token, 'ExpiredAccessToken');
      }

      return token;
    },
    async session({ session, token }) {
      if (hasSessionAuthTokens(token as any) && token.user) {
        session.user = token.user as any;
      } else {
        session.user = undefined as any;
      }
      if (typeof token.accessToken === 'string' && token.accessToken.length > 0) {
        session.accessToken = token.accessToken;
      }
      if (typeof token.refreshToken === 'string' && token.refreshToken.length > 0) {
        session.refreshToken = token.refreshToken;
      }
      if (typeof token.tokenType === 'string' && token.tokenType.length > 0) {
        session.tokenType = token.tokenType;
      }
      if (typeof token.accessTokenExpiresAt === 'number') {
        session.accessTokenExpiresAt = token.accessTokenExpiresAt;
      }
      session.rememberMe = Boolean(token.rememberMe);
      if (typeof token.error === 'string' && token.error.length > 0) {
        session.error = token.error;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      const accessToken =
        typeof token?.accessToken === 'string' && token.accessToken.length > 0
          ? token.accessToken
          : null;
      if (!accessToken) return;

      try {
        await revokePassportAccessToken({
          accessToken,
        });
      } catch {
        // Ignore backend logout cleanup failures during session teardown.
      }
    },
  },
};

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth(authConfig);

export type AuthSession = Awaited<ReturnType<typeof auth>>;
