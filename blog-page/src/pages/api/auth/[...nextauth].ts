import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const authOptions: any = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
        twoFactorCode: { label: "2FA-Code", type: "text" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        // Passwort prüfen (hier nur Beispiel, sichere Hash-Prüfung nötig!)
        if (user.password !== credentials.password) return null;
        // 2FA prüfen, falls aktiviert
        if (user.twoFactorEnabled) {
          if (!credentials.twoFactorCode) {
            // 2FA erforderlich, aber kein Code eingegeben
            return null;
          }
          if (!user.twoFactorSecret) return null;
          // Beispiel: Recovery-Codes prüfen
          if (Array.isArray(user.recoveryCodes) && user.recoveryCodes.includes(credentials.twoFactorCode)) {
            // Recovery-Code entfernen
            await prisma.user.update({
              where: { id: user.id },
              data: { recoveryCodes: user.recoveryCodes.filter((c: string) => c !== credentials.twoFactorCode) },
            });
            return { ...user, id: String(user.id) };
          }
          // TOTP/2FA-Code prüfen (z.B. mit speakeasy)
          // Hier kann z.B. speakeasy.totp.verify verwendet werden
          // if (!verify2FACode(user.twoFactorSecret, credentials.twoFactorCode)) return null;
        }
        return { ...user, id: String(user.id) };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
