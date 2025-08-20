import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { Session } from "next-auth";

export async function requireAuthWithRoles(req: NextApiRequest, res: NextApiResponse, allowedRoles: string[]) {
  // next-auth erwartet req und res für API-Routes
  const session = await getServerSession(req, res, authOptions) as Session | null;
  if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
    return null;
  }
  return session.user;
}
