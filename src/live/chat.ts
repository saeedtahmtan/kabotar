// realtime-allow-public
import { db } from '$lib/server/db';
import { message } from '$lib/server/db/schema';
import { binaryDecode as b } from '$lib/utils';
import { and, desc, eq } from 'drizzle-orm';
import { live, LiveError, type LiveContext } from 'svelte-realtime';

import { htmlEscape } from 'escape-goat';
import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { env } from '$env/dynamic/private';
import { unlink, writeFile } from 'fs/promises';
import path from 'path';

export const msgSend = live.binary(async (ctx: LiveContext<any>, buffer) => {
  const [convId, data, filesBuffer] = b(buffer, ['string', 'string', 'buffer']) as [string, string, ArrayBuffer];
  const files = b(filesBuffer, ['buffer']) as ArrayBuffer[];

  const cleanText = htmlEscape(data.trim());

  if (!cleanText.length && files.length === 0) return;

  const uploadedFiles: { name: string; pathname: string; size: number, mime: string, ext: string }[] = [];

  try {
    for (const fileBuffer of files) {
      const detectedType = await fileTypeFromBuffer(Buffer.from(fileBuffer));
      const mime = detectedType?.mime || 'application/octet-stream';
      const ext = detectedType?.ext || 'bin';

      const name = `${randomUUID()}.${ext}`;
      const pathname = path.join(env.STORAGE_LOCATION, name);
      await writeFile(pathname, Buffer.from(fileBuffer));

      uploadedFiles.push({
        name,
        pathname,
        size: fileBuffer.byteLength,
        mime,
        ext
      });
    }

    const [result] = await db
      .insert(message)
      .values({
        userId: ctx.user.id,
        convId,
        meta: JSON.stringify({
          type: 'message',
          files: uploadedFiles,
        }),
        data: cleanText,
      })
      .returning();

    if (!result) throw new LiveError('Insert failed', 'NO_RETURN');

    ctx.publish(`msg:${convId}`, 'created', result);
  } catch (err) {
    for (const file of uploadedFiles) {
      await unlink(file.pathname).catch(e => console.error('Failed to delete file:', file.pathname, e));
    }
    if ((err as { code?: string })?.code?.startsWith?.('SQLITE_CONSTRAINT')) {
      throw new LiveError('Invalid conversation or user', 'CONSTRAINT');
    }
    throw err;
  }
});

export const msgDelete = live(async (ctx: LiveContext<any>, convId: string, id: string) => {
  const result = await db
    .delete(message)
    .where(and(eq(message.id, id), eq(message.convId, convId), eq(message.userId, ctx.user.id)));

  if (result.rowsAffected > 0) ctx.publish(`msg:${convId}`, 'deleted', { id });
});

export const msgStream = live.stream(
  (ctx, convId) => `msg:${convId}`,
  async (ctx, convId) => {
    const limit = 30;
    const page = (ctx.cursor as number) || 0;  // cursor is a number (page index)
    const offset = page * limit;

    const rows = await db
      .select()
      .from(message)
      .where(eq(message.convId, convId))
      .orderBy(desc(message.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page + 1 : null;  // return a number as cursor

    return { data, hasMore, cursor: nextCursor };
  },
  { merge: 'crud', key: 'id' }
);
