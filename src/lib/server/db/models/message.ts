import { db } from '..';
import { join, message } from '../schema';
import { and, desc, eq, lt } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { unlink, writeFile } from 'fs/promises';
import path from 'path';

export async function createMessage(
  userId: string,
  convId: string,
  data: string,
  meta: string
) {
  const [row] = await db
    .insert(message)
    .values({ userId, convId, data, meta })
    .returning();
  return row;
}

export type UploadedFile = {
  name: string;
  pathname: string;
  size: number;
  mime: string;
  ext: string;
};

async function uploadFiles(files: ArrayBuffer[]): Promise<UploadedFile[]> {
  const uploaded: UploadedFile[] = [];
  for (const fileBuffer of files) {
    const detectedType = await fileTypeFromBuffer(Buffer.from(fileBuffer));
    const mime = detectedType?.mime || 'application/octet-stream';
    const ext = detectedType?.ext || 'bin';

    const name = `${randomUUID()}.${ext}`;
    const pathname = path.join(env.STORAGE_LOCATION, name);
    await writeFile(pathname, Buffer.from(fileBuffer));

    uploaded.push({ name, pathname, size: fileBuffer.byteLength, mime, ext });
  }
  return uploaded;
}

async function cleanupFiles(files: UploadedFile[]) {
  await Promise.all(
    files.map((f) => unlink(f.pathname).catch(() => {}))
  );
}

export async function createMessageWithFiles(
  userId: string,
  convId: string,
  data: string,
  files: ArrayBuffer[]
) {
  const uploaded: UploadedFile[] = [];
  try {
    if (files.length > 0) {
      uploaded.push(...(await uploadFiles(files)));
    }

    const row = await createMessage(
      userId,
      convId,
      data,
      JSON.stringify({ type: 'message', files: uploaded })
    );

    return row;
  } catch (err) {
    await cleanupFiles(uploaded);
    throw err;
  }
}

export async function deleteMessage(id: string, convId: string, userId: string) {
  return db
    .delete(message)
    .where(and(eq(message.id, id), eq(message.convId, convId), eq(message.userId, userId)));
}

export async function getMessages(convId: string, cursor?: string | null, limit = 30) {
  let conditions = [eq(message.convId, convId)];
  if (cursor) {
    conditions.push(lt(message.createdAt, new Date(cursor)));
  }

  const rows = await db
    .select()
    .from(message)
    .where(and(...conditions))
    .orderBy(desc(message.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? data.at(-1)!.createdAt.toISOString() : null;

  return { data, hasMore, cursor: nextCursor };
}

export async function touchJoinUpdatedAt(convId: string, userId: string) {
  await db
    .update(join)
    .set({ updatedAt: new Date() })
    .where(and(eq(join.convId, convId), eq(join.userId, userId)));
}
