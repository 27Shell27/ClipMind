import { useState, useEffect } from 'react';
import type { SummaryMode, Language } from '../lib/types';

interface Settings {
  mode: SummaryMode;
  language: Language;
}

const DEFAULT_SETTINGS: Settings = {
  mode: 'mid',
  language: 'ru',
};

const VALID_MODES: SummaryMode[] = ['short', 'mid', 'long'];
const VALID_LANGS: Language[] = ['ru', 'en'];

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['summaryMode', 'summaryLanguage'], (result) => {
      // Проверяем сохранённые значения — на случай данных от старой версии.
      const mode = VALID_MODES.includes(result.summaryMode)
        ? (result.summaryMode as SummaryMode)
        : DEFAULT_SETTINGS.mode;
      const language = VALID_LANGS.includes(result.summaryLanguage)
        ? (result.summaryLanguage as Language)
        : DEFAULT_SETTINGS.language;

      setSettings({ mode, language });
      setLoaded(true);
    });
  }, []);

  const updateMode = (mode: SummaryMode) => {
    setSettings((prev) => ({ ...prev, mode }));
    chrome.storage.local.set({ summaryMode: mode });
  };

  const updateLanguage = (language: Language) => {
    setSettings((prev) => ({ ...prev, language }));
    chrome.storage.local.set({ summaryLanguage: language });
  };

  return { settings, loaded, updateMode, updateLanguage };
}
