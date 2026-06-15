# ClipMind — Полная документация по коду

Подробный разбор каждого файла и папки расширения ClipMind: что делает, как
устроено, как файлы связаны между собой. Документ рассчитан на то, чтобы
человек, впервые открывший проект, понял его целиком.

---

## 1. Что это и как работает в целом

ClipMind — это расширение для Chrome, которое берёт ссылку с открытой вкладки
YouTube, отправляет её на бэкенд с нейросетью и показывает готовый пересказ
видео. Пользователь выбирает режим пересказа (краткий / умеренный / подробный),
язык пересказа (русский / английский) и тему оформления (светлая / тёмная).

Технологический стек:

- **WXT** — фреймворк для сборки расширений. Берёт на себя манифест, сборку,
  структуру папок и горячую перезагрузку. Под капотом использует Vite.
- **React** — библиотека для построения интерфейса попапа.
- **TypeScript** — типизированный JavaScript: ловит ошибки до запуска.
- **Tailwind CSS** — утилитарный CSS: стили задаются классами прямо в разметке.

Жизненный цикл одного использования:

1. Пользователь нажимает на иконку расширения на панели Chrome.
2. Открывается попап — это маленькое React-приложение (`entrypoints/popup`).
3. Приложение спрашивает у Chrome, какая вкладка активна (`useYouTubeTab`).
4. Если это YouTube-видео — показывается основной экран с настройками.
5. По нажатию «Пересказать» ссылка уходит на бэкенд (`lib/api.ts`).
6. Пока идёт запрос — крутится анимация загрузки (`LoadingBar`).
7. Ответ показывается на экране результата (`SummaryResult`).

Отдельно в фоне работает сервис-воркер (`entrypoints/background.ts`), который
рисует значок ▶ на иконке расширения, когда открыта вкладка с YouTube-видео.

---

## 2. Карта проекта

```
clipmind/
├── entrypoints/            ← точки входа расширения (то, что запускает Chrome)
│   ├── background.ts        фоновый сервис-воркер (значок на иконке)
│   └── popup/               окно, которое открывается по клику на иконку
│       ├── index.html        HTML-каркас попапа
│       ├── main.tsx          запуск React внутрь index.html
│       ├── App.tsx           главный компонент: вся логика и экраны
│       └── style.css         базовые стили + переменные тем
│
├── components/             ← переиспользуемые куски интерфейса
│   ├── Logo.tsx              логотип ClipMind и значок YouTube
│   ├── ThemeToggle.tsx       кнопка переключения светлая/тёмная
│   ├── ModeSelector.tsx      выбор режима пересказа (3 кнопки)
│   ├── LanguageToggle.tsx    выбор языка пересказа (2 кнопки)
│   ├── LoadingBar.tsx        анимация ожидания ответа
│   ├── SummaryResult.tsx     экран готового пересказа + копирование
│   └── NotYouTubePage.tsx    экран «вы не на YouTube»
│
├── hooks/                  ← переиспользуемая логика React (хуки)
│   ├── useSettings.ts        хранит режим и язык пересказа
│   ├── useTheme.ts           хранит и применяет тему
│   └── useYouTubeTab.ts      определяет активную вкладку
│
├── lib/                    ← «чистая» логика без React
│   ├── types.ts              общие типы TypeScript
│   ├── i18n.ts               все тексты на RU и EN
│   └── api.ts                запрос к бэкенду + промпты + проверка URL
│
├── public/                ← статика, копируется в сборку как есть
│   └── icon/                 иконки расширения 16/32/48/128 px
│
├── package.json           зависимости и команды
├── wxt.config.ts          конфигурация WXT (манифест, настройки сборки)
├── tsconfig.json          конфигурация TypeScript
├── tailwind.config.ts     конфигурация Tailwind (цвета, анимации)
└── postcss.config.ts      подключение Tailwind к процессу сборки
```

Принцип разделения: `lib` — логика без интерфейса, `hooks` — логика, завязанная
на React-состояние, `components` — внешний вид, `entrypoints` — точки, которые
запускает браузер. Такое разделение упрощает понимание и тестирование.

