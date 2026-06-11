import { startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { daysUntilEvent, formatEventDate, getNextOccurrence } from "@/lib/dates";
import { generateGiftRecommendationsWithLLM } from "@/lib/gifts/recommend";
import type { ReminderPayload } from "@/lib/types";
import { parseRemindDays } from "@/lib/utils";

export async function checkAndCreateReminders(referenceDate = new Date()): Promise<number> {
  const events = await prisma.event.findMany({
    include: {
      person: {
        include: {
          preferences: true,
        },
      },
    },
  });

  let createdCount = 0;
  const today = startOfDay(referenceDate);

  for (const event of events) {
    const remindDays = parseRemindDays(event.remindDays);
    const daysUntil = daysUntilEvent(event.date, event.isAnnual, today);

    if (!remindDays.includes(daysUntil)) {
      continue;
    }

    const existing = await prisma.reminder.findFirst({
      where: {
        eventId: event.id,
        daysBefore: daysUntil,
        remindOn: today,
      },
    });

    if (existing) {
      continue;
    }

    const nextDate = event.isAnnual
      ? getNextOccurrence(event.date, today)
      : startOfDay(event.date);
    const personName = event.person?.name ?? null;
    const message = `${event.title} is coming up on ${formatEventDate(nextDate, event.isAnnual)} (${daysUntil} day${daysUntil === 1 ? "" : "s"} away).`;

    const giftIdeas = await generateGiftRecommendationsWithLLM({
      personName,
      eventType: event.eventType,
      eventTitle: event.title,
      preferences:
        event.person?.preferences.map((preference) => ({
          category: preference.category,
          value: preference.value,
        })) ?? [],
    });

    await prisma.reminder.create({
      data: {
        eventId: event.id,
        remindOn: today,
        daysBefore: daysUntil,
        message,
        giftIdeas: JSON.stringify(giftIdeas),
      },
    });

    createdCount += 1;
  }

  return createdCount;
}

export async function getActiveReminders(): Promise<ReminderPayload[]> {
  const reminders = await prisma.reminder.findMany({
    where: { dismissed: false },
    include: {
      event: {
        include: {
          person: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reminders.map((reminder) => ({
    id: reminder.id,
    eventId: reminder.eventId,
    title: reminder.event.title,
    personName: reminder.event.person?.name ?? null,
    eventType: reminder.event.eventType,
    eventDate: reminder.event.date.toISOString(),
    daysBefore: reminder.daysBefore,
    message: reminder.message,
    giftIdeas: reminder.giftIdeas ? JSON.parse(reminder.giftIdeas) : [],
    dismissed: reminder.dismissed,
    createdAt: reminder.createdAt.toISOString(),
  }));
}

export async function dismissReminder(id: string): Promise<void> {
  await prisma.reminder.update({
    where: { id },
    data: { dismissed: true },
  });
}

export function getUpcomingEvents<
  T extends {
    id: string;
    title: string;
    eventType: string;
    date: Date;
    isAnnual: boolean;
    person: { name: string; preferences: Array<{ category: string; value: string }> } | null;
  },
>(events: T[], daysAhead = 30, referenceDate = new Date()) {
  return events
    .map((event) => ({
      ...event,
      daysUntil: daysUntilEvent(event.date, event.isAnnual, referenceDate),
      nextDate: event.isAnnual
        ? getNextOccurrence(event.date, referenceDate)
        : startOfDay(event.date),
    }))
    .filter((event) => event.daysUntil >= 0 && event.daysUntil <= daysAhead)
    .sort((left, right) => left.daysUntil - right.daysUntil);
}
