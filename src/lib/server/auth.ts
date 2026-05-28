import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';
import { admin, username } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';

export const auth = betterAuth({
  baseURL: env.ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: {
    enabled: true
  },
  user: {
    additionalFields: {
      username: { type: 'string', required: true, unique: true }
    }
  },
  plugins: [username(), admin(), sveltekitCookies(getRequestEvent)] // make sure this is the last plugin in the array
});

export function requireAuth() {
  const { locals } = getRequestEvent();
  if (!locals.user) redirect(307, '/auth')
  return locals.user;
}
