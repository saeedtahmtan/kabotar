# Kabotar

A real-time chat application built with SvelteKit, featuring personal DMs, channels, and groups.

## Stack

- **Frontend:** Svelte 5 + SvelteKit
- **Realtime:** svelte-realtime (WebSocket via uWebSockets.js)
- **Database:** SQLite (libSQL/Turso) + Drizzle ORM
- **Auth:** better-auth (email-based, SQLite adapter)
- **UI:** shadcn-svelte components, Tailwind CSS
- **i18n:** Paraglide (English, Farsi)

## Features

- Personal direct messaging between users
- Public and private channels for broadcast messages
- Public and private groups for collaboration
- Deterministic conversation IDs for public channels/groups
- Real-time message streaming and updates
- User authentication with session management

## Getting Started

```sh
# install dependencies
npm install

# copy environment file and fill in variables
cp .env.example .env

# push database schema
npm run db:push

# start development server
npm run dev
```

### Environment Variables

| Variable             | Description                                     |
| -------------------- | ----------------------------------------------- |
| `DATABASE_URL`       | SQLite database path (e.g., `file:local.db`)    |
| `BETTER_AUTH_SECRET` | better-auth secret key                          |
| `ORIGIN`             | Application URL (e.g., `http://localhost:5173`) |
| `UUID_DATABASE_ID`   | UUID v5 namespace for deterministic IDs         |

## Scripts

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `npm run dev`         | Start dev server             |
| `npm run build`       | Production build             |
| `npm run preview`     | Preview production build     |
| `npm run check`       | Run svelte-check             |
| `npm run lint`        | Run ESLint                   |
| `npm run format`      | Format code with Prettier    |
| `npm run db:push`     | Push schema to database      |
| `npm run db:studio`   | Open Drizzle Studio          |
| `npm run db:generate` | Generate SQL migration       |
| `npm run db:migrate`  | Run generated SQL migrations |

## Docker

```sh
# build the image
docker build -t kabotar .

# run with a persistent volume for the database
docker run -v ./data:/app/data \
  -e DATABASE_URL=file:/app/data/local.db \
  -e BETTER_AUTH_SECRET=<secret> \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  -e UUID_DATABASE_ID=<uuid> \
  -p 3000:3000 \
  kabotar
```

The schema is pushed automatically at container startup. SQLite data is stored in the mounted `./data` directory.

## More

See the [wiki](wiki/getting-started.md) for detailed setup instructions and project structure.
