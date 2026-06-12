import { measureNaturalWidth, prepareWithSegments } from '@chenglou/pretext';
import { prepareRichInline, type PreparedRichInline } from '@chenglou/pretext/rich-inline';
import type { InferSelectModel } from 'drizzle-orm';
import { marked } from 'marked';

import type { message } from '$lib/server/db/schema';
import { postprocessMessage, type SlotMachineUrls } from './postprocess';
import { walkBlocks } from './walker';

type Message = InferSelectModel<typeof message>;

const fontFamily = `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Estedad"`;

const dateTimeFormatter = Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

export type PreparedMessage = Message & {
  html: string;
  time: string;
  timeWidth: number;
  blocks: {
    prepared: PreparedRichInline;
    height: number;
    words: { text: string; font: string; extraWidth?: number }[];
  }[];
  isSingleEmoji?: boolean;
  animatedUrl?: string;
  isSlotMachine?: boolean;
  slotMachine?: SlotMachineUrls;
};

export function prepareMessages(messages: Message[]): PreparedMessage[] {
  return messages
    .map((msg) => {
      const markdown = marked.lexer(msg.data, { breaks: true, gfm: true });
      const steps = walkBlocks(markdown);
      const time = dateTimeFormatter.format(new Date(msg.createdAt));

      const preparedTime = prepareWithSegments(time, `400 12px ${fontFamily}`);
      const timeWidth = measureNaturalWidth(preparedTime);

      const blocks = steps.map((block) => ({
        prepared: prepareRichInline([...block.items]),
        height: block.height,
        words: block.items
      }));
      const html = marked.parser(markdown);
      const trimmed = msg.data.trim().replace(/\uFE0F/g, '');
      const { isSingleEmoji, animatedUrl, isSlotMachine, slotMachine } =
        postprocessMessage(trimmed);

      return {
        html,
        blocks,
        ...msg,
        time,
        timeWidth,
        isSingleEmoji,
        animatedUrl,
        isSlotMachine,
        slotMachine
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
