"use client";

import { Bell, Gift, X } from "lucide-react";
import type { ReminderPayload } from "@/lib/types";

interface ReminderCardProps {
  reminders: ReminderPayload[];
  onDismiss: (id: string) => void;
}

export function ReminderCard({ reminders, onDismiss }: ReminderCardProps) {
  if (reminders.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-600" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Reminders
        </h2>
      </div>

      {reminders.map((reminder) => (
        <article
          key={reminder.id}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-zinc-900">{reminder.title}</p>
              <p className="text-sm text-zinc-600">{reminder.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(reminder.id)}
              className="rounded-lg border border-amber-200 bg-white p-2 text-zinc-500 hover:text-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {reminder.giftIdeas.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                <Gift className="h-4 w-4" />
                Gift ideas
              </div>
              {reminder.giftIdeas.map((gift) => (
                <div key={gift.title} className="rounded-xl bg-white p-3 text-sm">
                  <p className="font-medium text-zinc-900">{gift.title}</p>
                  <p className="text-zinc-600">{gift.description}</p>
                  <p className="mt-1 text-xs text-zinc-500">{gift.reason}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