---

## 3. Конфигурационные файлы

### package.json

Манифест npm-проекта: имя, версия, команды и список зависимостей.

```json
{
  "name": "clipmind",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wxt dev",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "postinstall": "wxt prepare"
  },
  ...
}
```

- `"type": "module"` — говорит Node.js, что файлы проекта используют современный
  синтаксис модулей (`import`/`export`). Без этой строки Node ругается на
  конфиги вроде `wxt.config.ts` и сборка может вести себя непредсказуемо.
- `scripts` — короткие команды:
  - `npm run dev` — режим разработки с автообновлением;
  - `npm run build` — финальная сборка в папку `.output/chrome-mv3`;
  - `npm run build:firefox` — то же, но под Firefox;
  - `postinstall` — выполняется автоматически после `npm install`, готовит
    служебные файлы WXT (папку `.wxt`).
- `dependencies` — то, что нужно расширению в рантайме: `react`, `react-dom`.
- `devDependencies` — то, что нужно только при разработке и сборке: сам `wxt`,
  React-модуль для WXT, типы, `typescript`, `tailwindcss`, `postcss`,
  `autoprefixer`.

> Важно: в этом проекте для просмотра интерфейса используется `npm run build`, а
> не `npm run dev`. В дев-режиме механизм горячей перезагрузки React в некоторых
> версиях WXT ломает сборку попапа. Продакшен-сборка работает стабильно.

### wxt.config.ts

Главная настройка расширения. WXT по этому файлу собирает `manifest.json`
(паспорт расширения для Chrome) и настраивает Vite.

```ts
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  }),
  manifest: {
    name: 'ClipMind',
    description: 'Summarize any YouTube video in seconds with AI',
    version: '1.0.0',
    permissions: ['activeTab', 'storage'],
    action: { default_popup: 'popup.html', default_icon: { ... } },
    icons: { ... }
  }
});
```

Разбор по полям:

- `modules: ['@wxt-dev/module-react']` — подключает поддержку React. Без этого
  модуля WXT не знает, как обрабатывать `.tsx`-файлы.
- `vite.esbuild.jsx: 'automatic'` — заставляет сборщик использовать
  «автоматический» режим JSX. В этом режиме разметка вида `<div>` превращается в
  вызовы из `react/jsx-runtime`, и переменная `React` не нужна в каждом файле.
  Без этой настройки в финальной сборке возникает ошибка `React is not defined`,
  потому что компоненты не импортируют `React` напрямую.
- `manifest.permissions`:
  - `activeTab` — даёт доступ к URL активной вкладки (нужно, чтобы узнать ссылку
    на видео);
  - `storage` — доступ к `chrome.storage` для сохранения настроек и темы.
- `manifest.action.default_popup: 'popup.html'` — какое окно открывать по клику
  на иконку. WXT генерирует `popup.html` из `entrypoints/popup`.
- `default_icon` и `icons` — иконки расширения разных размеров.

### tsconfig.json

Настройка TypeScript.

```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

- `extends` — наследует базовые настройки, которые WXT сам генерирует в папке
  `.wxt` (пути, цели компиляции и т.д.).
- `jsx: "react-jsx"` — тот же автоматический режим JSX, но уже для проверки типов
  TypeScript. Дублирует логику из `wxt.config.ts`, чтобы редактор и сборщик
  понимали JSX одинаково.

### tailwind.config.ts

Настройка Tailwind: какие файлы сканировать, какие цвета и анимации добавить.

```ts
export default {
  darkMode: 'class',
  content: ['./entrypoints/**/*.{ts,tsx,html}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: {...}, animation: {...}, keyframes: {...} } },
};
```

- `darkMode: 'class'` — тема переключается добавлением класса `dark` или `light`
  на корневой элемент `<html>`, а не системной настройкой. Это позволяет
  управлять темой кнопкой внутри попапа.
- `content` — список путей, которые Tailwind просматривает в поисках классов.
  Если файл не попал сюда, его классы не попадут в итоговый CSS. Поэтому указаны
  и `entrypoints`, и `components`.
- `colors.brand` — фирменный красный `#FF0033` (плюс оттенок для наведения и
  полупрозрачный вариант). Он одинаков в обеих темах.
