import animEmojiMap from '$lib/assets/anim-emoji.map.json';

const staticPrefix = '/emoji/animated/';

function decodeSlotChar(char: string): number {
  const c = char.charCodeAt(0);
  if (c >= 65 && c <= 90) return c - 65;
  if (c >= 97 && c <= 122) return c - 71;
  if (c >= 48 && c <= 57) return c + 4;
  if (c === 45) return 62;
  if (c === 95) return 63;
  return -1;
}

export type SlotMachineUrls = {
  background: string;
  winningBg?: string;
  handleUrl: string;
  stickers: [string, string, string];
};

export type PostProcessResult = {
  isSingleEmoji: boolean;
  animatedUrl?: string;
  isSlotMachine?: boolean;
  slotMachine?: SlotMachineUrls;
};

export function postprocessMessage(trimmed: string): PostProcessResult {
  let animatedUrl: string | undefined;
  let isSlotMachine = false;
  let slotMachine: SlotMachineUrls | undefined;

  const slotMatch = trimmed.match(/^🎰([A-Za-z0-9_\-])$/);
  if (slotMatch) {
    const diceInfo = (animEmojiMap as any)['🎰'] as
      | { preview: string; outcomes: string[] }
      | undefined;
    if (diceInfo) {
      const raw = decodeSlotChar(slotMatch[1]);
      if (raw >= 0) {
        const value = raw + 1;
        const isWinning = value === 64;
        const outcomes = diceInfo.outcomes;
        const map = [1, 2, 3, 0];

        let leftIdx: number, centerIdx: number, rightIdx: number;
        if (isWinning) {
          leftIdx = 3;
          centerIdx = 9;
          rightIdx = 15;
        } else {
          leftIdx = 4 + map[(value - 1) & 3];
          centerIdx = 10 + map[((value - 1) >> 2) & 3];
          rightIdx = 16 + map[((value - 1) >> 4) & 3];
        }

        slotMachine = {
          background: `${staticPrefix}${outcomes[0]}`,
          winningBg: isWinning ? `${staticPrefix}${outcomes[1]}` : undefined,
          handleUrl: `${staticPrefix}${outcomes[2]}`,
          stickers: [
            `${staticPrefix}${outcomes[leftIdx]}`,
            `${staticPrefix}${outcomes[centerIdx]}`,
            `${staticPrefix}${outcomes[rightIdx]}`
          ]
        };
        animatedUrl = slotMachine.background;
        isSlotMachine = true;
      }
    }
  }

  if (!animatedUrl) {
    const entry = (animEmojiMap as Record<string, unknown>)[trimmed];
    if (typeof entry === 'string') {
      animatedUrl = `${staticPrefix}${entry}`;
    } else if (
      entry &&
      typeof entry === 'object' &&
      'outcomes' in (entry as Record<string, unknown>)
    ) {
      animatedUrl = `${staticPrefix}${(entry as { preview: string }).preview}`;
    }
  }

  if (!animatedUrl) {
    const diceInfo = (animEmojiMap as any)[trimmed] as
      | { preview: string; outcomes: string[] }
      | undefined;
    if (diceInfo) {
      animatedUrl = `${staticPrefix}${diceInfo.preview}`;
    } else {
      for (const [emoji, info] of Object.entries(animEmojiMap)) {
        if (typeof info === 'string') continue;
        if (trimmed.startsWith(emoji)) {
          const rest = trimmed.slice(emoji.length);
          const value = parseInt(rest);
          if (value >= 1 && value <= info.outcomes.length) {
            animatedUrl = `${staticPrefix}${info.outcomes[value - 1]}`;
            break;
          }
        }
      }
    }
  }

  return {
    isSingleEmoji: !!animatedUrl,
    animatedUrl,
    isSlotMachine,
    slotMachine
  };
}
