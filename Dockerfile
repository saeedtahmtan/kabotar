FROM node:22-trixie-slim AS build

# git is required - uWebSockets.js is installed from GitHub, not npm
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-trixie-slim

# git still needed at runtime - uWebSockets.js resolves at runtime
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/build build/
COPY --from=build /app/node_modules node_modules/
COPY package*.json ./
COPY drizzle.config.ts .

EXPOSE 3000

# Push schema to the database then start the server
CMD ["sh", "-c", "npm run db:push && node build"]
