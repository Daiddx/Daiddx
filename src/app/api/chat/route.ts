import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractEntities } from "@/lib/llm/extract-entities";
import { saveExtraction } from "@/lib/events";
import type { ChatMessage, SaveExtractionPayload } from "@/lib/types";

const DEFAULT_CONVERSATION_ID = "default";

async function getOrCreateConversation() {
  const existing = await prisma.conversation.findFirst({
    where: { id: DEFAULT_CONVERSATION_ID },
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: {
      id: DEFAULT_CONVERSATION_ID,
      messages: JSON.stringify([]),
    },
  });
}

export async function GET() {
  const conversation = await getOrCreateConversation();
  const messages = JSON.parse(conversation.messages) as ChatMessage[];

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    action?: "extract" | "save";
    payload?: SaveExtractionPayload;
  };

  if (body.action === "save" && body.payload) {
    const result = await saveExtraction(body.payload);
    const conversation = await getOrCreateConversation();
    const messages = JSON.parse(conversation.messages) as ChatMessage[];

    messages.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: result.event
        ? `Saved ${result.event.title} to your calendar.`
        : "Saved your notes.",
      timestamp: new Date().toISOString(),
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { messages: JSON.stringify(messages) },
    });

    return NextResponse.json({ success: true, result });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const people = await prisma.person.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const extraction = await extractEntities(body.message, people);
  const conversation = await getOrCreateConversation();
  const messages = JSON.parse(conversation.messages) as ChatMessage[];

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: body.message,
    timestamp: new Date().toISOString(),
  };

  const assistantMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: extraction.summary,
    extraction,
    timestamp: new Date().toISOString(),
  };

  messages.push(userMessage, assistantMessage);

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { messages: JSON.stringify(messages) },
  });

  return NextResponse.json({
    messages,
    extraction,
  });
}
