if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET muss als Umgebungsvariable gesetzt sein!");
}
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rateLimit: Record<string, { count: number; last: number }> = {};
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text", optional: true },
      },
      async authorize(credentials: Record<"email" | "password" | "twoFactorCode", string> | undefined, req) {
        try {
          const ip = typeof req.headers["x-forwarded-for"] === "string"
            ? req.headers["x-forwarded-for"]
            : Array.isArray(req.headers["x-forwarded-for"])
              ? req.headers["x-forwarded-for"][0]
              : "unknown";
          const now = Date.now();
          if (!rateLimit[ip]) rateLimit[ip] = { count: 0, last: now };
          if (now - rateLimit[ip].last > WINDOW_MS) {
            rateLimit[ip] = { count: 0, last: now };
          }
          rateLimit[ip].count++;
          if (rateLimit[ip].count > MAX_ATTEMPTS) {
            throw new Error("Zu viele Login-Versuche. Bitte warte kurz.");
          }
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Login fehlgeschlagen.");
          }
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          
          if (!user) {
            throw new Error("Login fehlgeschlagen.");
          }

          const userStatus = await prisma.$queryRaw`SELECT status FROM "User" WHERE id = ${Number(user.id)}`;
          if (userStatus && Array.isArray(userStatus) && userStatus.length > 0 && userStatus[0].status === 'BANNED') {
            throw new Error("Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Support.");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Login fehlgeschlagen.");
          }
          
          if (user.twoFactorEnabled) {
            const code = credentials.twoFactorCode;
            if (!code) {
              throw new Error("2FA erforderlich");
            }
            const speakeasy = require("speakeasy");
            const verified = speakeasy.totp.verify({
              secret: user.twoFactorSecret,
              encoding: "base32",
              token: code,
              window: 1,
            });
            if (!verified) {
              throw new Error("Ungültiger 2FA-Code");
            }
          }
          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            createdAt: user.createdAt,
          };
        } catch (error) {
          console.error("Fehler bei der Authentifizierung:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' ? true : false,
      },
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
        (session.user as any).username = token.username;
        (session.user as any).createdAt = token.createdAt;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
        token.username = (user as any).username;
        token.createdAt = (user as any).createdAt;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};
export default NextAuth(authOptions);
