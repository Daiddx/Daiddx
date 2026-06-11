"use client";

import { format } from "date-fns";
import { Trash2, X } from "lucide-react";
import { useState } from "react";
import type { EventWithRelations } from "@/lib/types";

interface EventDetailDrawerProps {
  event: EventWithRelations | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EventDetailDrawer({ event, onClose, onUpdated }: EventDetailDrawerProps) {
  const [deleting, setDeleting] = useState(false);

  if (!event) {
    return null;
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/events?id=${event?.id}`, { method: "DELETE" });
      onUpdated();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 p-4">
      <div className="h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-zinc-500">{event.eventType}</p>
            <h3 className="text-xl font-semibold text-zinc-900">{event.title}</h3>
            <p className="text-sm text-zinc-600">
              {format(new Date(event.date), event.isAnnual ? "MMMM d" : "MMMM d, yyyy")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          {event.person && (
            <section>
              <h4 className="mb-2 text-sm font-medium text-zinc-900">Person</h4>
              <p className="text-zinc-700">{event.person.name}</p>
              {event.person.notes && (
                <p className="mt-2 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
                  {event.person.notes}
                </p>
              )}
            </section>
          )}

          {event.person?.preferences?.length ? (
            <section>
              <h4 className="mb-2 text-sm font-medium text-zinc-900">Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {event.person.preferences.map((preference) => (
                  <span
                    key={preference.id}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
                  >
                    {preference.category}: {preference.value}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {event.rawInput && (
            <section>
              <h4 className="mb-2 text-sm font-medium text-zinc-900">Original note</h4>
              <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">{event.rawInput}</p>
            </section>
          )}

          <section>
            <h4 className="mb-2 text-sm font-medium text-zinc-900">Reminders</h4>
            <p className="text-sm text-zinc-600">
              {event.remindDays.join(", ")} days before
            </p>
          </section>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete event"}
          </button>
        </div>
      </div>
    </div>
  );
}
