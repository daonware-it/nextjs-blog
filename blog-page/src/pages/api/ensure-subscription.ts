import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // Prüfen, ob bereits ein UserSubscription-Eintrag existiert
  let subscription = await prisma.userSubscription.findFirst({
    where: { userId: Number(userId) },
  });

  // Wenn ein gesperrter Eintrag existiert, KEINEN neuen anlegen
  if (subscription && (subscription.tokensBlocked === true || subscription.isActive === false)) {
    return res.status(200).json({ subscription, info: "blocked" });
  }

  if (!subscription) {
    // Hole das Standard-Plan-Objekt (z.B. Free-Plan)
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      orderBy: { id: "asc" },
    });
    subscription = await prisma.userSubscription.create({
      data: {
        userId: Number(userId),
        planId: defaultPlan?.id ?? 1,
        isActive: true,
        includedRequests: defaultPlan?.includedRequests ?? 10,
      },
    });
  }

  return res.status(200).json({ subscription });
}
