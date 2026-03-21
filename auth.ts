import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { API_BASE_URL, fetchLaravelUserFromCookieHeader, getCookieValue } from '@/lib/auth/laravel-session';
import { normalizeAuthUser } from '@/lib/auth/user';

type InternalAuthUser = Record<string, any> & {
  __laravelSession?: string;
  __xsrfToken?: string;
};

const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
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
      },
      async authorize(_credentials, request) {
        const cookieHeader = request.headers?.get('cookie') ?? '';
        const origin = request.headers?.get('origin');
        const rawUser = await fetchLaravelUserFromCookieHeader(cookieHeader, origin);
        const user = normalizeAuthUser(rawUser);
        if (!user?.id) return null;

        return {
          ...user,
          __laravelSession: getCookieValue(cookieHeader, 'laravel_session') ?? undefined,
          __xsrfToken: getCookieValue(cookieHeader, 'XSRF-TOKEN') ?? undefined,
        } satisfies InternalAuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const authUser = user as InternalAuthUser;
        const { __laravelSession, __xsrfToken, ...safeUser } = authUser;
        token.user = safeUser;
        token.laravelSession = __laravelSession;
        token.xsrfToken = __xsrfToken;
      } else if (trigger === 'update' && session?.user) {
        const mergedUser = normalizeAuthUser({
          ...(token.user as Record<string, unknown> | undefined),
          ...(session.user as Record<string, unknown>),
        });
        token.user = mergedUser ?? token.user;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as any;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = 'token' in message ? message.token : null;
      const laravelSession = token?.laravelSession;
      if (!laravelSession || typeof laravelSession !== 'string') return;

      const xsrfToken =
        typeof token?.xsrfToken === 'string' && token.xsrfToken.length > 0
          ? token.xsrfToken
          : null;
      const cookieHeader = [
        `laravel_session=${laravelSession}`,
        xsrfToken ? `XSRF-TOKEN=${xsrfToken}` : null,
      ]
        .filter(Boolean)
        .join('; ');

      try {
        const headers: HeadersInit = {
          Accept: 'application/json',
          Cookie: cookieHeader,
          'X-Requested-With': 'XMLHttpRequest',
          Origin:
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXTAUTH_URL ||
            process.env.AUTH_URL ||
            'http://127.0.0.1:3000',
          Referer:
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXTAUTH_URL ||
            process.env.AUTH_URL ||
            'http://127.0.0.1:3000',
        };

        if (xsrfToken) {
          headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
        }

        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers,
          cache: 'no-store',
        });
      } catch {
        // Ignore backend logout cleanup failures during session teardown.
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export type AuthSession = Awaited<ReturnType<typeof auth>>;
