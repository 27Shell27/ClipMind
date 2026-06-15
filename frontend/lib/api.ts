import type { SummaryMode, Language, SummaryResponse } from './types';

// Адрес бэкенда. Замените на реальный, когда сервер будет доступен.
const API_BASE_URL = 'http://localhost:8000';

/**
 * Отправляет ссылку на видео бэкенду и возвращает готовый пересказ.
 * Имена полей в теле запроса совпадают с тем, что ждёт FastAPI:
 * youtube_url, mode, summary_language. Промпт строит сам бэкенд.
 */
export async function summarizeVideo(
  videoUrl: string,
  mode: SummaryMode,
  language: Language,
): Promise<SummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      youtube_url: videoUrl,
      mode,
      summary_language: language,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return (await response.json()) as SummaryResponse;
}

/** Проверяет, ведёт ли ссылка на видео YouTube. */
export function isYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/)/.test(url);
}
