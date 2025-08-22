import NextAuth, { AuthOptions, SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import { decrypt } from "../../../lib/encryptionUtils";
import { verifyRecoveryCode, useRecoveryCode } from "../../../lib/recoveryCodeUtils";
import { sendRecoveryCodeNotification } from "../../../lib/emailUtils";
import { createAuditLog } from "../../../lib/auditLogUtils";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "text" },
        password: { label: "Passwort", type: "password" },
        twoFACode: { label: "2FA Code", type: "text", optional: true },
      },
      async authorize(credentials) {
        // Nutzer anhand E-Mail suchen
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) {
          throw new Error("E-Mail nicht gefunden");
        }
        // Passwort prüfen (bcrypt)
        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!passwordValid) {
          throw new Error("Falsches Passwort");
        }
        // 2FA prüfen, falls aktiviert
        if (user.twoFactorEnabled) {
          if (!credentials.twoFACode) {
            // Spezieller Fehler, damit das Frontend das 2FA-Popup öffnet
            const error = new Error("2FA_REQUIRED");
            // @ts-ignore
            error.code = "2FA_REQUIRED";
            throw error;
          }
          // Recovery-Code prüfen (Bindestrich als Indikator)
          if (credentials.twoFACode.includes("-")) {
            const isValidRecovery = verifyRecoveryCode(credentials.twoFACode, user.twoFactorRecoveryCodes);
            if (!isValidRecovery) {
              throw new Error("Ungültiger Recovery-Code");
            }
            // Recovery-Code entfernen
            const updatedCodes = useRecoveryCode(credentials.twoFACode, user.twoFactorRecoveryCodes);
            await prisma.user.update({
              where: { id: user.id },
              data: { twoFactorRecoveryCodes: updatedCodes },
            });

            // E-Mail-Benachrichtigung über die Verwendung des Recovery-Codes senden
            try {
              await sendRecoveryCodeNotification({
                to: user.email,
                username: user.username || user.email,
                code: credentials.twoFACode
              });
            } catch (mailError) {
              console.error('Fehler beim Versand der Recovery-Code-E-Mail:', mailError);
              // Anmeldung trotzdem fortsetzen, auch wenn die E-Mail nicht gesendet werden konnte
            }

            // Audit-Log-Eintrag erstellen
            try {
              await createAuditLog({
                userId: user.id,
                action: 'RECOVERY_CODE_USED',
                details: `Recovery-Code verwendet: ${credentials.twoFACode}`
              });
            } catch (auditError) {
              console.error('Fehler beim Erstellen des Audit-Logs:', auditError);
              // Anmeldung trotzdem fortsetzen, auch wenn das Audit-Log nicht erstellt werden konnte
            }
          } else {
            // Secret entschlüsseln
            const decryptedSecret = decrypt(user.twoFactorSecret);
            // TOTP-Validierung mit speakeasy
            const verified = speakeasy.totp.verify({
              secret: decryptedSecret,
              encoding: "base32",
              token: credentials.twoFACode,
              window: 2, // toleriert kleine Zeitabweichungen
            });
            if (!verified) {
              throw new Error("Ungültiger 2FA-Code");
            }
          }
        }
        // Gebannt?
        if (user.status === "banned") {
          throw new Error("Nutzer ist gebannt");
        }
        // Rückgabe aller relevanten Felder
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt ? user.createdAt.toISOString() : null,
          permissions: user.permissions,
          status: user.status,
          isVerified: user.isVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login", // Fehler werden als ?error=... weitergegeben
  },
  session: { strategy: "jwt" as SessionStrategy },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.id as string | number;
      session.user.email = token.email as string;
      session.user.username = token.username as string;
      session.user.name = token.name as string;
      session.user.role = token.role as string;
      session.user.createdAt = token.createdAt as string;
      session.user.permissions = token.permissions as string[];
      session.user.status = token.status as string;
      session.user.isVerified = token.isVerified as boolean;
      session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.name = user.name;
        token.role = user.role;
        token.createdAt = user.createdAt;
        token.permissions = user.permissions;
        token.status = user.status;
        token.isVerified = user.isVerified;
        token.twoFactorEnabled = user.twoFactorEnabled;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
