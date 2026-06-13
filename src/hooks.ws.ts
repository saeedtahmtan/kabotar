import { auth } from '$lib/server/auth';
import { realtime } from 'svelte-realtime/server';

const hooks = realtime();

export const message = hooks.message;
export const close = hooks.close;

export async function upgrade({ cookies }: { cookies: Record<string, string> }) {
  const cookieString = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

  const session = await auth.api.getSession({
    headers: { cookie: cookieString }
  });

  if (!session) return false;
  return session.user;
}
