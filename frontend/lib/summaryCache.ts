import type { Language, SummaryMode } from './types';

export interface CachedSummary {
  videoUrl: string;
  videoId: string;
  mode: SummaryMode;
  language: Language;
  summary: string;
  videoTitle?: string | null;
  savedAt: number;
}

const CACHE_PREFIX = 'clipmind:summary:';
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

function extractVideoIdFromUrl(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl);

    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '') || null;
    }

    if (url.hostname.includes('youtube.com')) {
      const watchId = url.searchParams.get('v');

      if (watchId) {
        return watchId;
      }

      const shortsMatch = url.pathname.match(/\/shorts\/([^/?#]+)/);
      if (shortsMatch?.[1]) {
        return shortsMatch[1];
      }

      const embedMatch = url.pathname.match(/\/embed\/([^/?#]+)/);
      if (embedMatch?.[1]) {
        return embedMatch[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function makeCacheKey(
  videoUrl: string,
  mode: SummaryMode,
  language: Language,
): string {
  const videoId = extractVideoIdFromUrl(videoUrl) ?? videoUrl;
  const safeVideoId = encodeURIComponent(videoId);

  return `${CACHE_PREFIX}${safeVideoId}:${mode}:${language}`;
}

function getFromStorage<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve(result[key] as T | undefined);
    });
  });
}

function setToStorage(value: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(value, () => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

function removeFromStorage(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

export async function getCachedSummary(
  videoUrl: string,
  mode: SummaryMode,
  language: Language,
): Promise<CachedSummary | null> {
  const key = makeCacheKey(videoUrl, mode, language);
  const cached = await getFromStorage<CachedSummary>(key);

  if (!cached) {
    return null;
  }

  const isExpired = Date.now() - cached.savedAt > MAX_CACHE_AGE_MS;

  if (isExpired) {
    await removeFromStorage(key);
    return null;
  }

  return cached;
}

export async function saveCachedSummary(params: {
  videoUrl: string;
  mode: SummaryMode;
  language: Language;
  summary: string;
  videoTitle?: string | null;
}): Promise<void> {
  const videoId = extractVideoIdFromUrl(params.videoUrl) ?? params.videoUrl;
  const key = makeCacheKey(params.videoUrl, params.mode, params.language);

  const cached: CachedSummary = {
    videoUrl: params.videoUrl,
    videoId,
    mode: params.mode,
    language: params.language,
    summary: params.summary,
    videoTitle: params.videoTitle ?? null,
    savedAt: Date.now(),
  };

  await setToStorage({ [key]: cached });
}
