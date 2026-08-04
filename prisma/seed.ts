import { PrismaClient, Role, CategoryType, TableStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const password = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@restaurant.com',
      password,
      role: Role.ADMIN,
    },
  });

  const waiterPassword = await bcrypt.hash('Waiter@123', 10);
  const waiter = await prisma.user.upsert({
    where: { email: 'waiter@restaurant.com' },
    update: {},
    create: {
      name: 'Carlos Garçom',
      email: 'waiter@restaurant.com',
      password: waiterPassword,
      role: Role.WAITER,
    },
  });

  const kitchenPassword = await bcrypt.hash('Kitchen@123', 10);
  const kitchen = await prisma.user.upsert({
    where: { email: 'kitchen@restaurant.com' },
    update: {},
    create: {
      name: 'Ana Cozinha',
      email: 'kitchen@restaurant.com',
      password: kitchenPassword,
      role: Role.KITCHEN,
    },
  });

  const cashierPassword = await bcrypt.hash('Cashier@123', 10);
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@restaurant.com' },
    update: {},
    create: {
      name: 'Maria Caixa',
      email: 'cashier@restaurant.com',
      password: cashierPassword,
      role: Role.CASHIER,
    },
  });

  const tablesData = [
    { number: 1, capacity: 2 },
    { number: 2, capacity: 4 },
    { number: 3, capacity: 4 },
    { number: 4, capacity: 6 },
    { number: 5, capacity: 8 },
  ];

  for (const table of tablesData) {
    await prisma.table.upsert({
      where: { number: table.number },
      update: {},
      create: {
        number: table.number,
        capacity: table.capacity,
        status: TableStatus.FREE,
      },
    });
  }

  let starters = await prisma.category.findFirst({
    where: { name: 'Entradas' },
  });
  if (!starters) {
    starters = await prisma.category.create({
      data: { name: 'Entradas', type: CategoryType.STARTER },
    });
  }

  let mains = await prisma.category.findFirst({
    where: { name: 'Pratos Principais' },
  });
  if (!mains) {
    mains = await prisma.category.create({
      data: { name: 'Pratos Principais', type: CategoryType.MAIN_COURSE },
    });
  }

  let drinks = await prisma.category.findFirst({
    where: { name: 'Bebidas' },
  });
  if (!drinks) {
    drinks = await prisma.category.create({
      data: { name: 'Bebidas', type: CategoryType.DRINK },
    });
  }

  const menuCount = await prisma.menuItem.count();
  if (menuCount === 0) {
    await prisma.menuItem.createMany({
      data: [
        {
          name: 'Bruschetta',
          description: 'Pão italiano com tomate e manjericão',
          price: 28.9,
          preparationTime: 10,
          categoryId: starters.id,
        },
        {
          name: 'Salada Caesar',
          description: 'Alface, croutons, parmesão e molho caesar',
          price: 32.0,
          preparationTime: 12,
          categoryId: starters.id,
        },
        {
          name: 'Filé Mignon',
          description: 'Filé grelhado com molho madeira e purê',
          price: 89.9,
          preparationTime: 30,
          categoryId: mains.id,
        },
        {
          name: 'Risoto de Camarão',
          description: 'Arroz arbóreo com camarões frescos',
          price: 78.5,
          preparationTime: 25,
          categoryId: mains.id,
        },
        {
          name: 'Suco Natural',
          description: 'Laranja, limão ou abacaxi',
          price: 12.0,
          preparationTime: 5,
          categoryId: drinks.id,
        },
        {
          name: 'Refrigerante',
          description: 'Lata 350ml',
          price: 8.0,
          preparationTime: 2,
          categoryId: drinks.id,
        },
      ],
    });
  }

  console.log('✅ Seed completed');
  console.log('Default users:');
  console.log(`  ADMIN   -> ${admin.email} / Admin@123`);
  console.log(`  WAITER  -> ${waiter.email} / Waiter@123`);
  console.log(`  KITCHEN -> ${kitchen.email} / Kitchen@123`);
  console.log(`  CASHIER -> ${cashier.email} / Cashier@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
