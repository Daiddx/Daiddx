import { NextResponse } from "next/server";
import {
  checkAndCreateReminders,
  dismissReminder,
  getActiveReminders,
} from "@/lib/reminders/scheduler";

export async function GET() {
  await checkAndCreateReminders();
  const reminders = await getActiveReminders();
  return NextResponse.json({ reminders });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; id?: string };

  if (body.action === "check") {
    const createdCount = await checkAndCreateReminders();
    const reminders = await getActiveReminders();
    return NextResponse.json({ createdCount, reminders });
  }

  if (body.action === "dismiss" && body.id) {
    await dismissReminder(body.id);
    const reminders = await getActiveReminders();
    return NextResponse.json({ reminders });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
