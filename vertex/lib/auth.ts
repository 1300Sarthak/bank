import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hashSync } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;

        // Support both APP_PASSWORD (plain) and APP_PASSWORD_HASH (bcrypt)
        const plain = process.env.APP_PASSWORD;
        const hash = process.env.APP_PASSWORD_HASH;

        let valid = false;
        if (plain) {
          valid = credentials.password === plain;
        } else if (hash) {
          valid = await compare(credentials.password, hash);
        } else {
          return null;
        }

        if (!valid) return null;

        return { id: "1", name: "Admin" };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name;
      }
      return session;
    },
  },
};
