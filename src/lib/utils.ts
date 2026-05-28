import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };


export type BinaryStruct =
  'string' | 'number' | 'buffer' | 'date' | 'boolean'


export type BinaryData = string | number | ArrayBuffer | Date | boolean;

// -------- ENCODE --------
export function binaryEncode(items: { struct: BinaryStruct; data: BinaryData }[]): ArrayBuffer {
  const buffers: Uint8Array[] = [];

  // item count (4 bytes)
  const countBuffer = new ArrayBuffer(4);
  new DataView(countBuffer).setUint32(0, items.length, true);
  buffers.push(new Uint8Array(countBuffer));

  for (const { struct, data } of items) {
    let rawData: Uint8Array;

    switch (struct) {
      case 'string':
        rawData = new TextEncoder().encode(data as string);
        break;
      case 'number':
        {
          const buf = new ArrayBuffer(8);
          new DataView(buf).setFloat64(0, data as number, true);
          rawData = new Uint8Array(buf);
        }
        break;
      case 'buffer':
        rawData = new Uint8Array(data as ArrayBuffer);
        break;
      case 'date':
        {
          const timestamp = (data as Date).getTime();
          const buf = new ArrayBuffer(8);
          new DataView(buf).setFloat64(0, timestamp, true);
          rawData = new Uint8Array(buf);
        }
        break;
      case 'boolean':
        {
          const buf = new ArrayBuffer(1);
          new DataView(buf).setUint8(0, (data as boolean) ? 1 : 0);
          rawData = new Uint8Array(buf);
        }
        break;
      default:
        throw new Error(`Unsupported type: ${struct}`);
    }

    // length prefix (4 bytes)
    const lenBuf = new ArrayBuffer(4);
    new DataView(lenBuf).setUint32(0, rawData.byteLength, true);
    buffers.push(new Uint8Array(lenBuf));
    buffers.push(rawData);
  }

  const totalLength = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of buffers) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result.buffer;
}

// -------- DECODE --------
export function binaryDecode(buffer: ArrayBuffer, structs: BinaryStruct[]): BinaryData[] {
  const view = new DataView(buffer);
  let offset = 0;

  const count = view.getUint32(offset, true);
  offset += 4;

  const result: BinaryData[] = [];

  for (let i = 0; i < count; i++) {
    const struct = i < structs.length ? structs[i] : structs.at(-1);

    const len = view.getUint32(offset, true);
    offset += 4;

    let data: BinaryData;

    switch (struct) {
      case 'string':
        {
          const bytes = new Uint8Array(buffer, offset, len);
          data = new TextDecoder().decode(bytes);
        }
        break;
      case 'number':
        if (len !== 8) throw new Error(`Invalid length for number: expected 8, got ${len}`);
        data = view.getFloat64(offset, true);
        break;
      case 'buffer':
        data = buffer.slice(offset, offset + len);
        break;
      case 'date':
        if (len !== 8) throw new Error(`Invalid length for date: expected 8, got ${len}`);
        const timestamp = view.getFloat64(offset, true);
        data = new Date(timestamp);
        break;
      case 'boolean':
        if (len !== 1) throw new Error(`Invalid length for boolean: expected 1, got ${len}`);
        data = view.getUint8(offset) === 1;
        break;
      default:
        throw new Error(`Unsupported type: ${struct}`);
    }

    result.push(data);
    offset += len;
  }

  return result;
}
