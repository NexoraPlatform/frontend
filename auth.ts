
import NextAuth, { User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
        async jwt({ token, user }) {
            // First login
            if (user) {
                token.accessToken = user.access_token;
                token.id = user.id;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.roles = user.roles;
                token.permissions = user.permissions;
                token.is_superuser = user.is_superuser;
                token.testVerified = user.testVerified;
                token.callVerified = user.callVerified;
                token.stripe_account_id = user.stripe_account_id;
                token.language = user.language;
                token.location = user.location;
                token.avatar = user.avatar;
                token.bio = user.bio;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.accessToken = token.accessToken;
                session.user.id = token.id as string;
                session.user.firstName = token.firstName as string;
                session.user.lastName = token.lastName as string;
                session.user.roles = token.roles;
                session.user.permissions = token.permissions;
                session.user.is_superuser = token.is_superuser;
                session.user.testVerified = token.testVerified;
                session.user.callVerified = token.callVerified;
                session.user.stripe_account_id = token.stripe_account_id;
                session.user.language = token.language;
                session.user.location = token.location;
                session.user.avatar = token.avatar;
                session.user.bio = token.bio;
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
