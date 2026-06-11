"use client";

import { daysUntilEvent, formatEventDate } from "@/lib/dates";
import type { EventWithRelations } from "@/lib/types";

interface UpcomingEventsProps {
  events: EventWithRelations[];
  onSelectEvent: (event: EventWithRelations) => void;
}

export function UpcomingEvents({ events, onSelectEvent }: UpcomingEventsProps) {
  const upcoming = events
    .map((event) => ({
      event,
      daysUntil: daysUntilEvent(new Date(event.date), event.isAnnual),
    }))
    .filter((item) => item.daysUntil >= 0 && item.daysUntil <= 30)
    .sort((left, right) => left.daysUntil - right.daysUntil);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Upcoming</h2>
      <p className="mb-4 text-sm text-zinc-500">Next 30 days</p>

      {upcoming.length === 0 ? (
        <p className="text-sm text-zinc-500">No upcoming events yet. Add one in the conversation panel.</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map(({ event, daysUntil }) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectEvent(event)}
              className="flex w-full items-start justify-between rounded-xl border border-zinc-100 px-4 py-3 text-left transition hover:bg-zinc-50"
            >
              <div>
                <p className="font-medium text-zinc-900">{event.title}</p>
                <p className="text-sm text-zinc-600">
                  {formatEventDate(new Date(event.date), event.isAnnual)}
                </p>
                {event.person?.preferences?.length ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    {event.person.preferences
                      .slice(0, 2)
                      .map((preference) => preference.value)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {daysUntil === 0 ? "Today" : `${daysUntil}d`}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
