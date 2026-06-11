import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseIsoDate } from "@/lib/dates";
import { serializeEvent } from "@/lib/events";
import { stringifyRemindDays } from "@/lib/utils";

export async function GET() {
  const events = await prisma.event.findMany({
    include: {
      person: {
        include: {
          preferences: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    events: await Promise.all(events.map((event) => serializeEvent(event))),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    eventType?: string;
    date?: string;
    personId?: string | null;
    isAnnual?: boolean;
    remindDays?: number[];
    rawInput?: string;
  };

  if (!body.title || !body.eventType || !body.date) {
    return NextResponse.json(
      { error: "title, eventType, and date are required" },
      { status: 400 },
    );
  }

  const event = await prisma.event.create({
    data: {
      title: body.title,
      eventType: body.eventType,
      date: parseIsoDate(body.date),
      personId: body.personId ?? null,
      isAnnual: body.isAnnual ?? true,
      remindDays: stringifyRemindDays(body.remindDays ?? [30, 7, 1]),
      rawInput: body.rawInput ?? null,
    },
    include: {
      person: {
        include: {
          preferences: true,
        },
      },
    },
  });

  return NextResponse.json({ event: await serializeEvent(event) });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    title?: string;
    eventType?: string;
    date?: string;
    isAnnual?: boolean;
    remindDays?: number[];
  };

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id: body.id },
    data: {
      title: body.title,
      eventType: body.eventType,
      date: body.date ? parseIsoDate(body.date) : undefined,
      isAnnual: body.isAnnual,
      remindDays: body.remindDays ? stringifyRemindDays(body.remindDays) : undefined,
    },
    include: {
      person: {
        include: {
          preferences: true,
        },
      },
    },
  });

  return NextResponse.json({ event: await serializeEvent(event) });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
