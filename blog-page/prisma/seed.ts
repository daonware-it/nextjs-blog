import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: 'Free',
        includedRequests: 10,
        price: 0,
        extraPricePerThousand: null,
        description: 'Test & gelegentliche Nutzung',
      },
      {
        name: 'Starter',
        includedRequests: 100,
        price: 5,
        extraPricePerThousand: 1.5,
        description: 'Gelegenheitsnutzer',
      },
      {
        name: 'Pro',
        includedRequests: 500,
        price: 15,
        extraPricePerThousand: 1.0,
        description: 'Vielschreiber, kleine Teams',
      },
      {
        name: 'Business',
        includedRequests: 3000,
        price: 50,
        extraPricePerThousand: 0.75,
        description: 'Große Teams, Agenturen',
      },
      {
        name: 'Enterprise',
        includedRequests: 0,
        price: 0,
        extraPricePerThousand: null,
        description: 'Sehr große Nutzer, maßgeschneidert',
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
