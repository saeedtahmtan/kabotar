// realtime-allow-public
import { createMessageWithFiles, deleteMessage, getMessages, touchJoinUpdatedAt } from '$lib/server/db/models/message';
import { binaryDecode as b } from '$lib/utils';
import { live, LiveError, type LiveContext } from 'svelte-realtime';
import { rollDice } from '$lib/server/live/chat.dice';
import { htmlEscape } from 'escape-goat';

export const msgSend = live.binary(async (ctx: LiveContext<any>, buffer) => {
  const [convId, data, filesBuffer] = b(buffer, ['string', 'string', 'buffer']) as [
    string,
    string,
    ArrayBuffer
  ];
  const files = b(filesBuffer, ['buffer']) as ArrayBuffer[];

  let cleanText = htmlEscape(data.trim());

  if (!cleanText.length && files.length === 0) return;

  cleanText = rollDice(cleanText);

  try {
    const result = await createMessageWithFiles(ctx.user.id, convId, cleanText, files);

    if (!result) throw new LiveError('Insert failed', 'NO_RETURN');

    ctx.publish(`msg:${convId}`, 'created', result);
  } catch (err) {
    if ((err as { code?: string })?.code?.startsWith?.('SQLITE_CONSTRAINT')) {
      throw new LiveError('Invalid conversation or user', 'CONSTRAINT');
    }
    throw err;
  }
});

export const msgDelete = live(async (ctx: LiveContext<any>, convId: string, id: string) => {
  const result = await deleteMessage(id, convId, ctx.user.id);

  if (result.rowsAffected > 0) ctx.publish(`msg:${convId}`, 'deleted', { id });
});

export const msgStream = live.stream(
  (ctx, convId) => `msg:${convId}`,
  async (ctx, convId) => getMessages(convId, ctx.cursor as string | null),
  {
    merge: 'crud',
    key: 'id',
    async onSubscribe(ctx, topic) {
      const convId = topic.slice(4);
      await touchJoinUpdatedAt(convId, ctx.user.id);
    }
  }
);
