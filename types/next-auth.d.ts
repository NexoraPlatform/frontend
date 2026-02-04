
import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { AccessRole } from "@/lib/access";

type Company = {
  id?: number | string;
  name?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  company_country?: string | null;
  company_county?: string | null;
  company_city?: string | null;
  company_zip?: string | null;
  company_address?: string | null;
  company_bank_iban?: string | null;
  company_bank_bic?: string | null;
  company_bank_name?: string | null;
  bank_currency?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

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

      email_verified_at?: string | null;
      avatar?: string | null;
      phone?: string | null;

      company?: Company | null;

      country_code?: string | null;
      website?: string | null;
      location?: string;
      language?: string;
      bio?: string;
      role?: string | null;
      role_slugs?: string[];
      permission_slugs?: string[];
      permissions?: string[];
      roles?: AccessRole[];
      rating?: string | number;
      reviewCount?: number;
      status?: string;
      last_login_at?: string | null;
      last_active_at?: string | null;
      timezone?: string | null;
      created_at?: string;
      updated_at?: string;
      testVerified?: boolean;
      callVerified?: boolean;
      stripe_account_id?: string;
      rapyd_wallet_id?: string;
      rapyd_contact_id?: string;
      is_online?: boolean;
      last_seen?: string | null;
      onesignal_player_id?: string | null;
      profile_url?: string | null;
      is_superuser?: boolean;
      github_token?: string;
      github_refresh_token?: string | null;
      github_nickname?: string;
      user_permissions?: Record<string, any> | any[];
      oldest_work_experience?: string | null;
      next_available_job?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;

    email_verified_at?: string | null;
    avatar?: string | null;
    phone?: string | null;

    company?: Company | null;

    country_code?: string | null;
    website?: string | null;
    location?: string;
    language?: string;
    bio?: string;
    role?: string | null;
    role_slugs?: string[];
    permission_slugs?: string[];
    permissions?: string[];
    roles?: AccessRole[];
    rating?: string | number;
    reviewCount?: number;
    status?: string;
    last_login_at?: string | null;
    last_active_at?: string | null;
    timezone?: string | null;
    created_at?: string;
    updated_at?: string;
    testVerified?: boolean;
    callVerified?: boolean;
    stripe_account_id?: string;
    rapyd_wallet_id?: string;
    rapyd_contact_id?: string;
    is_online?: boolean;
    last_seen?: string | null;
    onesignal_player_id?: string | null;
    profile_url?: string;
    is_superuser?: boolean;
    access_token?: string; // Sometimes returned from backend login
    github_token?: string;
    github_refresh_token?: string | null;
    github_nickname?: string;
    user_permissions?: Record<string, any> | any[];
    oldest_work_experience?: string | null;
    next_available_job?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    accessToken?: string;
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    email_verified_at?: string | null;
    avatar?: string | null;
    phone?: string | null;

    company?: Company | null;

    country_code?: string | null;
    website?: string | null;
    language?: string;
    location?: string;
    bio?: string;

    role?: string | null;
    roles?: AccessRole[];
    permissions?: string[];
    role_slugs?: string[];
    permission_slugs?: string[];
    is_superuser?: boolean;

    rating?: string | number;
    reviewCount?: number;
    status?: string;
    last_login_at?: string | null;
    last_active_at?: string | null;
    timezone?: string | null;
    created_at?: string;
    updated_at?: string;

    testVerified?: boolean;
    callVerified?: boolean;
    stripe_account_id?: string;
    rapyd_wallet_id?: string;
    rapyd_contact_id?: string;
    is_online?: boolean;
    last_seen?: string | null;
    onesignal_player_id?: string | null;
    profile_url?: string;

    github_token?: string;
    github_refresh_token?: string | null;
    github_nickname?: string;
    user_permissions?: Record<string, any> | any[];
    oldest_work_experience?: string | null;
    next_available_job?: string | null;
  }
}
