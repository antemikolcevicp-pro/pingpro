import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // @ts-ignore
        token.role = user.role;
        token.id = user.id;
        // @ts-ignore
        token.phoneNumber = user.phoneNumber;
      } else if (token.id) {
        // Fetch latest role from DB if not in login flow
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, phoneNumber: true }
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.phoneNumber = dbUser.phoneNumber;
        }
      }

      if (trigger === "update" && session?.phoneNumber) {
        token.phoneNumber = session.phoneNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.role = token.role;
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore
        session.user.phoneNumber = token.phoneNumber;
      }
      return session;
    },
  },
};
