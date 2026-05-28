// realtime-allow-public
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { conv, join, user } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { live, LiveError, type LiveContext } from 'svelte-realtime';
import { v5 as uuidv5 } from 'uuid';

export type joinStream = {
  id: string;
  convId: string;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  joinedAt: Date;
  title: string;
  type: string;
  convUpdatedAt: Date;
  joinUpdatedAt: Date;
  info: {
    title: string;
    image: string | null;
  };
}[];

// TODO : NEED MORE SAFETY CHECKS AND AVOID DUPLICATES
export const joinCreate = live(async (ctx: LiveContext<any>, convId: string) => {
  if (convId === ctx.user.username) return;

  const targetConv = await db.query.conv.findFirst({ where: eq(conv.id, convId) });
  if (!targetConv) return new LiveError('NOT FOUND', 'target does not exist');

  if (targetConv.type === 'user') {
    const targetUser = await db.query.user.findFirst({ where: eq(user.username, convId) });
    if (!targetUser) return new LiveError('NOT FOUND', 'target user not found');

    const sharedId = [targetUser.id, ctx.user.id].sort().join();

    const joins = await db.transaction(async (tx) => {
      const insertedConvId = uuidv5(sharedId, env.UUID_DATABASE_ID);
      const [insertedConv] = await tx
        .insert(conv)
        .values({
          id: insertedConvId,
          title: '',
          type: 'personal'
        })
        .returning();

      const insertedJoins = await tx
        .insert(join)
        .values([
          { convId: insertedConvId, userId: ctx.user.id, type: 'personal', infoId: targetUser.id },
          { convId: insertedConvId, userId: targetUser.id, type: 'personal', infoId: ctx.user.id }
        ])
        .returning();

      const result = insertedJoins.map((join) => ({
        id: join.id,
        convId: join.convId,
        userId: join.userId,
        banned: join.banned,
        banReason: join.banReason,
        banExpires: join.banExpires,
        joinedAt: join.createdAt,
        // Conversation fields
        title: insertedConv.title,
        type: insertedConv.type,
        convUpdatedAt: insertedConv.updatedAt,
        joinUpdatedAt: join.updatedAt,
        info: join.id == ctx.user.id ? {
          title: targetUser.name,
          image: targetUser.image
        } : {
          title: ctx.user.name,
          image: ctx.user.image,
        }
      }));
      return result;
    });

    joins.forEach((join) => {
      ctx.publish(`join:${join.userId}`, 'created', { id: join.id });
    });
  }

  if (targetConv.type === 'channel') { /* ... */ }
  if (targetConv.type === 'group') { /* ... */ }
});


export const joinStream = live.stream(
  (ctx) => `join:${ctx.user.id}`,
  async (ctx) => await db.select({
    // Join fields
    id: join.id,
    convId: join.convId,
    banned: join.banned,
    banReason: join.banReason,
    banExpires: join.banExpires,
    joinedAt: join.createdAt,
    // Conversation fields
    title: conv.title,
    type: conv.type,
    convUpdatedAt: conv.updatedAt,
    joinUpdatedAt: join.updatedAt,
    info: {
      title: user.name,
      image: user.image
    }
  })
    .from(join)
    .innerJoin(conv, eq(join.convId, conv.id))
    .innerJoin(user, eq(join.infoId, user.id))
    .where(and(eq(join.userId, ctx.user.id), eq(join.type, "personal"))),
  { merge: 'crud', key: 'id' }
);
