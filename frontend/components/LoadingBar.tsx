import { useEffect, useState } from 'react';

// Фразы статуса показываются по очереди, пока идёт запрос.
const STEPS = [
  'Получаю данные видео...',
  'Анализирую содержимое...',
  'Формирую пересказ...',
];

export function LoadingBar() {
  const [stepIndex, setStepIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 2000);
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => {
      clearInterval(stepTimer);
      clearInterval(dotTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
      {/* Бегущая полоса в стиле YouTube */}
      <div className="w-full h-0.5 bg-surface-border rounded-full overflow-hidden relative">
        <div className="h-full bg-brand rounded-full animate-progress absolute" />
      </div>

      {/* Вращающееся кольцо со знаком ClipMind */}
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-surface-border flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-brand animate-spin" />
        </div>
        <div className="absolute">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="5" fill="#FF0033" />
            <polygon points="9.5,8.5 9.5,15.5 16,12" fill="white" />
          </svg>
        </div>
      </div>

      {/* Текст статуса */}
      <p className="text-content-muted text-xs text-center min-h-[16px]">
        {STEPS[stepIndex]}{dots}
      </p>
    </div>
  );
}
