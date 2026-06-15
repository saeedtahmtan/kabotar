import { eq } from 'drizzle-orm';
import { db } from '..';
import { conv } from '../schema';

export async function findConv(id: string) {
  return db.query.conv.findFirst({ where: eq(conv.id, id) });
}

export async function createConv(id: string, type: string, isPrivate: boolean) {
  const [row] = await db.insert(conv).values({ id, type, private: isPrivate }).returning();
  return row;
}

export async function createUserConv(username: string) {
  await db.insert(conv).values({ id: username, type: 'user', private: true });
}
