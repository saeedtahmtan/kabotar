import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function nFormat(n: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(n);
}

export function formatLastSeen(date: Date | null | undefined): string {
  if (!date) return 'Offline';
  return formatDistanceToNow(date, {
    addSuffix: true
  });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export { binaryEncode, binaryDecode, type BinaryStruct, type BinaryData } from '$lib/binary';
