import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isEduEmail } from "@/lib/eduValidation";
import { z } from "zod";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      
      if (isAdminRoute) {
        if (isLoggedIn) {
          // If they're somehow not an admin role trying to access /admin, we can redirect or let page handle
          return true; 
        }
        return false; // Redirect unauthenticated users to login page
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Campus Email", type: "email", placeholder: "you@university.edu" },
        password: { label: "Password", type: "password" }, // Simulating password for now
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email() })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email } = parsedCredentials.data;
          if (isEduEmail(email)) {
            // Simulated user fetch
            return {
              id: email, // use email as ID for mock
              email: email,
              role: email.includes("admin") ? "admin" : "user",
            };
          }
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
