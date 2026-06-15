import { useState, type ReactNode } from 'react';
import { useYouTubeTab } from '../../hooks/useYouTubeTab';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../hooks/useTheme';
import { summarizeVideo } from '../../lib/api';
import { ModeSelector } from '../../components/ModeSelector';
import { LanguageToggle } from '../../components/LanguageToggle';
import { LoadingBar } from '../../components/LoadingBar';
import { SummaryResult } from '../../components/SummaryResult';
import { NotYouTubePage } from '../../components/NotYouTubePage';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Logo } from '../../components/Logo';

type View = 'main' | 'loading' | 'result';

export function App() {
  const { isYouTube, videoUrl, isLoading: tabLoading } = useYouTubeTab();
  const { settings, loaded: settingsLoaded, updateMode, updateLanguage } = useSettings();
  const { theme, loaded: themeLoaded, toggleTheme } = useTheme();

  const [view, setView] = useState<View>('main');
  const [summary, setSummary] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!videoUrl) return;
    setView('loading');
    setError(null);
    try {
      // settings.language — это язык ПЕРЕСКАЗА, его и передаём бэкенду.
      const result = await summarizeVideo(videoUrl, settings.mode, settings.language);
      setSummary(result.summary);
      setVideoTitle(result.videoTitle ?? null);
      setView('result');
    } catch {
      setError('Произошла ошибка. Попробуйте снова.');
      setView('main');
    }
  };

  const handleBack = () => {
    setView('main');
    setSummary(null);
    setVideoTitle(null);
  };

  // Первичная загрузка (вкладка / настройки / тема ещё не готовы)
  if (tabLoading || !settingsLoaded || !themeLoaded) {
    return (
      <div className="w-[340px] min-h-[200px] bg-surface-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-surface-border border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const themeButton = <ThemeToggle theme={theme} onToggle={toggleTheme} />;

  // Вкладка — не YouTube
  if (!isYouTube) {
    return (
      <div className="w-[340px] bg-surface-bg p-4">
        <Header isYouTube={false} controls={themeButton} />
        <NotYouTubePage />
        <Footer />
      </div>
    );
  }

  return (
    <div className="w-[340px] bg-surface-bg">
      <div className="p-4 flex flex-col gap-4">
        <Header isYouTube controls={themeButton} />

        {view === 'main' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <ModeSelector value={settings.mode} onChange={updateMode} />
            <LanguageToggle value={settings.language} onChange={updateLanguage} />

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" />
                  <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-red-500 text-xs">{error}</p>
              </div>
            )}

            <button
              onClick={handleSummarize}
              style={{ backgroundColor: '#FF0033' }}
              className="
                flex items-center justify-center gap-2 w-full py-3 rounded-xl
                hover:bg-brand-hover text-white font-bold text-sm
                transition-all duration-200
                shadow-[0_0_20px_rgba(255,0,51,0.25)]
                hover:shadow-[0_0_28px_rgba(255,0,51,0.45)]
                active:scale-[0.98]
                animate-pulse-brand
              "
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke="white" strokeWidth="1.5" />
                <path d="M9 7v10l7-5-7-5z" fill="white" />
              </svg>
              Пересказать
            </button>
          </div>
        )}

        {view === 'loading' && <LoadingBar />}

        {view === 'result' && summary && (
          <SummaryResult
            summary={summary}
            videoTitle={videoTitle}
            mode={settings.mode}
            onBack={handleBack}
          />
        )}

        <Footer />
      </div>
    </div>
  );
}

function Header({ isYouTube, controls }: { isYouTube: boolean; controls: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center w-8 h-8 bg-surface-card rounded-lg border border-surface-border">
        <Logo size={20} />
      </div>
      <div>
        <h1 className="text-content-primary text-sm font-bold leading-none tracking-tight">
          ClipMind
        </h1>
        <p className="text-content-muted text-[10px] mt-0.5">на базе ИИ</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isYouTube && (
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_4px_rgba(74,222,128,0.8)]" />
        )}
        {controls}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="border-t border-surface-border pt-3">
      <p className="text-content-faint text-[9px] text-center tracking-wider uppercase">
        Могут присутствовать неточности
      </p>
    </div>
  );
}
