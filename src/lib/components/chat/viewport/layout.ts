import { walkRichInlineLineRanges, type PreparedRichInline } from '@chenglou/pretext/rich-inline';

export interface MessageLayoutConfig {
  messagePadding: number;
  messageMargin: number;
  containerPadding: number;
  timeGap: number;
  multilineTimeHeight: number;
  mineOffset: number;
  visibleOverflow: number;
}

export const defaultConfig: MessageLayoutConfig = {
  messagePadding: 8,
  messageMargin: 8,
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
  visible: boolean;
  top: number;
}

export interface AllMessagesLayoutInput {
  id: string;
  html: string;
  time: string;
  timeWidth: number;
  userId: string;
  blocks: { prepared: PreparedRichInline; height: number }[];
}

export interface AllMessagesLayoutResult {
  messages: RenderedMessageLayout[];
  fullHeight: number;
}

export function computeAllMessagesLayout(
  preparedMessages: AllMessagesLayoutInput[],
  sender: string,
  containerMaxWidth: number,
  scrollTop: number,
  viewportHeight: number,
  config: MessageLayoutConfig = defaultConfig
): AllMessagesLayoutResult {
  const areaTop = scrollTop;
  const areaBottom = areaTop + viewportHeight;
  const containerWidth = containerMaxWidth * 0.95 - 1 - config.containerPadding;
  let fullHeight = 0;
  const messages: RenderedMessageLayout[] = [];

  for (const msg of preparedMessages) {
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

    fullHeight += config.messageMargin;
    const minePadding = isMine ? config.mineOffset : 0;

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

    if (fullHeight <= areaTop - config.visibleOverflow) visible = false;

    messages.push({
      id: msg.id,
      html: msg.html,
      time: msg.time,
      maxWidth: bubbleWidth,
      isMultiline,
      isMine,
      visible,
      top
    });
  }

  return { messages, fullHeight };
}
