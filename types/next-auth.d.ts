
import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { AccessRole } from "@/lib/access";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      location?: string;
      language?: string;
      bio?: string;
      role?: string;
      avatar?: string;
      testVerified?: boolean;
      callVerified?: boolean;
      stripe_account_id?: string;
      roles?: AccessRole[];
      permissions?: string[];
      is_superuser?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    location?: string;
    language?: string;
    bio?: string;
    role?: string;
    avatar?: string;
    testVerified?: boolean;
    callVerified?: boolean;
    stripe_account_id?: string;
    roles?: AccessRole[];
    permissions?: string[];
    is_superuser?: boolean;
    access_token?: string; // Sometimes returned from backend login
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    accessToken?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    roles?: AccessRole[];
    permissions?: string[];
    is_superuser?: boolean;
    testVerified?: boolean;
    callVerified?: boolean;
    stripe_account_id?: string;
    language?: string;
    location?: string;
    avatar?: string;
    bio?: string;
  }
}