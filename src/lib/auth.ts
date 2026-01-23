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
        // @ts-ignore
        token.sokazId = user.sokazId;
        // @ts-ignore
        token.sokazTeam = user.sokazTeam;
        // @ts-ignore
        token.sokazStats = user.sokazStats;
        // @ts-ignore
        token.sokazLiga = user.sokazLiga;
      } else if (token.id) {
        // Fetch latest role from DB if not in login flow
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, phoneNumber: true, sokazId: true, sokazTeam: true, sokazStats: true, sokazLiga: true }
        });
        if (dbUser) {
          // @ts-ignore
          token.role = dbUser.role;
          // @ts-ignore
          token.phoneNumber = dbUser.phoneNumber;
          // @ts-ignore
          token.sokazId = dbUser.sokazId;
          // @ts-ignore
          token.sokazTeam = dbUser.sokazTeam;
          // @ts-ignore
          token.sokazStats = dbUser.sokazStats;
          // @ts-ignore
          token.sokazLiga = dbUser.sokazLiga;
        }
      }

      if (trigger === "update" && session?.phoneNumber) {
        token.phoneNumber = session.phoneNumber;
      }

      // Always refresh teamId from DB to ensure instant updates after linking
      if (token.id) {
        const userTeam = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { teamId: true }
        });
        // @ts-ignore
        token.teamId = userTeam?.teamId;
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
        // @ts-ignore
        session.user.sokazId = token.sokazId;
        // @ts-ignore
        session.user.sokazTeam = token.sokazTeam;
        // @ts-ignore
        session.user.sokazStats = token.sokazStats;
        // @ts-ignore
        session.user.sokazLiga = token.sokazLiga;
        // @ts-ignore
        session.user.teamId = token.teamId;
      }
      return session;
    },
  },
};
