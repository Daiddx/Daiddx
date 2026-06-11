export type EventType = "birthday" | "anniversary" | "custom";

export interface ExtractedPreference {
  category: string;
  value: string;
}

export interface ExtractedPerson {
  name: string;
  isNew: boolean;
  existingId?: string;
}

export interface ExtractedEvent {
  type: EventType;
  date: string;
  title: string;
  isAnnual: boolean;
}

export interface ExtractionResult {
  person: ExtractedPerson | null;
  event: ExtractedEvent | null;
  preferences: ExtractedPreference[];
  confidence: number;
  summary: string;
  usedFallback: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  extraction?: ExtractionResult;
  timestamp: string;
}

export interface GiftRecommendation {
  title: string;
  description: string;
  reason: string;
}

export interface ReminderPayload {
  id: string;
  eventId: string;
  title: string;
  personName: string | null;
  eventType: string;
  eventDate: string;
  daysBefore: number;
  message: string;
  giftIdeas: GiftRecommendation[];
  dismissed: boolean;
  createdAt: string;
}

export interface EventWithRelations {
  id: string;
  title: string;
  eventType: string;
  date: string;
  isAnnual: boolean;
  remindDays: number[];
  rawInput: string | null;
  person: {
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
}

export interface SaveExtractionPayload {
  person: ExtractedPerson | null;
  event: ExtractedEvent | null;
  preferences: ExtractedPreference[];
  rawInput: string;
}
