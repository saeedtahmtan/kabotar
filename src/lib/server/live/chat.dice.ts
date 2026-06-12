import animEmojiMap from '$lib/assets/anim-emoji.map.json';

const EMOJI_MAP = animEmojiMap as Record<string, { preview: string; outcomes: string[] }>;

export function encodeSlotValue(value: number): string {
  if (value <= 26) return String.fromCharCode(64 + value);
  if (value <= 52) return String.fromCharCode(70 + value);
  if (value <= 62) return String.fromCharCode(value - 5);
  if (value === 63) return '-';
  return '_';
}

export function decodeSlotChar(char: string): number {
  const c = char.charCodeAt(0);
  if (c >= 65 && c <= 90) return c - 65;
  if (c >= 97 && c <= 122) return c - 71;
  if (c >= 48 && c <= 57) return c + 4;
  if (c === 45) return 62;
  if (c === 95) return 63;
  return -1;
}

export function rollDice(text: string): string {
  const entry = EMOJI_MAP[text];
  if (!entry || entry.outcomes.length === 0) return text;

  if (text === '🎰') {
    const value = Math.floor(Math.random() * 64) + 1;
    return `🎰${encodeSlotValue(value)}`;
  }

  const value = Math.floor(Math.random() * entry.outcomes.length) + 1;
  return `${text}${value}`;
}
