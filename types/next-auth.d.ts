import type { AuthUser } from '@/lib/auth/user';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: AuthUser & DefaultSession['user'];
  }

  interface User extends AuthUser {
    __laravelSession?: string;
    __xsrfToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: AuthUser;
    laravelSession?: string;
    xsrfToken?: string;
  }
}
