import { useEffect, useState } from 'react';
import { LoadingBar } from '../../components/LoadingBar';
import { Logo } from '../../components/Logo';
import { LanguageToggle } from '../../components/LanguageToggle';
import { ModeSelector } from '../../components/ModeSelector';
import { NotYouTubePage } from '../../components/NotYouTubePage';
import { SummaryResult } from '../../components/SummaryResult';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';
import { useYouTubeTab } from '../../hooks/useYouTubeTab';
import { summarizeVideo } from '../../lib/api';
import { t } from '../../lib/i18n';
import { getCachedSummary, saveCachedSummary } from '../../lib/summaryCache';
import type { SummaryMode } from '../../lib/types';

const UI_LANG = 'ru' as const;

type View = 'main' | 'loading' | 'result';

export function App() {
  const { isYouTube, videoUrl, isLoading: tabLoading } = useYouTubeTab();
  const { settings, loaded: settingsLoaded, updateMode, updateLanguage } = useSettings();
  const { theme, loaded: themeLoaded, toggleTheme } = useTheme();

  const [view, setView] = useState<View>('main');
  const [summary, setSummary] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  useEffect(() => {
    if (tabLoading || !settingsLoaded) {
      return;
    }

    if (!videoUrl) {
      setCacheLoaded(true);
      return;
    }

    let cancelled = false;

    async function restoreCachedSummary() {
      setCacheLoaded(false);

      try {
        const cached = await getCachedSummary(
          videoUrl,
          settings.mode,
          settings.language,
        );

        if (cancelled) {
          return;
        }

        if (cached) {
          setSummary(cached.summary);
          setVideoTitle(cached.videoTitle ?? null);
          setError(null);
          setView('result');
          return;
        }

        setSummary(null);
        setVideoTitle(null);
        setError(null);
        setView((currentView) => {
          if (currentView === 'loading') {
            return currentView;
          }

          return 'main';
        });
      } catch {
        if (!cancelled) {
          setView((currentView) => {
            if (currentView === 'loading') {
              return currentView;
            }

            return 'main';
          });
        }
      } finally {
        if (!cancelled) {
          setCacheLoaded(true);
        }
      }
    }

    restoreCachedSummary();

    return () => {
      cancelled = true;
    };
  }, [
    tabLoading,
    settingsLoaded,
    videoUrl,
    settings.mode,
    settings.language,
  ]);

  const handleSummarize = async () => {
    if (!videoUrl) {
      return;
    }

    setView('loading');
    setError(null);

    try {
      const result = await summarizeVideo(
        videoUrl,
        settings.mode,
        settings.language,
      );

      setSummary(result.summary);
      setVideoTitle(result.videoTitle ?? null);

      await saveCachedSummary({
        videoUrl,
        mode: settings.mode,
        language: settings.language,
        summary: result.summary,
        videoTitle: result.videoTitle ?? null,
      });

      setView('result');
    } catch {
      setError(t(UI_LANG, 'errorOccurred'));
      setView('main');
    }
  };

  const handleBackToMain = () => {
    setView('main');
  };

  const isInitialLoading = tabLoading || !settingsLoaded || !themeLoaded || !cacheLoaded;

  if (isInitialLoading) {
    return (
      <div className="flex h-[420px] w-[380px] items-center justify-center bg-surface-bg text-content-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!isYouTube) {
    return (
      <div className="w-[380px] bg-surface-bg text-content-primary">
        <Header
          isYouTube={false}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
        <NotYouTubePage language={UI_LANG} />
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-surface-bg text-content-primary">
      <Header
        isYouTube={isYouTube}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <main className="px-5 pb-5">
        {view === 'main' && (
          <div className="animate-fade-in space-y-5">
            <ModeSelector
              value={settings.mode}
              onChange={updateMode}
              language={UI_LANG}
            />

            <LanguageToggle
              value={settings.language}
              onChange={updateLanguage}
            />

            {error && (
              <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSummarize}
              className="w-full rounded-2xl px-5 py-4 text-base font-semibold text-white shadow-lg transition hover:scale-[1.01] active:scale-[0.99]"
              style={{ backgroundColor: '#FF0033' }}
            >
              {t(UI_LANG, 'summarizeBtn')}
            </button>
          </div>
        )}

        {view === 'loading' && <LoadingBar language={UI_LANG} />}

        {view === 'result' && summary && (
          <SummaryResult
            summary={summary}
            videoTitle={videoTitle}
            mode={settings.mode as SummaryMode}
            language={UI_LANG}
            onBack={handleBackToMain}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

interface HeaderProps {
  isYouTube: boolean;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

function Header({ isYouTube, theme, onThemeToggle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <Logo size={34} />
        <div>
          <h1 className="text-lg font-bold leading-tight">ClipMind</h1>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-content-secondary">
            <span
              className={`h-2 w-2 rounded-full ${
                isYouTube ? 'bg-green-500' : 'bg-content-muted'
              }`}
            />
            <span>{isYouTube ? 'YouTube видео найдено' : 'Ожидание YouTube'}</span>
          </div>
        </div>
      </div>

      <ThemeToggle
        theme={theme}
        onToggle={onThemeToggle}
        language={UI_LANG}
      />
    </header>
  );
}

function Footer() {
  return (
    <footer className="px-5 pb-4 pt-2 text-center text-[11px] text-content-muted">
      Могут присутствовать неточности
    </footer>
  );
}
