import { prisma } from "@/lib/db";
import { parseIsoDate } from "@/lib/dates";
import type { SaveExtractionPayload } from "@/lib/types";
import { stringifyRemindDays } from "@/lib/utils";

export async function saveExtraction(payload: SaveExtractionPayload) {
  let personId = payload.person?.existingId ?? null;

  if (payload.person) {
    if (personId) {
      await prisma.person.update({
        where: { id: personId },
        data: {
          notes: payload.rawInput,
        },
      });
    } else {
      const created = await prisma.person.create({
        data: {
          name: payload.person.name,
          notes: payload.rawInput,
        },
      });
      personId = created.id;
    }
  }

  if (personId && payload.preferences.length > 0) {
    for (const preference of payload.preferences) {
      const existing = await prisma.preference.findFirst({
        where: {
          personId,
          category: preference.category,
          value: preference.value,
        },
      });

      if (!existing) {
        await prisma.preference.create({
          data: {
            personId,
            category: preference.category,
            value: preference.value,
            source: payload.rawInput,
          },
        });
      }
    }
  }

  let event = null;
  if (payload.event) {
    event = await prisma.event.create({
      data: {
        personId,
        title: payload.event.title,
        eventType: payload.event.type,
        date: parseIsoDate(payload.event.date),
        isAnnual: payload.event.isAnnual,
        remindDays: stringifyRemindDays([30, 7, 1]),
        rawInput: payload.rawInput,
      },
      include: {
        person: {
          include: {
            preferences: true,
          },
        },
      },
    });
  }

  return { personId, event };
}

export async function serializeEvent(
  event: Awaited<ReturnType<typeof prisma.event.findMany>>[number] & {
    person?: {
      id: string;
      name: string;
      notes: string | null;
      preferences: Array<{
        id: string;
        category: string;
        value: string;
        source: string | null;
      }>;
    } | null;
  },
) {
  const { parseRemindDays } = await import("@/lib/utils");

  return {
    id: event.id,
    title: event.title,
    eventType: event.eventType,
    date: event.date.toISOString(),
    isAnnual: event.isAnnual,
    remindDays: parseRemindDays(event.remindDays),
    rawInput: event.rawInput,
    person: event.person
      ? {
          id: event.person.id,
          name: event.person.name,
          notes: event.person.notes,
          preferences: event.person.preferences,
        }
      : null,
  };
}
