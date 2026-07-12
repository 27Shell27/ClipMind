# ClipMind

AI-пересказ YouTube-видео: Chrome-расширение + Python-бэкенд на FastAPI и Gemini.

Расширение берёт ссылку с активной вкладки YouTube, бэкенд достаёт транскрипт ролика и возвращает **краткий**, **умеренный** или **подробный** пересказ на **русском** или **английском**.

## Как это работает

```text
Popup (WXT + React)
   │  POST /summarize  { youtube_url, mode, summary_language }
   ▼
FastAPI (backend)
   ├─ YouTubeService  → youtube-transcript-api: транскрипт
   │                    (ручные субтитры в приоритете, лимит 100 000 символов)
   ├─ PromptBuilder   → промпт под пару режим × язык (short/mid/long × ru/en)
   └─ GeminiClient    → google-genai → gemini-2.5-flash
   │
   ▼  { summary, mode, summary_language }
Popup → рендер результата + кэш в chrome.storage.local (7 дней)
```

## Стек

| Часть | Технологии |
| --- | --- |
| **frontend** | WXT 0.19, React 18, TypeScript 5, Tailwind CSS 3, Chrome MV3 |
| **backend** | FastAPI, Uvicorn, Pydantic v2 + pydantic-settings, google-genai (Gemini), youtube-transcript-api |

## Структура

```text
backend/    FastAPI + CLI: core / integrations / prompts / services + app_factory (DI)
frontend/   Chrome-расширение: entrypoints / components / hooks / lib
```

## Быстрый запуск

### 1. Backend

**Linux / macOS**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # вписать GEMINI_API_KEY
python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

**Windows PowerShell**

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env        # вписать GEMINI_API_KEY
python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

Проверка:

```bash
curl http://127.0.0.1:8000/health
# {"status":"ok"}
```

### 2. Frontend (расширение)

```bash
cd frontend
npm install
npm run build
```

> Используйте `npm run build`, а не `npm run dev`: в dev-режиме HMR ломает сборку попапа («React is not defined» / пустое окно).

Загрузка в Chrome:

1. `chrome://extensions` → включить «Режим разработчика»
2. «Загрузить распакованное расширение» → папка `frontend/.output/chrome-mv3`
3. Закрепить иконку ClipMind, открыть любое YouTube-видео и нажать на неё

После каждой пересборки — кнопка ↻ на карточке расширения.

### 3. Связать фронт и бэк

- `frontend/lib/api.ts` → `API_BASE_URL` (по умолчанию `http://localhost:8000`)
- `backend/.env` → `CLIPMIND_ALLOWED_ORIGINS` должен содержать реальный ID расширения:
  `chrome-extension://<ID со страницы chrome://extensions>`

## CLI (без расширения)

```bash
cd backend
python main.py "https://www.youtube.com/watch?v=VIDEO_ID" --mid --lang ru --out output/summary.txt
```

Режимы: `--short` · `--mid` (по умолчанию) · `--long`. Язык: `--lang ru|en`.

## API

**`GET /health`** → `{"status": "ok"}`

**`POST /summarize`**

```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "mode": "mid",
  "summary_language": "ru"
}
```

Ответ:

```json
{
  "summary": "...",
  "mode": "mid",
  "summary_language": "ru"
}
```

- `mode`: `short` | `mid` | `long`
- `summary_language`: `ru` | `en`
- если задан `CLIPMIND_API_TOKEN` — обязателен заголовок `X-API-Key`
- поддерживаемые ссылки: `/watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`

## Переменные окружения (`backend/.env`)

| Переменная | Обязательна | Назначение |
| --- | --- | --- |
| `GEMINI_API_KEY` | да | ключ Google Gemini |
| `GEMINI_MODEL` | нет | модель, по умолчанию `gemini-2.5-flash` |
| `CLIPMIND_ALLOWED_ORIGINS` | да (для расширения) | CORS-origins через запятую |
| `CLIPMIND_API_TOKEN` | нет | если задан — включает проверку `X-API-Key` |

## Деплой

```text
Internet → Nginx :443 (TLS) → 127.0.0.1:8000 → Uvicorn / FastAPI
```

1. Выложить `backend/` на сервер, создать venv, `pip install -r requirements.txt`.
2. `.env` — только на сервере, права `600`. Ключ Gemini **никогда** не попадает в расширение.
3. systemd-юнит `/etc/systemd/system/clipmind.service`:

```ini
[Unit]
Description=ClipMind API
After=network.target

[Service]
User=clipmind
WorkingDirectory=/opt/clipmind/backend
EnvironmentFile=/opt/clipmind/backend/.env
ExecStart=/opt/clipmind/backend/.venv/bin/uvicorn api:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now clipmind
```

4. Nginx: `proxy_pass http://127.0.0.1:8000;` + HTTPS (Let's Encrypt). Наружу торчит только 443.
5. В `.env` прописать `CLIPMIND_ALLOWED_ORIGINS=chrome-extension://<ID>` и задать `CLIPMIND_API_TOKEN`.
6. Во фронте: `API_BASE_URL = https://<домен>`, при необходимости добавить домен в `host_permissions` в `wxt.config.ts`, затем `npm run build` и перезалить расширение.

## Документация

- [`backend/Architecture.md`](backend/Architecture.md) — слои, зависимости, схема интеграции
- [`frontend/DOCUMENTATION.md`](frontend/DOCUMENTATION.md) — подробная документация расширения
- [`backend/README.md`](backend/README.md) · [`frontend/README.md`](frontend/README.md) — README по частям
