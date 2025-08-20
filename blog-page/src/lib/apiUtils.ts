import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";

/**
 * Stellt sicher, dass die HTTP-Methode POST ist. Gibt true zurück, wenn die Methode falsch ist und die Antwort gesendet wurde.
 */
export function ensurePostMethod(req: NextApiRequest, res: NextApiResponse): boolean {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Nur POST erlaubt." });
    return true;
  }
  return false;
}

export async function getUserFromSession(req: NextApiRequest, res: NextApiResponse) {
  const session = (await getServerSession(req, res, authOptions)) as Session | null;
  return session?.user || null;
}
