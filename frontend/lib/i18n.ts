import type { Language } from './types';

export const translations: Record<Language, Record<string, string>> = {
  ru: {
    appTitle: 'ClipMind',
    appSubtitle: 'AI-пересказ YouTube-видео',

    summarizeBtn: 'Пересказать',
    errorOccurred: 'Произошла ошибка. Проверьте подключение к бэкенду и попробуйте снова.',

    themeToggle: 'Переключить тему',

    selectMode: 'Режим пересказа',
    modeShort: 'Краткий',
    modeModerate: 'Умеренный',
    modeDetailed: 'Подробный',
    modeShortDesc: '3–5 предложений',
    modeModerateDesc: '1–2 абзаца',
    modeDetailedDesc: 'Детальный разбор',

    shortMode: 'Краткий',
    moderateMode: 'Умеренный',
    detailedMode: 'Подробный',
    shortDesc: '3–5 предложений',
    moderateDesc: '1–2 абзаца',
    detailedDesc: 'Детальный разбор',

    languageTitle: 'Язык пересказа',
    languageRu: 'Русский',
    languageEn: 'Английский',

    loadingTitle: 'Готовлю пересказ',
    loadingStep1: 'Получаю текст видео',
    loadingStep2: 'Анализирую содержание',
    loadingStep3: 'Формирую пересказ',

    resultTitle: 'Результат',
    resultSubtitle: 'Готовый пересказ видео',
    back: 'Назад',
    copy: 'Копировать',
    copyBtn: 'Копировать',
    copied: 'Скопировано!',

    notYouTubeTitle: 'Откройте YouTube-видео',
    notYouTubeDescription: 'ClipMind работает только на страницах YouTube-видео.',
    openYouTube: 'Открыть YouTube',

    youtubeVideoFound: 'YouTube видео найдено',
    waitingYouTube: 'Ожидание YouTube',
    disclaimer: 'Могут присутствовать неточности',
  },

  en: {
    appTitle: 'ClipMind',
    appSubtitle: 'AI summary for YouTube videos',

    summarizeBtn: 'Summarize',
    errorOccurred: 'Something went wrong. Check the backend connection and try again.',

    themeToggle: 'Toggle theme',

    selectMode: 'Summary mode',
    modeShort: 'Short',
    modeModerate: 'Moderate',
    modeDetailed: 'Detailed',
    modeShortDesc: '3–5 sentences',
    modeModerateDesc: '1–2 paragraphs',
    modeDetailedDesc: 'Detailed breakdown',

    shortMode: 'Short',
    moderateMode: 'Moderate',
    detailedMode: 'Detailed',
    shortDesc: '3–5 sentences',
    moderateDesc: '1–2 paragraphs',
    detailedDesc: 'Detailed breakdown',

    languageTitle: 'Summary language',
    languageRu: 'Russian',
    languageEn: 'English',

    loadingTitle: 'Preparing summary',
    loadingStep1: 'Getting video transcript',
    loadingStep2: 'Analyzing content',
    loadingStep3: 'Creating summary',

    resultTitle: 'Result',
    resultSubtitle: 'Generated video summary',
    back: 'Back',
    copy: 'Copy',
    copyBtn: 'Copy',
    copied: 'Copied!',

    notYouTubeTitle: 'Open a YouTube video',
    notYouTubeDescription: 'ClipMind works only on YouTube video pages.',
    openYouTube: 'Open YouTube',

    youtubeVideoFound: 'YouTube video found',
    waitingYouTube: 'Waiting for YouTube',
    disclaimer: 'There may be inaccuracies',
  },
};

export type TranslationKey = string;

export function t(language: Language, key: TranslationKey): string {
  const dict = translations[language] ?? translations.ru;
  return dict[key] ?? translations.ru[key] ?? key;
}
