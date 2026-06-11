"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarView } from "@/components/CalendarView";
import { ConversationPanel } from "@/components/ConversationPanel";
import { EventDetailDrawer } from "@/components/EventDetailDrawer";
import { ReminderCard } from "@/components/ReminderCard";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import type { EventWithRelations, ReminderPayload } from "@/lib/types";

export function HomeDashboard() {
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [reminders, setReminders] = useState<ReminderPayload[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null);

  const refreshData = useCallback(async () => {
    const [eventsResponse, remindersResponse] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/reminders"),
    ]);

    const eventsData = (await eventsResponse.json()) as { events: EventWithRelations[] };
    const remindersData = (await remindersResponse.json()) as {
      reminders: ReminderPayload[];
    };

    setEvents(eventsData.events ?? []);
    setReminders(remindersData.reminders ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      const [eventsResponse, remindersResponse] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/reminders"),
      ]);

      const eventsData = (await eventsResponse.json()) as { events: EventWithRelations[] };
      const remindersData = (await remindersResponse.json()) as {
        reminders: ReminderPayload[];
      };

      if (!cancelled) {
        setEvents(eventsData.events ?? []);
        setReminders(remindersData.reminders ?? []);
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDismissReminder(id: string) {
    const response = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss", id }),
    });
    const data = (await response.json()) as { reminders: ReminderPayload[] };
    setReminders(data.reminders ?? []);
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Important Dates</h1>
            <p className="text-sm text-zinc-500">
              Capture conversations, track birthdays, and get gift ideas before they arrive.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <ConversationPanel onSaved={refreshData} />

        <div className="space-y-6">
          <ReminderCard reminders={reminders} onDismiss={handleDismissReminder} />
          <CalendarView events={events} onSelectEvent={setSelectedEvent} />
          <UpcomingEvents events={events} onSelectEvent={setSelectedEvent} />
        </div>
      </main>

      <EventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onUpdated={refreshData}
      />
    </div>
  );
}
