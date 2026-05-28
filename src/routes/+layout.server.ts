import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  const { locals, url } = event;
  if (url.pathname === '/auth') return {};
  if (!locals.user) return redirect(302, '/auth');
  return { user: locals.user };
};
