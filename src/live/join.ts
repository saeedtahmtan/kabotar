// realtime-allow-public
import { findConv, createConv } from '$lib/server/db/models/conv';
import { createInfo } from '$lib/server/db/models/info';
import {
  findUserByUsername,
  findExistingJoin,
  getExistingInfoId,
  createPersonalDM,
  createJoin,
  getJoinsForUser
} from '$lib/server/db/models/join';
import { env } from '$env/dynamic/private';
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

  const targetConv = await findConv(convId);
  if (!targetConv) return new LiveError('NOT FOUND', 'target does not exist');

  if (targetConv.type === 'user') {
    const targetUser = await findUserByUsername(convId);
    if (!targetUser) return new LiveError('NOT FOUND', 'target user not found');

    const sharedId = [targetUser.id, ctx.user.id].sort().join();

    const { conv: insertedConv, joins: insertedJoins } = await createPersonalDM(
      targetUser.id,
      ctx.user.id,
      uuidv5(sharedId, env.UUID_DATABASE_ID),
      'personal'
    );

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
      info: join.userId === ctx.user.id
        ? { title: targetUser.name, image: targetUser.image }
        : { title: ctx.user.name, image: ctx.user.image }
    }));

    result.forEach((join) => {
      ctx.publish(`join:${join.userId}`, 'created', join);
    });
  }

  if (targetConv.type === 'channel' || targetConv.type === 'group') {
    if (targetConv.private) return new LiveError('PRIVATE', 'this conversation is private');

    const existingJoin = await findExistingJoin(convId, ctx.user.id);
    if (existingJoin) return new LiveError('ALREADY JOINED', 'already joined');

    const resolvedInfoId = await getExistingInfoId(convId);
    const channelInfo = resolvedInfoId ? await createInfo(resolvedInfoId, '', null) : null;

    const insertedJoin = await createJoin(convId, ctx.user.id, targetConv.type, resolvedInfoId ?? convId);

    ctx.publish(`join:${ctx.user.id}`, 'created', {
      ...insertedJoin,
      joinedAt: insertedJoin.createdAt,
      joinUpdatedAt: insertedJoin.updatedAt,
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

  const existingConv = await findConv(convId);
  if (existingConv) return new LiveError('CONFLICT', 'a conversation with this identifier already exists');

  const insertedInfo = await createInfo(crypto.randomUUID(), name, null);
  const insertedConv = await createConv(convId, 'channel', !isPublic);
  const insertedJoin = await createJoin(convId, ctx.user.id, 'channel', insertedInfo.id);

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

  const existingConv = await findConv(convId);
  if (existingConv) return new LiveError('CONFLICT', 'a conversation with this identifier already exists');

  const insertedInfo = await createInfo(crypto.randomUUID(), name, null);
  const insertedConv = await createConv(convId, 'group', !isPublic);
  const insertedJoin = await createJoin(convId, ctx.user.id, 'group', insertedInfo.id);

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
  async (ctx) => getJoinsForUser(ctx.user.id),
  { merge: 'crud', key: 'id' }
);
