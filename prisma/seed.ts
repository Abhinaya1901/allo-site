import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const mumbai = await prisma.warehouse.create({ data: { name: "Mumbai DC", city: "Mumbai" } });
  const bangalore = await prisma.warehouse.create({ data: { name: "Bangalore DC", city: "Bangalore" } });

  const tee = await prisma.product.create({ data: { sku: "TSHIRT-001", name: "Allo Classic Tee", priceCents: 79900 } });
  const mug = await prisma.product.create({ data: { sku: "MUG-001", name: "Allo Mug", priceCents: 29900 } });
  const bag = await prisma.product.create({ data: { sku: "BAG-001", name: "Allo Tote Bag", priceCents: 119900 } });

  await prisma.stock.createMany({
    data: [
      { productId: tee.id, warehouseId: mumbai.id, totalUnits: 10, reservedUnits: 0 },
      { productId: tee.id, warehouseId: bangalore.id, totalUnits: 5, reservedUnits: 0 },
      { productId: mug.id, warehouseId: mumbai.id, totalUnits: 25, reservedUnits: 0 },
      { productId: bag.id, warehouseId: mumbai.id, totalUnits: 1, reservedUnits: 0 },
      { productId: bag.id, warehouseId: bangalore.id, totalUnits: 3, reservedUnits: 0 },
    ],
  });
  console.log("Seeded successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
