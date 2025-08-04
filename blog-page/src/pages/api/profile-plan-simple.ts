import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    let defaultPlan: {
      name: string;
      includedRequests: number;
      price: number;
      planIncludedRequests: number;
      isActive: boolean;
      usage: {
        available: number;
        total: number;
        used: number;
      };
    };

    try {
      const freePlan = await prisma.subscriptionPlan.findFirst({
        where: { name: "Free" }
      });
      
      if (freePlan) {
        defaultPlan = {
          name: freePlan.name,
          includedRequests: 0,
          price: freePlan.price,
          planIncludedRequests: freePlan.includedRequests,
          isActive: true,
          usage: {
            available: 0,
            total: freePlan.includedRequests || 0,
            used: freePlan.includedRequests || 0
          }
        };
      } else {
        defaultPlan = {
          name: "Free",
          includedRequests: 0,
          price: 0,
          planIncludedRequests: 0,
          isActive: true,
          usage: {
            available: 0,
            total: 0,
            used: 0
          }
        };
      }
    } catch (dbError) {
      console.error("Fehler beim Abrufen des Standard-Plans:", dbError);
      defaultPlan = {
        name: "Free",
        includedRequests: 0,
        price: 0,
        planIncludedRequests: 0,
        isActive: true,
        usage: {
          available: 0,
          total: 0,
          used: 0
        }
      };
    }

    const email = (session.user as any).email;
    if (!email) {
      return res.status(200).json({ plan: defaultPlan });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: { plan: true }
        }
      }
    });

    if (!user || !user.subscriptions || user.subscriptions.length === 0) {
      return res.status(200).json({ plan: defaultPlan });
    }

    // subscriptions ist durch Prisma immer ein Array, aber eventuell undefined/null
    const activeSub = user.subscriptions && user.subscriptions.length > 0 ? user.subscriptions[0] : null;
    const plan = activeSub?.plan;

    if (!activeSub || typeof activeSub !== 'object' || !plan || typeof plan !== 'object') {
      return res.status(200).json({ plan: defaultPlan });
    }

    const usedRequests = await prisma.aiRequest.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: activeSub.startedAt,
          ...(activeSub.expiresAt ? { lte: activeSub.expiresAt } : {})
        }
      }
    });

    // Immer den individuellen Wert aus der Datenbank nehmen, auch wenn 0
    const totalRequests = (activeSub.includedRequests !== null && activeSub.includedRequests !== undefined)
      ? activeSub.includedRequests
      : plan.includedRequests;
    const availableRequests = Math.max(0, totalRequests - usedRequests);

    return res.status(200).json({
      plan: {
        name: plan.name,
        price: plan.price,
        includedRequests: activeSub.includedRequests, // <-- Individueller Kontostand des Nutzers
        planIncludedRequests: plan.includedRequests, // <-- Plan-Standardwert
        isActive: activeSub.isActive,
        usage: {
          available: availableRequests,
          total: totalRequests,
          used: usedRequests
        }
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Plans:', error);
    
    try {
      const freePlan = await prisma.subscriptionPlan.findFirst({
        where: { name: "Free" }
      });
      
      if (freePlan) {
        return res.status(200).json({
          plan: {
            name: freePlan.name,
            includedRequests: freePlan.includedRequests,
            price: freePlan.price,
            planIncludedRequests: freePlan.includedRequests,
            isActive: true,
            usage: {
              available: 0,
              total: freePlan.includedRequests || 0,
              used: freePlan.includedRequests || 0
            }
          }
        });
      }
    } catch (dbError) {
      console.error("Fehler beim Abrufen des Standard-Plans im Fehlerfall:", dbError);
    }

    return res.status(200).json({
      plan: {
        name: "Free",
        includedRequests: 0,
        price: 0,
        planIncludedRequests: 0,
        isActive: true,
        usage: {
          available: 0,
          total: 0,
          used: 0
        }
      }
    });
  }
}
