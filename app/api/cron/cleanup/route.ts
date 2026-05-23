import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const expired = await prisma.reservation.findMany({
    where: { status: "pending", expiresAt: { lt: now } },
    select: { id: true, stockId: true, quantity: true },
  });
  let released = 0;
  for (const r of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        const current = await tx.reservation.findUnique({ where: { id: r.id }, select: { status: true } });
        if (current?.status !== "pending") return;
        await tx.stock.update({ where: { id: r.stockId }, data: { reservedUnits: { decrement: r.quantity } } });
        await tx.reservation.update({ where: { id: r.id }, data: { status: "released" } });
        released++;
      });
    } catch (e) { console.error("cleanup failed", r.id, e); }
  }
  return NextResponse.json({ checked: expired.length, released });
}
