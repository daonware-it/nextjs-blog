import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { Session } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions) as Session | null;
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: "Nicht eingeloggt" });
    }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      subscriptions: {
        where: { isActive: true },
        include: { plan: true },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!user) return res.status(404).json({ error: "User nicht gefunden" });

  let activeSub = user.subscriptions?.[0];
  let plan = activeSub?.plan;

  // Hole das aktuelle Plan-Objekt aus der Datenbank, falls ein aktiver Plan existiert
  if (activeSub?.planId) {
    const freshPlan = await prisma.subscriptionPlan.findUnique({ where: { id: activeSub.planId } });
    if (freshPlan) {
      plan = freshPlan;
    }
  }

  // Free-Plan suchen (planId=0 oder Name "Free")
  let freePlan = await prisma.subscriptionPlan.findFirst({
    where: { OR: [{ id: 0 }, { name: "Free" }] },
  });
  if (!freePlan) {
    freePlan = await prisma.subscriptionPlan.create({
      data: {
        id: 0,
        name: "Free",
        price: 0,
        includedRequests: 10,
      },
    });
  }

  const now = new Date();

  // Wenn keine aktive Subscription vorhanden ODER Ablaufdatum erreicht/überschritten
  if (!activeSub || (activeSub.expiresAt && new Date(activeSub.expiresAt) <= now)) {
    // Zuerst prüfen, ob bereits eine inaktive Subscription existiert
    const inactiveSub = await prisma.userSubscription.findFirst({
      where: { 
        userId: user.id,
        isActive: false
      },
      orderBy: { startedAt: "desc" },
      include: { plan: true }
    });
    
    // Falls eine inaktive Subscription vorhanden ist, diese verwenden
    if (inactiveSub) {
      activeSub = inactiveSub;
      plan = inactiveSub.plan;
    } else {
      // Falls keine Subscription existiert, eine neue erstellen
      const expires = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
      activeSub = await prisma.userSubscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          startedAt: now,
          expiresAt: expires,
          isActive: true,
          includedRequests: freePlan.includedRequests,
        },
        include: { plan: true },
      });
      plan = activeSub.plan;
    }
  }

  // Rückgabe: aktueller Wert aus aktiver Subscription, nicht aus dem Plan!
  if (!activeSub || !plan) {
    return res.status(200).json({ plan: { name: "Free", includedRequests: 10, price: 0, planIncludedRequests: freePlan.includedRequests } });
  }
  
  // Bei der Rückgabe auch den isActive-Status mit übergeben
  return res.status(200).json({
    plan: {
      name: plan.name,
      price: plan.price,
      includedRequests: activeSub.includedRequests ?? plan.includedRequests, // aktuelles Guthaben
      planIncludedRequests: plan.includedRequests, // Limit aus SubscriptionPlan
      isActive: activeSub.isActive // Status des Abonnements
    },
  });
  } catch (error) {
    console.error('Fehler beim Abrufen des Plans:', error);
    return res.status(500).json({ 
      error: 'Serverfehler beim Abrufen des Plans',
      plan: { 
        name: "Free", 
        includedRequests: 10, 
        price: 0, 
        planIncludedRequests: 10,
        isActive: true 
      } 
    });
  }
}
