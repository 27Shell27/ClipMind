import type { SummaryMode } from '../lib/types';

interface ModeSelectorProps {
  value: SummaryMode;
  onChange: (mode: SummaryMode) => void;
  disabled?: boolean;
}

// Данные кнопок лежат рядом — без отдельных карт переводов.
const MODES: Array<{ key: SummaryMode; icon: string; label: string; desc: string }> = [
  { key: 'short', icon: '⚡', label: 'Краткий', desc: '3–5 предложений' },
  { key: 'mid', icon: '📋', label: 'Умеренный', desc: '1–2 абзаца' },
  { key: 'long', icon: '📖', label: 'Подробный', desc: 'Полный разбор' },
];

export function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-content-muted text-[10px] uppercase tracking-wider font-medium">
        Режим пересказа
      </span>
      <div className="flex gap-1.5">
        {MODES.map(({ key, icon, label, desc }) => {
          const isActive = value === key;
          return (
            <button
              key={key}
              onClick={() => !disabled && onChange(key)}
              disabled={disabled}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg
                border text-center transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                ${isActive
                  ? 'bg-brand border-brand text-white shadow-[0_0_12px_rgba(255,0,51,0.3)]'
                  : 'bg-surface-card border-surface-border text-content-muted hover:border-brand/50 hover:text-content-primary'
                }
              `}
            >
              <span className="text-base leading-none">{icon}</span>
              <span className="text-[10px] font-semibold leading-tight">{label}</span>
              <span className={`text-[9px] leading-tight ${isActive ? 'text-white/70' : 'text-content-muted/60'}`}>
                {desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
