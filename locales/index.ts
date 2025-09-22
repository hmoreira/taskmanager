import { en } from './en';
import { pt } from './pt';

export type Language = 'en' | 'pt';
export type TranslationKey = keyof typeof en;

export const translations = {
  en,
  pt,
} as const;

export { en, pt };

