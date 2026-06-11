import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const people = await prisma.person.findMany({
    include: {
      preferences: true,
      events: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ people });
}
