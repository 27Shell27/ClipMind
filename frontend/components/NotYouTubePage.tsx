import { YouTubeGlyph } from './Logo';

export function NotYouTubePage() {
  const openYouTube = () => {
    chrome.tabs.create({ url: 'https://www.youtube.com' });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-6 animate-fade-in">
      {/* Значок с мягким свечением */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 bg-brand-soft rounded-full blur-xl" />
        <div className="relative w-14 h-14 flex items-center justify-center bg-surface-card rounded-2xl border border-surface-border">
          <YouTubeGlyph size={28} />
        </div>
      </div>

      {/* Текст */}
      <div className="text-center px-4">
        <p className="text-content-primary text-sm font-semibold mb-1.5">
          Работает только с YouTube
        </p>
        <p className="text-content-muted text-xs leading-relaxed">
          Откройте видео на YouTube, чтобы использовать расширение.
        </p>
      </div>

      {/* Кнопка перехода на YouTube */}
      <button
        onClick={openYouTube}
        className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold
          py-2.5 px-5 rounded-lg transition-all duration-200 shadow-[0_0_16px_rgba(255,0,51,0.3)]
          hover:shadow-[0_0_20px_rgba(255,0,51,0.4)]"
      >
        <YouTubeGlyph size={16} />
        Открыть YouTube
      </button>
    </div>
  );
}
