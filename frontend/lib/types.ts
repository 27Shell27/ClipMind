// Режимы пересказа. Значения совпадают с enum бэкенда (short / mid / long).
export type SummaryMode = 'short' | 'mid' | 'long';

// Язык ПЕРЕСКАЗА (не интерфейса). Интерфейс всегда русский.
export type Language = 'ru' | 'en';

// Форма ответа бэкенда.
export interface SummaryResponse {
  summary: string;
  videoTitle?: string;
}
