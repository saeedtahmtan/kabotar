import { db } from '..';
import { info } from '../schema';
import { eq } from 'drizzle-orm';

export async function findInfo(id: string) {
  return db.query.info.findFirst({ where: eq(info.id, id) });
}

export async function createInfo(id: string, title: string, image: string | null) {
  const [row] = await db.insert(info).values({ id, title, image }).returning();
  return row;
}
