import {
  addYears,
  differenceInCalendarDays,
  format,
  isBefore,
  setYear,
  startOfDay,
} from "date-fns";

export function getNextOccurrence(eventDate: Date, fromDate = new Date()): Date {
  const today = startOfDay(fromDate);
  let candidate = startOfDay(
    setYear(eventDate, today.getFullYear()),
  );

  if (isBefore(candidate, today)) {
    candidate = addYears(candidate, 1);
  }

  return candidate;
}

export function getOccurrenceInMonth(
  eventDate: Date,
  monthDate: Date,
  isAnnual: boolean,
): Date | null {
  const month = monthDate.getMonth();
  const year = monthDate.getFullYear();

  if (isAnnual) {
    const occurrence = new Date(year, month, eventDate.getDate());
    if (occurrence.getMonth() !== month) {
      return null;
    }
    return occurrence;
  }

  const candidate = startOfDay(eventDate);
  if (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month
  ) {
    return candidate;
  }

  return null;
}

export function daysUntilEvent(eventDate: Date, isAnnual: boolean, fromDate = new Date()): number {
  const next = isAnnual ? getNextOccurrence(eventDate, fromDate) : startOfDay(eventDate);
  return differenceInCalendarDays(next, startOfDay(fromDate));
}

export function formatEventDate(date: Date, isAnnual: boolean): string {
  if (isAnnual) {
    return format(date, "MMMM d");
  }
  return format(date, "MMMM d, yyyy");
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function normalizeMonthDay(date: Date): Date {
  return new Date(2000, date.getMonth(), date.getDate());
}
