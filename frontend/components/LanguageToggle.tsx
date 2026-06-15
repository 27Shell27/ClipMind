import type { Language } from '../lib/types';

interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
  disabled?: boolean;
}

// Подписи языков пересказа — только текст, без флагов (эмодзи-флаги не отображаются на Windows)
const LANGS: Array<{ key: Language; label: string }> = [
  { key: 'ru', label: 'Русский' },
  { key: 'en', label: 'Английский' },
];

export function LanguageToggle({ value, onChange, disabled }: LanguageToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-content-muted text-[10px] uppercase tracking-wider font-medium">
        Язык пересказа
      </span>
      <div className="flex gap-1 p-0.5 bg-surface-card rounded-lg border border-surface-border">
        {LANGS.map(({ key, label }) => {
          const isActive = value === key;
          return (
            <button
              key={key}
              onClick={() => !disabled && onChange(key)}
              disabled={disabled}
              className={`
                flex-1 flex items-center justify-center py-1.5 px-3 rounded-md
                text-sm font-semibold transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                ${isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-content-muted hover:text-content-primary'
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
