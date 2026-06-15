import { and, eq, sql } from 'drizzle-orm';
import { db } from '..';
import { conv, info, join, message, user } from '../schema';

export async function findUserByUsername(username: string) {
  return db.query.user.findFirst({ where: eq(user.username, username) });
}

export async function findExistingJoin(convId: string, userId: string) {
  return db.query.join.findFirst({
    where: and(eq(join.convId, convId), eq(join.userId, userId))
  });
}

export async function getExistingInfoId(convId: string) {
  const rows = await db
    .select({ infoId: join.infoId })
    .from(join)
    .where(and(eq(join.convId, convId), sql`${join.infoId} IS NOT NULL`))
    .limit(1);
  return rows[0]?.infoId ?? null;
}

export async function createPersonalDM(
  userId1: string,
  userId2: string,
  convId: string,
  type: string
) {
  return db.transaction(async (tx) => {
    const [insertedConv] = await tx
      .insert(conv)
      .values({ id: convId, type, private: true })
      .returning();

    const insertedJoins = await tx
      .insert(join)
      .values([
        { convId, userId: userId1, type, infoId: userId2 },
        { convId, userId: userId2, type, infoId: userId1 }
      ])
      .returning();

    return { conv: insertedConv, joins: insertedJoins };
  });
}

export async function createJoin(convId: string, userId: string, type: string, infoId: string) {
  const [row] = await db.insert(join).values({ convId, userId, type, infoId }).returning();
  return row;
}

export async function getJoinsForUser(userId: string) {
  return db
    .select({
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
    .where(eq(join.userId, userId));
}