- `colors.surface` и `colors.content` — «семантические» цвета, которые ссылаются
  на CSS-переменные (`var(--surface-bg)` и т.д.). Сами переменные заданы в
  `style.css` и меняются в зависимости от темы. Благодаря этому классы вроде
  `bg-surface-card` автоматически перекрашиваются при смене темы.
- `animation` и `keyframes` — кастомные анимации: бегущая полоса загрузки
  (`progress`), плавное появление (`fade-in`), выезд снизу (`slide-up`) и
  пульсация кнопки (`pulse-brand`).

### postcss.config.ts

Маленький файл, который подключает Tailwind и автопрефиксер к процессу обработки
CSS.

```ts
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- `tailwindcss` — превращает директивы `@tailwind` в реальный CSS.
- `autoprefixer` — добавляет вендорные префиксы (например, `-webkit-`) для
  совместимости.

---

## 4. Папка lib — логика без интерфейса

Здесь лежит «чистая» логика: типы, тексты и работа с сетью. Эти файлы не знают
про React и могут использоваться откуда угодно.

### lib/types.ts

Определяет общие типы TypeScript, чтобы весь проект говорил на одном языке.

```ts
export type SummaryMode = 'short' | 'moderate' | 'detailed';
export type Language = 'ru' | 'en';

export interface SummaryResponse {
  summary: string;
  videoTitle?: string;
  error?: string;
}
```

- `SummaryMode` — режим пересказа. Это «строковое перечисление»: значение может
  быть только одним из трёх. Если где-то написать `'medium'`, TypeScript
  подсветит ошибку.
- `Language` — язык пересказа, только `'ru'` или `'en'`.
- `SummaryRequest` — форма запроса (URL, режим, язык). Используется как описание
  данных, которые уходят на бэкенд.
- `SummaryResponse` — форма ответа от бэкенда: текст пересказа (`summary`),
  необязательное название видео (`videoTitle`) и необязательная ошибка. Знак `?`
  означает «поле может отсутствовать».
- `AppState` — описание полного состояния приложения. В текущем коде состояние
  разбито на отдельные части в `App.tsx`, но этот тип задаёт общую картину.

Зачем это нужно: типы — это контракт. Когда `api.ts` обещает вернуть
`SummaryResponse`, а `App.tsx` его ожидает, TypeScript гарантирует, что обе
стороны согласованы.

### lib/i18n.ts

Хранилище всех текстов интерфейса на двух языках (i18n = internationalization).

```ts
export const translations = {
  ru: { appTitle: 'ClipMind', summarizeBtn: 'Пересказать', ... },
  en: { appTitle: 'ClipMind', summarizeBtn: 'Summarize', ... },
} as const;

export function t(lang: Language, key: ...): string {
  return translations[lang][key];
}
```

- `translations` — объект с двумя наборами строк: `ru` и `en`. Каждый ключ
  (например, `summarizeBtn`) есть в обоих языках.
- `as const` — подсказка TypeScript: «считай эти строки точными значениями, а не
  просто строками». Это позволяет автодополнению знать список доступных ключей.
- Функция `t(lang, key)` — «переводчик». Принимает язык и ключ, возвращает нужную
  строку. Например, `t('ru', 'summarizeBtn')` вернёт `'Пересказать'`.

Важная деталь архитектуры: в этом проекте язык интерфейса зафиксирован русским
(см. `App.tsx`, константа `UI_LANG`). Английские строки нужны для промптов и на
случай, если в будущем язык интерфейса захотят сделать переключаемым.

### lib/api.ts

Связь с бэкендом и вспомогательные функции для работы с URL.

```ts
const API_BASE_URL = 'https://your-backend-api.com'; // заменить на свой адрес

