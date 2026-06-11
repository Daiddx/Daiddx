import type { GiftRecommendation } from "@/lib/types";

const EVENT_GIFT_FRAMES: Record<string, string[]> = {
  birthday: ["gift", "surprise", "celebration"],
  anniversary: ["experience", "keepsake", "date idea"],
  custom: ["thoughtful gesture", "helpful item", "memory"],
};

export function generateGiftRecommendations(input: {
  personName: string | null;
  eventType: string;
  eventTitle: string;
  preferences: Array<{ category: string; value: string }>;
}): GiftRecommendation[] {
  const { personName, eventType, eventTitle, preferences } = input;
  const subject = personName ?? "them";
  const frames = EVENT_GIFT_FRAMES[eventType] ?? EVENT_GIFT_FRAMES.custom;
  const recommendations: GiftRecommendation[] = [];

  if (preferences.length === 0) {
    return [
      {
        title: `Ask ${subject} about current interests`,
        description: "Send a quick message to learn what they would enjoy most right now.",
        reason: `No saved preferences yet for ${eventTitle}.`,
      },
      {
        title: "Gift card to a favorite local spot",
        description: "A flexible option when you need something thoughtful but safe.",
        reason: frames[0],
      },
      {
        title: "Handwritten card with a memory",
        description: "Include a specific moment you shared recently.",
        reason: frames[2],
      },
    ];
  }

  for (const preference of preferences.slice(0, 3)) {
    recommendations.push({
      title: `${capitalize(preference.value)}-themed ${frames[0]}`,
      description: buildGiftDescription(preference.category, preference.value, eventType),
      reason: `${subject} likes ${preference.value} (${preference.category}).`,
    });
  }

  if (recommendations.length < 3) {
    recommendations.push({
      title: "Curated gift bundle",
      description: `Combine a few small items related to ${preferences
        .slice(0, 2)
        .map((preference) => preference.value)
        .join(" and ")}.`,
      reason: `Personalized bundle for ${eventTitle}.`,
    });
  }

  if (recommendations.length < 4) {
    recommendations.push({
      title: "Plan a shared experience",
      description: `Schedule time together centered around ${preferences[0]?.value ?? "their interests"}.`,
      reason: frames[1],
    });
  }

  return recommendations.slice(0, 5);
}

function buildGiftDescription(category: string, value: string, eventType: string): string {
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes("book") || value.toLowerCase().includes("book")) {
    return `Pick a highly rated ${value} book or a bookstore gift card.`;
  }

  if (
    normalizedCategory.includes("food") ||
    normalizedCategory.includes("drink") ||
    ["coffee", "tea", "matcha", "latte"].some((term) => value.toLowerCase().includes(term))
  ) {
    return `Bring or send something related to ${value}, like a specialty kit or tasting set.`;
  }

  if (eventType === "anniversary") {
    return `Plan an outing or keepsake connected to ${value}.`;
  }

  return `Look for a quality ${value}-related item from a thoughtful boutique or maker.`;
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function generateGiftRecommendationsWithLLM(input: {
  personName: string | null;
  eventType: string;
  eventTitle: string;
  preferences: Array<{ category: string; value: string }>;
}): Promise<GiftRecommendation[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return generateGiftRecommendations(input);
  }

  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Return JSON: { "recommendations": [{ "title": string, "description": string, "reason": string }] } with 3-5 thoughtful recommendations.',
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return generateGiftRecommendations(input);
    }

    const parsed = JSON.parse(content) as {
      recommendations?: GiftRecommendation[];
    };

    if (parsed.recommendations?.length) {
      return parsed.recommendations.slice(0, 5);
    }
  } catch {
    // fall through
  }

  return generateGiftRecommendations(input);
}
