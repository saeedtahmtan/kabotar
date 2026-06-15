# Getting Started

Kabotar is a real-time chat application with personal DMs, channels, and groups.

## Tech Stack

- **Frontend:** Svelte 5 (runes mode) + SvelteKit
- **Realtime:** WebSocket via uWebSockets.js (`svelte-adapter-uws` + `svelte-realtime`)
- **Database:** SQLite (libSQL/Turso) + Drizzle ORM
- **Auth:** better-auth (email/password with username plugin)
- **UI:** Tailwind CSS v4, bits-ui (shadcn-svelte), Lucide icons
- **i18n:** Paraglide (English, Farsi)

## Prerequisites

- Node.js 20+
- npm

## Setup

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Configure environment variables:**

   ```sh
   cp .env.example .env
   ```

   Edit `.env` with the following:

   | Variable             | Description                             | Example                                 |
   | -------------------- | --------------------------------------- | --------------------------------------- |
   | `DATABASE_URL`       | SQLite database path                    | `file:local.db`                         |
   | `BETTER_AUTH_SECRET` | 32-char random string for auth tokens   | Generate with `openssl rand -base64 32` |
   | `UUID_DATABASE_ID`   | UUID v5 namespace for deterministic IDs | Generate with `uuidgen`                 |

3. **Push the database schema:**

   ```sh
   npm run db:push
   ```

4. **Start the dev server:**

   ```sh
   npm run dev
   ```

## Available Scripts

| Command               | Description               |
| --------------------- | ------------------------- |
| `npm run dev`         | Start development server  |
| `npm run build`       | Production build          |
| `npm run preview`     | Preview production build  |
| `npm run check`       | Run svelte-check          |
| `npm run lint`        | Run ESLint + Prettier     |
| `npm run format`      | Format code with Prettier |
| `npm run db:push`     | Push schema to database   |
| `npm run db:generate` | Generate SQL migration    |
| `npm run db:migrate`  | Run SQL migrations        |
| `npm run db:studio`   | Open Drizzle Studio       |

## Docker

```sh
docker build -t kabotar .
docker run -v ./data:/app/data \
  -e DATABASE_URL=file:/app/data/local.db \
  -e BETTER_AUTH_SECRET=<secret> \
  -e UUID_DATABASE_ID=<uuid> \
  -p 3000:3000 \
  kabotar
```

## Project Structure

```
src/
├── routes/
│   ├── [conv]/       # Conversation view (chat)
│   ├── auth/         # Login / Register
│   ├── +page.svelte  # Home page (sidebar)
│   └── +layout.svelte
├── lib/
│   ├── components/
│   │   ├── chat/     # Input, viewport, emoji-picker, file-chips
│   │   ├── sidebar/  # Conversation list sidebar
│   │   └── ui/       # shadcn-svelte components
│   └── server/
│       ├── db/       # Schema + data access models
│       ├── auth.ts   # better-auth configuration
│       └── live/     # Realtime logic (dice/slot machine)
└── hooks.server.ts   # Auth + i18n middleware
```
