import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { stocks: { include: { warehouse: true } } },
    orderBy: { name: "asc" },
  });

  const shaped = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceCents: p.priceCents,
    stocks: p.stocks.map((s) => ({
      stockId: s.id,
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      available: s.totalUnits - s.reservedUnits,
    })),
  }));

  return NextResponse.json(shaped);
}
