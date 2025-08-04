import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt." });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Nicht authentifiziert." });
  }

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Bitte alle Felder ausfüllen." });
  }

  // Passwort-Komplexitätsprüfung
  const passwordRequirements = [
    { regex: /.{8,}/, message: "mindestens 8 Zeichen" },
    { regex: /[A-Z]/, message: "mindestens einen Großbuchstaben" },
    { regex: /[a-z]/, message: "mindestens einen Kleinbuchstaben" },
    { regex: /[0-9]/, message: "mindestens eine Zahl" },
    { regex: /[^A-Za-z0-9]/, message: "mindestens ein Sonderzeichen" },
  ];
  const failed = passwordRequirements.filter(req => !req.regex.test(newPassword));
  if (failed.length > 0) {
    return res.status(400).json({ error: `Das neue Passwort muss ${failed.map(f => f.message).join(", ")} enthalten.` });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || !user.password) {
      return res.status(404).json({ error: "Benutzer nicht gefunden." });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Altes Passwort ist falsch." });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashed },
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Serverfehler." });
  }
}
