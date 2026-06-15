import { useState } from 'react';
import type { SummaryMode } from '../lib/types';

interface SummaryResultProps {
  summary: string;
  videoTitle?: string | null;
  mode: SummaryMode;
  onBack: () => void;
}

const modeIcon: Record<SummaryMode, string> = {
  short: '⚡',
  mid: '📋',
  long: '📖',
};

export function SummaryResult({ summary, videoTitle, mode, onBack }: SummaryResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const el = document.createElement('textarea');
      el.value = summary;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 animate-slide-up">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-content-muted hover:text-content-primary transition-colors text-xs py-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Назад
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-xs">{modeIcon[mode]}</span>
          <span className="text-content-muted text-[10px] uppercase tracking-wider">
            Результат
          </span>
        </div>
      </div>

      {/* Название видео */}
      {videoTitle && (
        <div className="flex items-start gap-2 bg-surface-card rounded-lg p-2.5 border border-surface-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
            <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" className="text-content-muted" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-content-primary text-[11px] leading-tight font-medium line-clamp-2">
            {videoTitle}
          </p>
        </div>
      )}

      {/* Текст пересказа */}
      <div className="bg-surface-card rounded-lg border border-surface-border p-3 max-h-[220px] overflow-y-auto custom-scroll">
        <p className="text-content-primary text-[12px] leading-relaxed whitespace-pre-wrap">
          {summary}
        </p>
      </div>

      {/* Кнопка копирования */}
      <button
        onClick={handleCopy}
        className={`
          flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
          text-sm font-semibold transition-all duration-200
          ${copied
            ? 'bg-green-600 text-white border border-green-600'
            : 'bg-surface-card border border-surface-border text-content-muted hover:text-content-primary hover:border-brand/50'
          }
        `}
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Скопировано!
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Копировать
          </>
        )}
      </button>
    </div>
  );
}
