import type { CustomCardEntry } from './types/ha';

declare global {
  const __CARD_VERSION__: string;

  interface Window {
    customCards?: CustomCardEntry[];
  }
}

export {};
