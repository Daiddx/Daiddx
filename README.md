# Important Dates

A conversation-first calendar app for capturing birthdays, anniversaries, and personal preferences from natural language notes — then reminding you with gift ideas when dates approach.

## Features

- **Conversation panel** — type casual notes like *"Talked with Lisa — her birthday is April 3, she loves sci-fi books"*
- **AI extraction** — parses people, dates, and preferences (OpenAI when configured; local fallback parser otherwise)
- **Confirmation flow** — review extracted details before saving
- **Calendar view** — month grid with color-coded events
- **Upcoming list** — next 30 days at a glance
- **Reminders** — in-app notifications at 30, 7, and 1 days before an event
- **Gift recommendations** — suggestions based on saved preferences

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite
- OpenAI API (optional)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Set `OPENAI_API_KEY` in `.env` for best extraction quality. The app still works without it using a local parser.

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Type a note in the conversation panel.
2. Review the extracted person, date, and preferences.
3. Click **Confirm & Save**.
4. View the event on the calendar and in the upcoming list.
5. Reminders appear automatically when an event is 30, 7, or 1 days away.

## API routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/chat` | GET, POST | Conversation history, extraction, save |
| `/api/events` | GET, POST, PATCH, DELETE | Event CRUD |
| `/api/reminders` | GET, POST | Reminder inbox, dismiss, check |
| `/api/people` | GET | People and preferences |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Notes

- Data is stored locally in SQLite (`prisma/dev.db`).
- Reminders are checked when `/api/reminders` is loaded.
- Google Calendar sync, email delivery, and authentication are planned future enhancements.
