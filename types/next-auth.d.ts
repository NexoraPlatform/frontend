import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: string;
      isVerified: boolean;
    };
  }

  interface User {
    role: string;
    isVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    isVerified: boolean;
  }
}