import { auth } from '$lib/server/auth';
import { createMessage } from 'svelte-realtime/server';
export { close, unsubscribe } from 'svelte-realtime/server';

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

export const message = createMessage();
