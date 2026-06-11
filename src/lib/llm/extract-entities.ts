import OpenAI from "openai";
import { parseIsoDate, toIsoDate } from "@/lib/dates";
import type { ExtractionResult, ExtractedPreference } from "@/lib/types";

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

const BLOCKED_NAMES = new Set(["her", "his", "their", "my", "your", "our", "the", "a"]);

function sanitizePersonName(name: string | null): string | null {
  if (!name) {
    return null;
  }

  const trimmed = name.trim();
  if (!trimmed || BLOCKED_NAMES.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed;
}

function findExistingPerson(
  name: string,
  existingPeople: Array<{ id: string; name: string }>,
): { id: string; name: string } | null {
  const normalized = name.trim().toLowerCase();
  const exact = existingPeople.find(
    (person) => person.name.trim().toLowerCase() === normalized,
  );
  if (exact) {
    return exact;
  }

  return (
    existingPeople.find((person) => {
      const candidate = person.name.trim().toLowerCase();
      return candidate.includes(normalized) || normalized.includes(candidate);
    }) ?? null
  );
}

function parseMonthDay(text: string, referenceDate = new Date()): string | null {
  const monthDayPattern =
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;
  const numericPattern = /\b(\d{1,2})[\/\-](\d{1,2})\b/;

  const monthDayMatch = text.match(monthDayPattern);
  if (monthDayMatch) {
    const month = MONTHS[monthDayMatch[1].toLowerCase()];
    const day = Number(monthDayMatch[2]);
    const year = referenceDate.getFullYear();
    const candidate = new Date(year, month, day);
    if (candidate.getMonth() === month && candidate.getDate() === day) {
      return toIsoDate(candidate);
    }
  }

  const numericMatch = text.match(numericPattern);
  if (numericMatch) {
    const month = Number(numericMatch[1]) - 1;
    const day = Number(numericMatch[2]);
    const year = referenceDate.getFullYear();
    const candidate = new Date(year, month, day);
    if (candidate.getMonth() === month && candidate.getDate() === day) {
      return toIsoDate(candidate);
    }
  }

  return null;
}

function fallbackExtract(
  message: string,
  existingPeople: Array<{ id: string; name: string }>,
): ExtractionResult {
  const lower = message.toLowerCase();
  const preferences: ExtractedPreference[] = [];

  const likePatterns = [
    /(?:likes|loves|enjoys|into|prefers)\s+([a-z0-9\s\-,'"]{2,40})/gi,
    /(?:like|love|enjoy)\s+([a-z0-9\s\-,'"]{2,40})/gi,
  ];

  for (const pattern of likePatterns) {
    for (const match of message.matchAll(pattern)) {
      const value = match[1]?.trim().replace(/[.!,?]+$/, "");
      if (value && value.length > 1) {
        const parts = value
          .split(/\s+and\s+|,\s*/)
          .map((part) => part.trim())
          .filter(Boolean);

        for (const part of parts) {
          preferences.push({
            category: "interest",
            value: part,
          });
        }
      }
    }
  }

  const birthdayPattern =
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:'s)?\s+birthday\s+(?:is\s+)?(?:on\s+)?((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}[\/\-]\d{1,2})/i;
  const talkedPattern =
    /(?:[Tt]alked|[Ss]poke|[Cc]hatting|[Cc]onversation)\s+(?:with|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?=\s|[—,.]|$)/;
  const birthdayOnlyPattern =
    /birthday\s+(?:is\s+)?(?:on\s+)?([a-z]+\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}[\/\-]\d{1,2})/i;

  let personName: string | null = null;
  const talkedMatch = message.match(talkedPattern);
  const birthdayMatch = message.match(birthdayPattern);

  if (talkedMatch) {
    personName = sanitizePersonName(talkedMatch[1].trim());
  } else if (birthdayMatch) {
    personName = sanitizePersonName(birthdayMatch[1].trim());
  } else {
    const nameMatch = message.match(/\b([A-Z][a-z]{2,})\b/);
    personName = sanitizePersonName(nameMatch?.[1] ?? null);
  }

  const dateText = birthdayMatch?.[2] ?? message.match(birthdayOnlyPattern)?.[1] ?? message;
  const parsedDate = parseMonthDay(dateText);

  const eventType = lower.includes("anniversary")
    ? "anniversary"
    : lower.includes("birthday")
      ? "birthday"
      : parsedDate
        ? "custom"
        : null;

  const existing = personName
    ? findExistingPerson(personName, existingPeople)
    : null;

  const event =
    parsedDate && eventType
      ? {
          type: eventType as "birthday" | "anniversary" | "custom",
          date: parsedDate,
          title: personName
            ? `${personName}'s ${eventType}`
            : `Important ${eventType}`,
          isAnnual: eventType !== "custom",
        }
      : null;

  const uniquePreferences = preferences.filter(
    (preference, index, array) =>
      array.findIndex(
        (item) =>
          item.category === preference.category &&
          item.value.toLowerCase() === preference.value.toLowerCase(),
      ) === index,
  );

  const confidence = event ? 0.72 : uniquePreferences.length > 0 ? 0.55 : 0.35;
  const summary = event
    ? `I found ${personName ?? "someone"}'s ${event.type} on ${parseIsoDate(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}${uniquePreferences.length ? ` and ${uniquePreferences.length} preference(s)` : ""}.`
    : uniquePreferences.length
      ? `I found ${uniquePreferences.length} preference(s)${personName ? ` for ${personName}` : ""}.`
      : "I couldn't find a clear date or person. You can still save notes manually.";

  return {
    person: personName
      ? {
          name: existing?.name ?? personName,
          isNew: !existing,
          existingId: existing?.id,
        }
      : null,
    event,
    preferences: uniquePreferences,
    confidence,
    summary,
    usedFallback: true,
  };
}

export async function extractEntities(
  message: string,
  existingPeople: Array<{ id: string; name: string }> = [],
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackExtract(message, existingPeople);
  }

  const openai = new OpenAI({ apiKey });
  const today = toIsoDate(new Date());
  const peopleContext =
    existingPeople.length > 0
      ? `Known people: ${existingPeople.map((person) => person.name).join(", ")}`
      : "Known people: none";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You extract structured calendar data from casual notes. Today is ${today}. ${peopleContext}.
Return JSON with shape:
{
  "person": { "name": string | null, "is_new": boolean, "existing_id": string | null },
  "event": { "type": "birthday" | "anniversary" | "custom", "date": "YYYY-MM-DD", "title": string, "is_annual": boolean } | null,
  "preferences": [{ "category": string, "value": string }],
  "confidence": number,
  "summary": string
}
Resolve relative dates to absolute ISO dates. Match existing people when possible.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return fallbackExtract(message, existingPeople);
    }

    const parsed = JSON.parse(content) as {
      person?: { name?: string | null; is_new?: boolean; existing_id?: string | null };
      event?: {
        type?: string;
        date?: string;
        title?: string;
        is_annual?: boolean;
      } | null;
      preferences?: Array<{ category?: string; value?: string }>;
      confidence?: number;
      summary?: string;
    };

    const existing = parsed.person?.name
      ? findExistingPerson(parsed.person.name, existingPeople)
      : null;

    return {
      person: parsed.person?.name
        ? {
            name: existing?.name ?? parsed.person.name,
            isNew: !existing,
            existingId: existing?.id ?? parsed.person.existing_id ?? undefined,
          }
        : null,
      event: parsed.event?.date
        ? {
            type: (parsed.event.type ?? "custom") as "birthday" | "anniversary" | "custom",
            date: parsed.event.date,
            title: parsed.event.title ?? parsed.event.type ?? "Important date",
            isAnnual: parsed.event.is_annual ?? parsed.event.type !== "custom",
          }
        : null,
      preferences:
        parsed.preferences
          ?.filter((preference) => preference.value)
          .map((preference) => ({
            category: preference.category ?? "interest",
            value: preference.value!.trim(),
          })) ?? [],
      confidence: parsed.confidence ?? 0.8,
      summary:
        parsed.summary ??
        "I extracted details from your note. Please confirm before saving.",
      usedFallback: false,
    };
  } catch {
    return fallbackExtract(message, existingPeople);
  }
}
