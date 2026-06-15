import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/server/auth';
import { createUserConv } from '$lib/server/db/models/conv';
import { invalid, redirect } from '@sveltejs/kit';
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
      invalid(error.message || 'Signin failed');
    }
    invalid(`Unexpected error: ${error}`);
  }

  redirect(303, '/');
});

export const signUp = form(signUpSchema, async (input) => {
  try {
    await createUserConv(input.username);

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
      invalid(error.message || 'Registration failed');
    }
    invalid(`${error}`);
  }
  redirect(303, '/');
});
