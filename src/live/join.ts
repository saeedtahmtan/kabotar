// realtime-allow-public
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { conv, info, join, message, user } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { live, LiveError, type LiveContext } from 'svelte-realtime';
import { v5 as uuidv5 } from 'uuid';

live.silentTopicWarning(false);

export type joinStream = {
  id: string;
  convId: string;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  joinedAt: Date;
  type: string;
  convUpdatedAt: Date;
  joinUpdatedAt: Date;
  peerLastSeen: Date | null;
  lastMessage: string | null;
  isSelf: boolean;
  memberCount: number;
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
          type: 'personal',
          private: true
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
      ctx.publish(`join:${join.userId}`, 'created', join);
    });
  }

  if (targetConv.type === 'channel' || targetConv.type === 'group') {
    if (targetConv.private) return new LiveError('PRIVATE', 'this conversation is private');

    const existingJoin = await db.query.join.findFirst({
      where: and(eq(join.convId, convId), eq(join.userId, ctx.user.id))
    });
    if (existingJoin) return new LiveError('ALREADY JOINED', 'already joined');

    const existingJoinInfo = await db
      .select({ infoId: join.infoId })
      .from(join)
      .where(and(eq(join.convId, convId), sql`${join.infoId} IS NOT NULL`))
      .limit(1);
    const resolvedInfoId = existingJoinInfo[0]?.infoId;
    const channelInfo = resolvedInfoId
      ? await db.query.info.findFirst({ where: eq(info.id, resolvedInfoId) })
      : null;

    const [insertedJoins] = await db.insert(join)
      .values({
        convId,
        userId: ctx.user.id,
        type: targetConv.type,
        infoId: resolvedInfoId ?? convId
      })
      .returning();

    ctx.publish(`join:${ctx.user.id}`, 'created', {
      ...insertedJoins,
      joinedAt: insertedJoins.createdAt,
      joinUpdatedAt: insertedJoins.updatedAt,
      convUpdatedAt: targetConv.updatedAt,
      info: {
        title: channelInfo?.title ?? convId,
        image: channelInfo?.image ?? null
      }
    });
  }
});

export const channelCreate = live(async (ctx: LiveContext<any>, name: string, identifier?: string) => {
  const isPublic = !!identifier;
  const convId = identifier || crypto.randomUUID();

  const existingConv = await db.query.conv.findFirst({ where: eq(conv.id, convId) });
  if (existingConv) return new LiveError('CONFLICT', 'a conversation with this identifier already exists');

  const [insertedInfo] = await db.insert(info)
    .values({ id: crypto.randomUUID(), title: name, image: null })
    .returning();

  const [insertedConv] = await db.insert(conv)
    .values({ id: convId, type: 'channel', private: !isPublic })
    .returning();

  const [insertedJoin] = await db.insert(join)
    .values({ convId, userId: ctx.user.id, type: 'channel', infoId: insertedInfo.id })
    .returning();

  ctx.publish(`join:${ctx.user.id}`, 'created', {
    ...insertedJoin,
    joinedAt: insertedJoin.createdAt,
    joinUpdatedAt: insertedJoin.updatedAt,
    convUpdatedAt: insertedConv.updatedAt,
    info: {
      title: insertedInfo.title,
      image: insertedInfo.image
    }
  });
});

export const groupCreate = live(async (ctx: LiveContext<any>, name: string, identifier?: string) => {
  const isPublic = !!identifier;
  const convId = identifier || crypto.randomUUID();

  const existingConv = await db.query.conv.findFirst({ where: eq(conv.id, convId) });
  if (existingConv) return new LiveError('CONFLICT', 'a conversation with this identifier already exists');

  const [insertedInfo] = await db.insert(info)
    .values({ id: crypto.randomUUID(), title: name, image: null })
    .returning();

  const [insertedConv] = await db.insert(conv)
    .values({ id: convId, type: 'group', private: !isPublic })
    .returning();

  const [insertedJoin] = await db.insert(join)
    .values({ convId, userId: ctx.user.id, type: 'group', infoId: insertedInfo.id })
    .returning();

  ctx.publish(`join:${ctx.user.id}`, 'created', {
    ...insertedJoin,
    joinedAt: insertedJoin.createdAt,
    joinUpdatedAt: insertedJoin.updatedAt,
    convUpdatedAt: insertedConv.updatedAt,
    info: {
      title: insertedInfo.title,
      image: insertedInfo.image
    }
  });
});


export const joinStream = live.stream(
  (ctx) => `join:${ctx.user.id}`,
  async (ctx) => await db.select({
    id: join.id,
    convId: join.convId,
    banned: join.banned,
    banReason: join.banReason,
    banExpires: join.banExpires,
    joinedAt: join.createdAt,
    type: conv.type,
    convUpdatedAt: conv.updatedAt,
    joinUpdatedAt: join.updatedAt,
    peerLastSeen: sql<Date | null>`
      CASE
        WHEN ${conv.type} = 'personal'
        THEN (
          SELECT pj.updated_at
          FROM "join" AS pj
          WHERE pj.conv_id = ${join.convId}
            AND pj.user_id != ${join.userId}
          LIMIT 1
        )
        ELSE NULL
      END
    `,
    lastMessage: sql<string | null>`
      (
        SELECT ${message.data}
        FROM ${message}
        WHERE ${message.convId} = ${join.convId}
        ORDER BY ${message.createdAt} DESC
        LIMIT 1
      )
    `,
    isSelf: sql<boolean>`${join.userId} = ${join.infoId}`,
    memberCount: sql<number>`
      (SELECT COUNT(*) FROM "join" AS j2 WHERE j2.conv_id = ${join.convId})
    `,
    info: {
      title: sql<string>`COALESCE(${user.name}, ${info.title})`,
      image: sql<string | null>`COALESCE(${user.image}, ${info.image})`
    }
  })
    .from(join)
    .innerJoin(conv, eq(join.convId, conv.id))
    .leftJoin(user, eq(join.infoId, user.id))
    .leftJoin(info, eq(join.infoId, info.id))
    .where(eq(join.userId, ctx.user.id)),
  { merge: 'crud', key: 'id' }
);