const MODE_PROMPTS = {
  short:    { ru: '...3-5 предложениях...', en: '...3-5 sentences...' },
  moderate: { ru: '...1-2 абзацах...',      en: '...1-2 paragraphs...' },
  detailed: { ru: '...подробный...',        en: '...detailed...' },
};
```

- `API_BASE_URL` — адрес вашего сервера. Сейчас это заглушка. Когда бэкенд будет
  готов, сюда подставляется реальный адрес, и кнопка «Пересказать» заработает.
- `MODE_PROMPTS` — заготовки инструкций для нейросети под каждое сочетание
  «режим + язык». Например, для краткого пересказа на русском уходит инструкция
  про 3–5 предложений. Эти промпты передаются на бэкенд вместе со ссылкой.

Главная функция:

```ts
export async function summarizeVideo(videoUrl, mode, language): Promise<SummaryResponse> {
  const prompt = MODE_PROMPTS[mode][language];
  const response = await fetch(`${API_BASE_URL}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: videoUrl, mode, language, prompt }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return await response.json() as SummaryResponse;
}
```

- `async`/`await` — работа с асинхронностью: функция отправляет запрос и ждёт
  ответа, не блокируя интерфейс.
- `fetch` — стандартный способ отправить HTTP-запрос. Отправляется `POST` на
  `/summarize` с телом в формате JSON.
- В теле уходят: ссылка на видео, режим, язык и готовый промпт.
- Если сервер ответил ошибкой (`!response.ok`), функция бросает исключение,
  которое потом поймает `App.tsx` и покажет сообщение об ошибке.
- При успехе возвращается распарсенный JSON-ответ.

Вспомогательные функции:

- `isYouTubeUrl(url)` — проверяет регулярным выражением, что ссылка ведёт на
  `youtube.com/watch` или `youtu.be/`. Используется в `useYouTubeTab` для
  определения, открыто ли видео.
- `extractVideoId(url)` — вытаскивает идентификатор видео из ссылки разных
  форматов. В текущем интерфейсе напрямую не вызывается, но пригодится, если
  бэкенду понадобится только ID, а не полный URL.

---

## 5. Папка hooks — логика на React

Хуки — это функции React, имена которых начинаются с `use`. Они позволяют
переиспользовать логику с состоянием между компонентами. Здесь три хука, каждый
отвечает за свой кусок данных.

### hooks/useSettings.ts

Хранит и сохраняет выбор пользователя: режим и язык пересказа.

```ts
const DEFAULT_SETTINGS = { mode: 'moderate', language: 'ru' };

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['summaryMode', 'summaryLanguage'], (result) => {
      setSettings({
        mode: result.summaryMode || DEFAULT_SETTINGS.mode,
        language: result.summaryLanguage || DEFAULT_SETTINGS.language,
      });
      setLoaded(true);
    });
  }, []);

  const updateMode = (mode) => { setSettings(p => ({...p, mode})); chrome.storage.local.set({ summaryMode: mode }); };
  const updateLanguage = (language) => { ... };

  return { settings, loaded, updateMode, updateLanguage };
}
```

- `useState` — создаёт переменные состояния. `settings` хранит текущий выбор,
  `loaded` показывает, загрузились ли уже сохранённые значения.
- `useEffect(..., [])` — выполняется один раз при открытии попапа. Внутри он
  читает сохранённые настройки из `chrome.storage.local` (постоянное хранилище
  расширения). Если ничего не сохранено — берутся значения по умолчанию
  (умеренный режим, русский язык).
- `updateMode` / `updateLanguage` — функции изменения. Они обновляют состояние на
  экране **и** сразу записывают новое значение в хранилище, чтобы в следующий раз
  попап открылся с тем же выбором.
- Хук возвращает объект: текущие настройки, флаг загрузки и две функции
  изменения. `App.tsx` забирает их и раздаёт компонентам.

### hooks/useTheme.ts

Отвечает за тему оформления: хранит выбор и применяет его к странице.

```ts
export type Theme = 'light' | 'dark';

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['theme'], (result) => {
      const stored = result.theme || 'dark';
      setThemeState(stored);
      applyTheme(stored);
      setLoaded(true);
    });
  }, []);

  const setTheme = (next) => { setThemeState(next); applyTheme(next); chrome.storage.local.set({ theme: next }); };
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, loaded, setTheme, toggleTheme };
}
```

- `applyTheme` — техническая функция. Она ставит класс `dark` или `light` на
  тег `<html>`. Именно по этому классу CSS-переменные в `style.css` переключают
  все цвета сразу.
- `useEffect` при старте читает сохранённую тему (по умолчанию тёмная) и
  применяет её.
- `setTheme` меняет тему: обновляет состояние, перекрашивает страницу и сохраняет
  выбор.
- `toggleTheme` — удобная обёртка: переключает тёмную на светлую и наоборот. Её
  вызывает кнопка `ThemeToggle`.

### hooks/useYouTubeTab.ts

Определяет, открыто ли в активной вкладке видео YouTube, и достаёт его URL.

```ts
export function useYouTubeTab() {
  const [state, setState] = useState({ isYouTube: false, videoUrl: null, isLoading: true });

  useEffect(() => {
    async function detectTab() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url ?? '';
        const isYouTube = isYouTubeUrl(url);
        setState({ isYouTube, videoUrl: isYouTube ? url : null, isLoading: false });
      } catch {
        setState({ isYouTube: false, videoUrl: null, isLoading: false });
      }
    }
    detectTab();
  }, []);

  return state;
}
```

- `chrome.tabs.query({ active: true, currentWindow: true })` — спрашивает у
  Chrome про активную вкладку в текущем окне. Возвращается массив, берётся первый
  элемент.
- `isYouTubeUrl(url)` (из `lib/api.ts`) проверяет, что это страница видео.
- Результат складывается в состояние: флаг `isYouTube`, сам `videoUrl` (или
  `null`, если это не видео) и `isLoading` (пока идёт проверка — `true`).
- `try/catch` страхует на случай, если доступ к вкладке не получен.
- `App.tsx` по `isYouTube` решает, какой экран показать: основной или «не
  YouTube».

---

## 6. Папка entrypoints — точки входа

Это файлы, которые напрямую запускает Chrome. У расширения две точки входа:
фоновый сервис-воркер и попап.

### entrypoints/background.ts

Фоновый сценарий (service worker). Работает без интерфейса, в фоне браузера.

```ts
export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => console.log('ClipMind installed'));

  function isYouTubeWatch(url) {
    return !!url && (url.includes('youtube.com/watch') || url.includes('youtu.be/'));
  }

  function updateBadge(tabId, url) {
    const active = isYouTubeWatch(url);
    chrome.action.setBadgeText({ text: active ? '▶' : '', tabId });
    if (active) chrome.action.setBadgeBackgroundColor({ color: '#FF0033', tabId });
  }

  chrome.tabs.onActivated.addListener(async ({ tabId }) => { ... updateBadge ... });
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') updateBadge(tabId, tab.url);
  });
});
```

- `defineBackground` — функция WXT, которая регистрирует фоновый сценарий.
- `onInstalled` — срабатывает при установке расширения (просто пишет в консоль).
- `updateBadge` — рисует маленький значок ▶ красного цвета на иконке расширения,
  если активная вкладка — видео YouTube. Если нет — убирает значок.
- Два слушателя событий:
  - `onActivated` — когда пользователь переключился на другую вкладку;
  - `onUpdated` — когда вкладка догрузилась (`status === 'complete'`), например,
    при переходе на новое видео.

Этот файл не обязателен для пересказа, он лишь даёт визуальную подсказку, что на
текущей странице расширение применимо.

### entrypoints/popup/index.html

HTML-каркас попапа. Очень короткий — вся «начинка» рисуется React-ом.

```html
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
```

- `<div id="root">` — пустой контейнер, в который React вставит интерфейс.
- `<script src="./main.tsx">` — подключает стартовый скрипт.
- В `<head>` подключается шрифт Roboto с Google Fonts.

### entrypoints/popup/main.tsx

Точка запуска React. Связывает React-приложение с `index.html`.

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- Находит `<div id="root">` и говорит React: «рисуй сюда».
- `<App />` — главный компонент, с которого начинается весь интерфейс.
- `<React.StrictMode>` — режим дополнительных проверок при разработке (помогает
  ловить потенциальные проблемы).
- `import './style.css'` — подключает стили; без этой строки Tailwind не
  применится.

### entrypoints/popup/style.css

Базовые стили и, главное, переменные тем.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root, .dark {
  --surface-bg: #0F0F0F;
  --surface-card: #1A1A1A;
  --content-primary: #FFFFFF;
  ...
}

.light {
  --surface-bg: #FFFFFF;
  --surface-card: #F7F7F7;
  --content-primary: #0F0F0F;
  ...
}
```

- Три директивы `@tailwind` подключают базу, компоненты и утилитарные классы
  Tailwind.
- Дальше — две группы CSS-переменных:
  - тёмная тема (по умолчанию, на `:root` и `.dark`);
  - светлая тема (на `.light`).
- Когда `useTheme` ставит на `<html>` класс `dark` или `light`, меняется набор
  переменных, и весь интерфейс перекрашивается за одну операцию. Это и есть
  механизм переключения темы.
- `body` использует эти переменные для фона и цвета текста плюс плавный переход
  при смене темы.
- Блок `.custom-scroll` — тонкий стилизованный скроллбар для области с длинным
  пересказом.

### entrypoints/popup/App.tsx

Самый важный файл интерфейса. Здесь собирается всё: состояние, экраны и логика
кнопки «Пересказать».

В начале:

```tsx
const UI_LANG = 'ru' as const;
```

Это ключевая деталь архитектуры: **язык интерфейса зафиксирован русским**.
Переключатель языка управляет только языком будущего пересказа
(`settings.language`), а не подписями в попапе. Поэтому весь текст интерфейса
берётся как `t(UI_LANG, ...)`.

Внутри компонента `App`:

```tsx
const { isYouTube, videoUrl, isLoading: tabLoading } = useYouTubeTab();
const { settings, loaded: settingsLoaded, updateMode, updateLanguage } = useSettings();
const { theme, loaded: themeLoaded, toggleTheme } = useTheme();

const [view, setView] = useState('main');
const [summary, setSummary] = useState(null);
const [videoTitle, setVideoTitle] = useState(null);
const [error, setError] = useState(null);
```

- Три хука дают данные: о вкладке, о настройках, о теме.
- Локальное состояние:
  - `view` — какой экран показан: `'main'`, `'loading'` или `'result'`;
  - `summary` — текст пересказа;
  - `videoTitle` — название видео;
  - `error` — сообщение об ошибке.

Логика кнопки «Пересказать»:

```tsx
const handleSummarize = async () => {
  if (!videoUrl) return;
  setView('loading');
  setError(null);
  try {
    const result = await summarizeVideo(videoUrl, settings.mode, settings.language);
    setSummary(result.summary);
    setVideoTitle(result.videoTitle ?? null);
    setView('result');
  } catch {
    setError(t(UI_LANG, 'errorOccurred'));
    setView('main');
  }
};
```

- Переключает экран на «загрузку», вызывает `summarizeVideo` из `lib/api.ts`,
  передавая ссылку, режим и **язык пересказа**.
- При успехе сохраняет результат и переключает на экран результата.
- При ошибке (например, бэкенд недоступен) показывает сообщение и возвращает на
  главный экран.

Какой экран рисуется, решают условия:

1. Пока идёт первичная загрузка (вкладка/настройки/тема ещё не готовы) — крутится
   спиннер.
2. Если вкладка не YouTube — показывается `NotYouTubePage`.
3. Иначе — основной экран:
   - `view === 'main'`: настройки (`ModeSelector`, `LanguageToggle`), возможная
     ошибка и кнопка «Пересказать»;
   - `view === 'loading'`: `LoadingBar`;
   - `view === 'result'`: `SummaryResult`.

В конце файла — два маленьких внутренних компонента:

- `Header` — шапка: логотип, название, зелёная точка-индикатор (когда вкладка —
  YouTube) и кнопка темы.
- `Footer` — нижняя подпись «Могут присутствовать неточности».

Кнопка «Пересказать» имеет и Tailwind-класс, и прямой стиль
`style={{ backgroundColor: '#FF0033' }}` — это страховка, чтобы кнопка всегда
была красной, даже если Tailwind по какой-то причине не сгенерирует нужный класс.

---

## 7. Папка components — части интерфейса

Каждый компонент — самостоятельный кусок UI. Все они «глупые»: получают данные
через свойства (props) и сообщают о действиях через колбэки. Логику и состояние
держит `App.tsx`.

### components/Logo.tsx

Два SVG-значка:

- `Logo` — фирменный знак ClipMind: красный скруглённый прямоугольник с белым
  треугольником play. Принимает размер (`size`).
- `YouTubeGlyph` — узнаваемый значок YouTube. Используется на экране «не YouTube»
  и на кнопке «Открыть YouTube».

Значки нарисованы прямо в коде как SVG, поэтому масштабируются без потери
качества и красятся напрямую.

### components/ThemeToggle.tsx

Кнопка переключения темы.

```tsx
export function ThemeToggle({ theme, onToggle, language }) {
  const isDark = theme === 'dark';
  return (
    <button onClick={onToggle} aria-label={t(language, 'themeToggle')} ...>
      {isDark ? <SunIcon/> : <MoonIcon/>}
    </button>
  );
}
```

- Получает текущую тему и функцию `onToggle` (это `toggleTheme` из хука).
- Показывает солнце в тёмной теме (намёк «переключить на светлую») и луну в
  светлой.
- `aria-label` и `title` дают подпись для доступности и всплывающую подсказку.

### components/ModeSelector.tsx

Выбор режима пересказа — три кнопки в ряд.

```tsx
const MODES = [
  { key: 'short', icon: '⚡' },
  { key: 'moderate', icon: '📋' },
  { key: 'detailed', icon: '📖' },
];
```

- Перебирает массив `MODES` и рисует кнопку для каждого режима: значок, название
  и краткое описание (например, «3–5 предложений»).
- `labelMap` и `descMap` связывают режим с ключами переводов из `i18n.ts`.
- Активная кнопка подсвечивается красным (`bg-brand`), остальные нейтральны.
- По клику вызывает `onChange(key)` — в `App.tsx` это `updateMode`, который
  сохраняет выбор.

### components/LanguageToggle.tsx

Выбор языка пересказа — две кнопки.

```tsx
const LANGS = [
  { key: 'ru', label: 'Русский' },
  { key: 'en', label: 'Английский' },
];
```

- Показывает «Русский» и «Английский» (без флагов — эмодзи-флаги не отображаются
  на Windows, поэтому оставлен только текст).
- Активный язык подсвечен красным.
- По клику вызывает `onChange(key)` — это `updateLanguage` в `App.tsx`.
- Заголовок «Язык пересказа» вписан прямо в компонент, так как интерфейс
  фиксированно русский.

Важно: этот компонент меняет только язык будущего пересказа, а не язык попапа.

### components/LoadingBar.tsx

Анимация ожидания ответа от бэкенда.

```tsx
const STEPS = ['loadingStep1', 'loadingStep2', 'loadingStep3'];

useEffect(() => {
  const stepTimer = setInterval(() => setStepIndex(p => (p + 1) % STEPS.length), 2000);
  const dotTimer = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 400);
  return () => { clearInterval(stepTimer); clearInterval(dotTimer); };
}, []);
```

- Показывает бегущую красную полосу, вращающееся кольцо со значком ClipMind и
  меняющийся текст статуса.
- `stepTimer` каждые 2 секунды переключает фразу («Получаю данные…» → «Анализирую…»
  → «Формирую пересказ…»).
- `dotTimer` каждые 0.4 секунды добавляет точку (`.`, `..`, `...`) для живости.
- `return () => {...}` в `useEffect` — обязательная очистка таймеров, когда
  компонент исчезает с экрана. Без этого таймеры продолжали бы работать и
  вызывать ошибки.

### components/SummaryResult.tsx

Экран готового пересказа.

```tsx
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(summary);
  } catch {
    // запасной способ через временный textarea
  }
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
```

- Сверху — кнопка «Назад» (вызывает `onBack`, возвращающую на главный экран),
  значок режима и подпись «Результат».
- Если есть название видео — показывается в карточке.
- Сам пересказ выводится в прокручиваемом блоке с тонким скроллбаром
  (`custom-scroll`), `whitespace-pre-wrap` сохраняет переносы строк.
- Кнопка «Копировать» кладёт текст в буфер обмена. Основной способ —
  `navigator.clipboard`. Если он недоступен, срабатывает запасной приём через
  временный `<textarea>`. После копирования кнопка на 2 секунды превращается в
  «Скопировано!».

### components/NotYouTubePage.tsx

Экран, который показывается, если активная вкладка — не YouTube.

```tsx
const openYouTube = () => chrome.tabs.create({ url: 'https://www.youtube.com' });
```

- Большой значок YouTube с мягким свечением.
- Поясняющий текст: «Работает только с YouTube» и подсказка открыть видео.
- Кнопка «Открыть YouTube» — открывает новую вкладку с YouTube через
  `chrome.tabs.create`.

---

## 8. Папка public — статика

### public/icon/

Иконки расширения в четырёх размерах: 16, 32, 48 и 128 пикселей (плюс исходный
`icon.svg`). Chrome использует разные размеры в разных местах: на панели
инструментов, в списке расширений, в магазине. Файлы из `public` копируются в
сборку без изменений, а пути к ним прописаны в `wxt.config.ts`.

---

## 9. Как файлы связаны — поток данных

Кратко, кто кого вызывает:

1. Chrome открывает `popup.html` (сгенерирован из `entrypoints/popup`).
2. `main.tsx` запускает `App.tsx`.
3. `App.tsx` поднимает три хука:
   - `useYouTubeTab` → читает вкладку (через `isYouTubeUrl` из `lib/api.ts`);
   - `useSettings` → читает режим и язык из `chrome.storage`;
   - `useTheme` → читает и применяет тему.
4. `App.tsx` раздаёт данные компонентам:
   - `ModeSelector` ← режим, `updateMode`;
   - `LanguageToggle` ← язык, `updateLanguage`;
   - `ThemeToggle` ← тема, `toggleTheme`.
5. Клик «Пересказать» → `handleSummarize` → `summarizeVideo` из `lib/api.ts` →
   запрос на бэкенд.
6. Во время ожидания — `LoadingBar`; после ответа — `SummaryResult`.
7. Все тексты везде берутся из `lib/i18n.ts` через функцию `t`.
8. Параллельно и независимо в фоне работает `background.ts` (значок на иконке).

---

## 10. Запуск и сборка

```bash
npm install      # установить зависимости (один раз)
npm run build    # собрать расширение в .output/chrome-mv3
```

Затем в Chrome: `chrome://extensions` → включить «Режим разработчика» →
«Загрузить распакованное расширение» → выбрать папку `.output/chrome-mv3`.

После любой правки кода — снова `npm run build` и кнопка обновления (↻) на
карточке расширения.

Используйте `npm run build`, а не `npm run dev`: в дев-режиме горячая
перезагрузка React в этой версии WXT ломает попап.

---

## 11. Подключение бэкенда

Расширение готово, кроме одного: сейчас в `lib/api.ts` стоит адрес-заглушка
`https://your-backend-api.com`, поэтому кнопка «Пересказать» выдаёт ошибку. Это
ожидаемо.

Чтобы всё заработало:

1. В `lib/api.ts` замените `API_BASE_URL` на адрес вашего сервера.
2. Бэкенд должен принимать `POST /summarize` с телом:
   ```json
   { "url": "...", "mode": "short|moderate|detailed", "language": "ru|en", "prompt": "..." }
   ```
   и возвращать:
   ```json
   { "summary": "текст пересказа", "videoTitle": "название видео" }
   ```
3. Добавьте домен бэкенда в `host_permissions` в `wxt.config.ts`, иначе Chrome
   заблокирует запрос:
   ```ts
   manifest: {
     ...
     host_permissions: ['https://ваш-домен.com/*'],
   }
   ```
4. Пересоберите (`npm run build`) и обновите расширение.
