"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { getOccurrenceInMonth } from "@/lib/dates";
import type { EventWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  events: EventWithRelations[];
  onSelectEvent: (event: EventWithRelations) => void;
}

const EVENT_COLORS: Record<string, string> = {
  birthday: "bg-rose-100 text-rose-700 border-rose-200",
  anniversary: "bg-violet-100 text-violet-700 border-violet-200",
  custom: "bg-sky-100 text-sky-700 border-sky-200",
};

export function CalendarView({ events, onSelectEvent }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventWithRelations[]>();

    for (const day of calendarDays) {
      const dayEvents = events.filter((event) => {
        const occurrence = getOccurrenceInMonth(
          new Date(event.date),
          day,
          event.isAnnual,
        );
        return occurrence ? isSameDay(occurrence, day) : false;
      });

      if (dayEvents.length > 0) {
        map.set(format(day, "yyyy-MM-dd"), dayEvents);
      }
    }

    return map;
  }, [calendarDays, events]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Calendar</h2>
          <p className="text-sm text-zinc-500">{format(currentMonth, "MMMM yyyy")}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth((value) => addMonths(value, -1))}
            className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth((value) => addMonths(value, 1))}
            className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label} className="px-2 py-3">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={key}
              className={cn(
                "min-h-28 border-b border-r border-zinc-100 p-2",
                !inMonth && "bg-zinc-50/70 text-zinc-400",
              )}
            >
              <div
                className={cn(
                  "mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                  isToday && "bg-zinc-900 text-white",
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={cn(
                      "block w-full truncate rounded-md border px-2 py-1 text-left text-xs",
                      EVENT_COLORS[event.eventType] ?? EVENT_COLORS.custom,
                    )}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-xs text-zinc-500">+{dayEvents.length - 2} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
