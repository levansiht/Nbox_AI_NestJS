import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // Seed roles
  let adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN' },
  });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrator role with full permissions',
      },
    });
  }

  let userRole = await prisma.role.findFirst({
    where: { name: 'USER' },
  });
  if (!userRole) {
    userRole = await prisma.role.create({
      data: {
        name: 'USER',
        description: 'Default user role',
      },
    });
  }

  console.log('Seeded roles:', { adminRole, userRole });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
