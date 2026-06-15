import { htmlUnescape } from 'escape-goat';
import type { Token } from 'marked';

const fontFamily = `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Estedad"`;
const codeFontFamily = `"Fira Code", "Cascadia Code", Consolas, "Liberation Mono", Menlo, Courier, monospace`;
const BLOCKQUOTE_MARGIN = 18; // pixels per nesting level (adjust to taste)

export type LineItem = {
  text: string;
  font: string;
  letterSpacing?: number;
  break?: 'normal' | 'never';
  extraWidth?: number;
};

type Line = {
  items: LineItem[];
  height: number;
  /** Blockquote nesting depth – 0 means normal text, 1 first level, etc. */
  blockquote?: number;
};

export function walkBlocks(tokens: Token[]): Line[] {
  const blocks: Line[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;

    switch (token.type) {
      case 'space':
      case 'def':
        continue;
      case 'html':
        blocks.push(...walk([token]));
        break;
      case 'paragraph':
        blocks.push(...walk(token.tokens ?? []));
        break;
      case 'heading': {
        const { font, letterSpacing } = getHeadingFont(token.depth);
        blocks.push({
          items: [{ text: token.text, font, letterSpacing }],
          height: getHeadingLineHeight(token.depth)
        });
        break;
      }
      case 'code': {
        const codeLines = token.text.split('\n');
        for (const line of codeLines) {
          blocks.push({
            items: [{ text: line, font: getCodeFont(), extraWidth: 10 }],
            height: getCodeLineHeight()
          });
        }
        break;
      }
      case 'blockquote': {
        // Recursively process inner tokens, then increase blockquote depth
        const innerLines = walkBlocks(token.tokens ?? []);
        for (const line of innerLines) {
          // Increase depth
          line.blockquote = (line.blockquote ?? 0) + 1;
          // Prepend a margin spacer item – exactly like the code block/ codespan pattern
          line.items[0].extraWidth = line.blockquote * BLOCKQUOTE_MARGIN;
        }
        blocks.push(...innerLines);
        break;
      }
      default:
        break;
    }
  }

  return blocks;
}

/**
 * Walk inline tokens, correctly handling nesting of strong, em, link,
 * and codespan (backtick). Uses a recursive helper to preserve styles.
 */
function walk(tokens: Token[]): Line[] {
  const lines: LineItem[][] = [[]];
  let currentLineIdx = 0;

  function processTokens(tks: Token[], isBold: boolean, isItalic: boolean): void {
    for (const tok of tks) {
      switch (tok.type) {
        case 'strong':
          processTokens(tok.tokens ?? [], true, isItalic);
          break;
        case 'em':
          processTokens(tok.tokens ?? [], isBold, true);
          break;
        case 'link':
          processTokens(tok.tokens ?? [], isBold, isItalic);
          break;
        case 'text':
          lines[currentLineIdx].push({
            text: htmlUnescape(tok.text),
            font: getFontForStyle(isBold, isItalic)
          });
          break;
        case 'codespan':
          lines[currentLineIdx].push({
            text: htmlUnescape(tok.text),
            font: getCodeFont(),
            extraWidth: 9.2
          });
          break;
        case 'br':
          currentLineIdx++;
          lines.push([]);
          break;
        default:
          break;
      }
    }
  }

  processTokens(tokens, false, false);

  return lines
    .filter((line) => line.length > 0)
    .map((line) => ({
      items: line,
      height: 28
    }));
}

function getFontForStyle(bold: boolean, italic: boolean): string {
  const weight = bold ? 700 : 400;
  const style = italic ? 'italic' : 'normal';
  return `${style} ${weight} 16px ${fontFamily}`;
}

function getCodeFont(): string {
  return `400 14px ${codeFontFamily}`;
}

function getCodeLineHeight(): number {
  return 24;
}

function getHeadingFont(depth: number) {
  const sizes: Record<number, { size: number; weight: number; letterSpacing: number }> = {
    1: { size: 24, weight: 800, letterSpacing: -0.6 },
    2: { size: 24, weight: 600, letterSpacing: -0.6 },
    3: { size: 20, weight: 600, letterSpacing: -0.5 },
    4: { size: 18, weight: 600, letterSpacing: -0.45 },
    5: { size: 18, weight: 500, letterSpacing: -0.45 },
    6: { size: 16, weight: 400, letterSpacing: 0 }
  };
  const { size, weight, letterSpacing } = sizes[depth] ?? {
    size: 16,
    weight: 500,
    letterSpacing: 0
  };
  return {
    letterSpacing,
    font: `${weight} ${size}px ${fontFamily}`
  };
}

function getHeadingLineHeight(depth: number): number {
  const sizes: Record<number, number> = {
    1: 32,
    2: 41,
    3: 28,
    4: 28,
    5: 24,
    6: 24
  };
  return sizes[depth] ?? 16;
}
