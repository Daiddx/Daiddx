"use client";

import { useMemo, useState } from "react";
import type { ExtractionResult, SaveExtractionPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ConfirmExtractionCardProps {
  extraction: ExtractionResult;
  rawInput: string;
  loading: boolean;
  onConfirm: (payload: SaveExtractionPayload) => void;
  onDismiss: () => void;
}

export function ConfirmExtractionCard({
  extraction,
  rawInput,
  loading,
  onConfirm,
  onDismiss,
}: ConfirmExtractionCardProps) {
  const [personName, setPersonName] = useState(extraction.person?.name ?? "");
  const [eventTitle, setEventTitle] = useState(extraction.event?.title ?? "");
  const [eventDate, setEventDate] = useState(extraction.event?.date ?? "");
  const [preferences, setPreferences] = useState(
    extraction.preferences.map((preference) => ({ ...preference })),
  );

  const canSave = useMemo(
    () => Boolean(extraction.event || preferences.length > 0 || personName.trim()),
    [extraction.event, preferences.length, personName],
  );

  function handleConfirm() {
    onConfirm({
      person: personName.trim()
        ? {
            name: personName.trim(),
            isNew: extraction.person?.isNew ?? true,
            existingId: extraction.person?.existingId,
          }
        : null,
      event: extraction.event
        ? {
            type: extraction.event.type,
            date: eventDate,
            title: eventTitle || extraction.event.title,
            isAnnual: extraction.event.isAnnual,
          }
        : null,
      preferences,
      rawInput,
    });
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-zinc-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-900">Review before saving</p>
          <p className="text-zinc-600">
            Confidence: {Math.round(extraction.confidence * 100)}%
            {extraction.usedFallback ? " · local parser" : " · AI parser"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Person
          </span>
          <input
            value={personName}
            onChange={(event) => setPersonName(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2"
            placeholder="Name"
          />
        </label>

        {extraction.event && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Event
              </span>
              <input
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Date
              </span>
              <input
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              />
            </label>
          </>
        )}

        {preferences.length > 0 && (
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Preferences
            </span>
            <div className="space-y-2">
              {preferences.map((preference, index) => (
                <div key={`${preference.category}-${index}`} className="flex gap-2">
                  <input
                    value={preference.category}
                    onChange={(event) =>
                      setPreferences((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, category: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="w-1/3 rounded-lg border border-zinc-200 px-3 py-2"
                    placeholder="Category"
                  />
                  <input
                    value={preference.value}
                    onChange={(event) =>
                      setPreferences((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, value: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-2"
                    placeholder="Value"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!canSave || loading}
          onClick={handleConfirm}
          className={cn(
            "rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition hover:bg-zinc-700",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loading ? "Saving..." : "Confirm & Save"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-700 transition hover:bg-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
