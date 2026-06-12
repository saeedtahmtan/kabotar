import { walkRichInlineLineRanges, type PreparedRichInline } from '@chenglou/pretext/rich-inline';
import type { SlotMachineUrls } from './postprocess';
export interface MessageLayoutConfig {
  messagePadding: number;
  messageMargin: number;
  messageMarginLow: number;
  containerPadding: number;
  timeGap: number;
  multilineTimeHeight: number;
  mineOffset: number;
  visibleOverflow: number;
}

export const defaultConfig: MessageLayoutConfig = {
  messagePadding: 12,
  messageMargin: 4,
  messageMarginLow: 2,
  containerPadding: 16,
  timeGap: 4,
  multilineTimeHeight: 20,
  mineOffset: 20,
  visibleOverflow: 200
};

export interface RenderedMessageLayout {
  id: string;
  html: string;
  time: string;
  maxWidth: number;
  isMultiline: boolean;
  isMine: boolean;
  showTime: boolean;
  visible: boolean;
  after: boolean;
  before: boolean;
  top: number;
  isSingleEmoji?: boolean;
  animatedUrl?: string;
  isSlotMachine?: boolean;
  slotMachine?: SlotMachineUrls;
}

export interface AllMessagesLayoutInput {
  id: string;
  html: string;
  time: string;
  timeWidth: number;
  userId: string;
  createdAt: string | Date;
  blocks: { prepared: PreparedRichInline; height: number }[];
  isSingleEmoji?: boolean;
  animatedUrl?: string;
  isSlotMachine?: boolean;
  slotMachine?: SlotMachineUrls;
}

export interface AllMessagesLayoutResult {
  messages: RenderedMessageLayout[];
  fullHeight: number;
}

export function computeAllMessagesLayout(
  Messages: AllMessagesLayoutInput[],
  sender: string,
  viewportWidth: number,
  scrollTop: number,
  viewportHeight: number,
  config: MessageLayoutConfig = defaultConfig
): AllMessagesLayoutResult {
  const areaTop = scrollTop;
  const areaBottom = areaTop + viewportHeight;
  const containerWidth = viewportWidth * 0.9 - 1 - config.containerPadding;
  let fullHeight = 8;
  let pointer = 0;
  const messages: RenderedMessageLayout[] = [];

  for (const msg of Messages) {
    const before = pointer == 0 ? false : Messages[pointer - 1].userId === msg.userId;
    const after = pointer + 1 < Messages.length && Messages[pointer + 1].userId === msg.userId;

    const top = fullHeight;
    let visible = top < areaBottom + config.visibleOverflow;
    let bubbleWidth = config.messagePadding;
    let totalLineCount = 0;
    let isMultiline = false;
    const isMine = sender === msg.userId;

    for (const block of msg.blocks) {
      const lineCount = walkRichInlineLineRanges(block.prepared, containerWidth, (line) => {
        const lineWidth = Math.ceil(line.width + config.messagePadding);
        if (lineWidth > bubbleWidth) bubbleWidth = lineWidth;
      });
      fullHeight += block.height * lineCount;
      totalLineCount += lineCount;
    }

    if (msg.isSingleEmoji) {
      bubbleWidth = Math.max(bubbleWidth, 112 + config.messagePadding);
      fullHeight += 84; // bump from text line-height (28px) to image height (112px)
    }

    fullHeight += after ? config.messageMarginLow : config.messageMargin;
    const minePadding = isMine ? config.mineOffset : 0;

    const prevMsg = pointer > 0 ? Messages[pointer - 1] : null;
    const showTime =
      !prevMsg ||
      prevMsg.userId !== msg.userId ||
      Math.floor(new Date(msg.createdAt).getTime() / 60000) !==
        Math.floor(new Date(prevMsg.createdAt).getTime() / 60000);

    if (showTime) {
      if (
        msg.timeWidth + bubbleWidth + minePadding + config.timeGap >= containerWidth ||
        totalLineCount > 1
      ) {
        isMultiline = true;
        bubbleWidth = Math.max(msg.timeWidth + minePadding + config.messagePadding, bubbleWidth);
        fullHeight += config.multilineTimeHeight;
      } else {
        bubbleWidth += msg.timeWidth + minePadding + config.timeGap;
      }
    } else {
      isMultiline = totalLineCount > 1;
    }

    if (fullHeight <= areaTop - config.visibleOverflow) visible = false;

    messages.push({
      id: msg.id,
      html: msg.html,
      time: msg.time,
      maxWidth: bubbleWidth,
      isMultiline,
      isMine,
      showTime,
      visible,
      after,
      before,
      top,
      isSingleEmoji: msg.isSingleEmoji,
      animatedUrl: msg.animatedUrl,
      isSlotMachine: msg.isSlotMachine,
      slotMachine: msg.slotMachine,
    });

    pointer++;
  }

  return { messages, fullHeight };
}
