import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";

export async function requireAuthWithRoles(req: NextApiRequest, res: NextApiResponse, allowedRoles: string[]) {
  // next-auth erwartet req und res für API-Routes
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
    return null;
  }
  return session.user;
}
