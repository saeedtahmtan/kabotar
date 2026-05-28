import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { conv } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { z } from 'zod';


const signInSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required')
});

const signUpSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
  name: z.string().min(1, 'Name required')
});

export const signIn = form(signInSchema, async (input) => {
  const { locals } = getRequestEvent();
  if (locals.user) redirect(302, '/');

  const { password, username } = input;

  try {
    await auth.api.signInEmail({
      body: {
        email: `${username}@temp.com`, password,
      }
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, message: error.message || 'Signin failed' };
    }
    return { success: false, message: `Unexpected error: ${error}` };
  }

  return { success: true, redirectTo: '/' };
});

export const signUp = form(signUpSchema, async (input) => {
  try {
    await db.insert(conv).values({
      id: input.username,
      title: '',
      type: 'user'
    });

    await auth.api.signUpEmail({
      body: {
        email: `${input.username}@temp.com`,
        password: input.password,
        name: input.name,
        username: input.username,
        callbackURL: '/auth/verification-success'
      }
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, message: error.message || 'Registration failed' };
    }
    return { success: false, message: `${error}` };
  }
  return { success: true, redirectTo: '/' };
});
