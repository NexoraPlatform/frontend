
import NextAuth, { User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const normalizeCompany = (source: any, fallback?: any) => {
    const base =
        typeof source?.company === "object" && source.company !== null
            ? source.company
            : fallback ?? null;

    const name =
        source?.company_name ??
        (typeof source?.company === "string" ? source.company : undefined) ??
        base?.name ??
        null;

    const hasFields =
        base ||
        [
            source?.company_id,
            source?.id_type,
            source?.id_number,
            source?.company_country,
            source?.company_county,
            source?.company_city,
            source?.company_zip,
            source?.company_address,
            source?.company_bank_iban,
            source?.company_bank_bic,
            source?.company_bank_name,
            source?.bank_currency,
            name,
        ].some((value) => value !== undefined && value !== null && value !== "");

    if (!hasFields) return null;

    return {
        id: source?.company_id ?? base?.id ?? null,
        name,
        id_type: source?.id_type ?? base?.id_type ?? null,
        id_number: source?.id_number ?? base?.id_number ?? null,
        company_country: source?.company_country ?? base?.company_country ?? null,
        company_county: source?.company_county ?? base?.company_county ?? null,
        company_city: source?.company_city ?? base?.company_city ?? null,
        company_zip: source?.company_zip ?? base?.company_zip ?? null,
        company_address: source?.company_address ?? base?.company_address ?? null,
        company_bank_iban: source?.company_bank_iban ?? base?.company_bank_iban ?? null,
        company_bank_bic: source?.company_bank_bic ?? base?.company_bank_bic ?? null,
        company_bank_name: source?.company_bank_name ?? base?.company_bank_name ?? null,
        bank_currency: source?.bank_currency ?? base?.bank_currency ?? null,
        created_at: base?.created_at ?? null,
        updated_at: base?.updated_at ?? null,
    };
};

const stripCompanyDuplicates = (target: any) => {
    delete target.company_id;
    delete target.company_name;
    delete target.tax_id;
    delete target.trade_registry_number;
    delete target.billing_address;
    delete target.billing_city;
    delete target.billing_state;
    delete target.billing_postal_code;
    delete target.id_type;
    delete target.id_number;
    delete target.company_country;
    delete target.company_county;
    delete target.company_city;
    delete target.company_zip;
    delete target.company_address;
    delete target.company_bank_iban;
    delete target.company_bank_bic;
    delete target.company_bank_name;
    delete target.bank_currency;
};

// Separate the auth config from the main NextAuth export if needed for middleware matchers,
// but for now, we put everything here.
export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const API_BASE_URL =
                    process.env.NEXT_PUBLIC_API_URL || "https://backend.trustora.ro/api";

                try {
                    const res = await fetch(`${API_BASE_URL}/auth/login`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    if (!res.ok) {
                        // Log error or throw
                        console.error("Login failed:", res.status, res.statusText);
                        return null;
                    }

                    const data = await res.json();
                    // Expecting data in format: { access_token: string, user: UserData }
                    if (data?.access_token && data?.user) {
                        // Return object that matches User interface
                        return {
                            ...data.user,
                            id: String(data.user.id), // Ensure ID is string
                            access_token: data.access_token, // Critical for session
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            const applyUser = (source: any) => {
                if (!source) return;

                const tokenCompany =
                    typeof token.company === "object" && token.company !== null ? token.company : null;
                const company = normalizeCompany(source, tokenCompany);

                const permissions = source.permissions ?? source.permission_slugs ?? token.permissions;
                const roles = Array.isArray(source.roles)
                    ? source.roles.map((role: any) => ({
                        id: role?.id,
                        slug: role?.slug,
                    }))
                    : token.roles;

                token.accessToken = source.access_token ?? token.accessToken;
                token.id = source.id ?? token.id;
                token.email = source.email ?? token.email;
                token.email_verified_at = source.email_verified_at ?? token.email_verified_at;
                token.firstName = source.firstName ?? token.firstName;
                token.lastName = source.lastName ?? token.lastName;
                token.avatar = source.avatar ?? token.avatar;
                token.phone = source.phone ?? token.phone;

                token.company = company;

                token.country_code = source.country_code ?? token.country_code;
                token.website = source.website ?? token.website;
                token.role = source.role ?? token.role;
                token.role_slugs = source.role_slugs ?? token.role_slugs;
                token.roles = roles;
                token.permissions = permissions;
                token.permission_slugs = source.permission_slugs ?? token.permission_slugs;
                token.is_superuser = source.is_superuser ?? token.is_superuser;
                token.rating = source.rating ?? token.rating;
                token.reviewCount = source.reviewCount ?? token.reviewCount;
                token.status = source.status ?? token.status;
                token.last_login_at = source.last_login_at ?? token.last_login_at;
                token.last_active_at = source.last_active_at ?? token.last_active_at;
                token.timezone = source.timezone ?? token.timezone;
                token.created_at = source.created_at ?? token.created_at;
                token.updated_at = source.updated_at ?? token.updated_at;
                token.testVerified = source.testVerified ?? token.testVerified;
                token.callVerified = source.callVerified ?? token.callVerified;
                token.stripe_account_id = source.stripe_account_id ?? token.stripe_account_id;
                token.rapyd_wallet_id = source.rapyd_wallet_id ?? token.rapyd_wallet_id;
                token.rapyd_contact_id = source.rapyd_contact_id ?? token.rapyd_contact_id;
                token.is_online = source.is_online ?? token.is_online;
                token.last_seen = source.last_seen ?? token.last_seen;
                token.onesignal_player_id = source.onesignal_player_id ?? token.onesignal_player_id;
                token.language = source.language ?? token.language;
                token.location = source.location ?? token.location;
                token.profile_url = source.profile_url ?? token.profile_url;
                token.bio = source.bio ?? token.bio;
                token.github_token = source.github_token ?? token.github_token;
                token.github_refresh_token = source.github_refresh_token ?? token.github_refresh_token;
                token.github_nickname = source.github_nickname ?? token.github_nickname;
                token.user_permissions = source.user_permissions ?? token.user_permissions;
                token.oldest_work_experience = source.oldest_work_experience ?? token.oldest_work_experience;
                token.next_available_job = source.next_available_job ?? token.next_available_job;
            };

            if (user) {
                applyUser(user);
            }
            if (trigger === "update") {
                const updatedUser = session?.user ?? session;
                applyUser(updatedUser);
            }
            token.company = normalizeCompany(token, token.company);
            stripCompanyDuplicates(token);
            return token;
        },
        async session({ session, token }) {
            if (token) {
                const resolvedCompany = normalizeCompany(token, null);

                session.accessToken = token.accessToken;
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.email_verified_at = token.email_verified_at as string | null | undefined;
                session.user.firstName = token.firstName as string;
                session.user.lastName = token.lastName as string;
                session.user.avatar = token.avatar as string | null | undefined;
                session.user.phone = token.phone as string | null | undefined;
                session.user.company = resolvedCompany;
                session.user.country_code = token.country_code as string | null | undefined;
                session.user.website = token.website as string | null | undefined;
                session.user.role = token.role as string | null | undefined;
                session.user.role_slugs = token.role_slugs as string[] | undefined;
                session.user.roles = token.roles;
                session.user.permissions = token.permissions;
                session.user.permission_slugs = token.permission_slugs as string[] | undefined;
                session.user.is_superuser = token.is_superuser;
                session.user.rating = token.rating as string | number | undefined;
                session.user.reviewCount = token.reviewCount as number | undefined;
                session.user.status = token.status as string | undefined;
                session.user.last_login_at = token.last_login_at as string | null | undefined;
                session.user.last_active_at = token.last_active_at as string | null | undefined;
                session.user.timezone = token.timezone as string | null | undefined;
                session.user.created_at = token.created_at as string | undefined;
                session.user.updated_at = token.updated_at as string | undefined;
                session.user.testVerified = token.testVerified;
                session.user.callVerified = token.callVerified;
                session.user.stripe_account_id = token.stripe_account_id;
                session.user.rapyd_wallet_id = token.rapyd_wallet_id;
                session.user.rapyd_contact_id = token.rapyd_contact_id;
                session.user.is_online = token.is_online as boolean | undefined;
                session.user.last_seen = token.last_seen as string | null | undefined;
                session.user.onesignal_player_id = token.onesignal_player_id as string | null | undefined;
                session.user.language = token.language;
                session.user.location = token.location;
                session.user.bio = token.bio;
                session.user.profile_url = token.profile_url ?? undefined;
                session.user.github_token = token.github_token;
                session.user.github_refresh_token = token.github_refresh_token as string | null | undefined;
                session.user.github_nickname = token.github_nickname;
                session.user.user_permissions = token.user_permissions as Record<string, any> | any[] | undefined;
                session.user.oldest_work_experience = token.oldest_work_experience as string | null | undefined;
                session.user.next_available_job = token.next_available_job as string | null | undefined;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
});
