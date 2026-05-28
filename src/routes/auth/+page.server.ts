import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { conv } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  if (event.locals.user) {
    return redirect(302, '/');
  }
  return {};
};

export const actions: Actions = {
  signIn: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();

    if (!username || !password) {
      return fail(400, { message: 'all parameters required' });
    }
    try {
      await auth.api.signInEmail({
        body: {
          email: `${username}@temp.com`,
          password,
          callbackURL: '/auth/verification-success'
        }
      });
    } catch (error) {
      if (error instanceof APIError) {
        return fail(400, { message: error.message || 'Signin failed' });
      }
      return fail(500, { message: `Unexpected error: ${error}` });
    }

    return redirect(302, '/');
  },
  signUp: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();
    const name = formData.get('name')?.toString();

    if (!username || !password || !name) {
      return fail(400, { message: 'all parameters required' });
    }

    try {
      await db.insert(conv).values({
        id: username,
        title: '',
        type: 'user'
      });

      await auth.api.signUpEmail({
        body: {
          email: `${username}@temp.com`,
          password,
          name,
          username,
          callbackURL: '/auth/verification-success'
        }
      });
    } catch (error) {
      if (error instanceof APIError) {
        return fail(400, { message: error.message || 'Registration failed' });
      }
      return fail(500, { message: `${error}` });
    }

    return redirect(302, '/');
  }
};
