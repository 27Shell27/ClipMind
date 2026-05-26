# Architecture.md

## Текущая архитектура

ClipMindAI сейчас построен как небольшое ООП-приложение с двумя входами:

```text
CLI: main.py → cli.py
API: api.py или main:api_app
```

Оба входа используют одно и то же ядро приложения:

```text
SummaryRequest → ClipMindApp → YouTubeService + PromptBuilder + SummaryService → GeminiClient
```

Пользователь выбирает только:

```text
mode: short / mid / long
summary_language: ru / en
```

Транскрипция берётся из доступных субтитров YouTube. Язык итогового пересказа задаётся через prompt: `ru.py` явно просит сделать пересказ на русском, `en.py` явно просит создать summary in English.

---

## Схема текущего CLI-потока

```text
                    ┌─────────────────────┐
                    │       main.py        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       cli.py         │
                    │ argparse             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    SummaryRequest    │
                    │ url, mode, language  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     ClipMindApp      │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  YouTubeService  │ │ PromptBuilder    │ │  SummaryService  │
│                  │ │                  │ │                  │
│ get_video_id     │ │ build_prompt     │ │ generate_summary │
│ get_transcript   │ │ RU_PROMPTS       │ │ save_summary     │
└──────────────────┘ │ EN_PROMPTS       │ └────────┬─────────┘
                     └──────────────────┘          │
                                                   ▼
                                           ┌──────────────────┐
                                           │   GeminiClient   │
                                           │   Gemini API     │
                                           └──────────────────┘
```

### Описание блоков

### `main.py`

Минимальная точка входа. Для CLI запускает `run_cli()`. Также экспортирует `api_app`, чтобы API можно было запускать как `uvicorn main:api_app`.

### `cli.py`

CLI-адаптер. Отвечает только за консольный ввод:

```text
- читает YouTube URL
- читает режим: --short / --mid / --long
- читает язык пересказа: --lang ru / --lang en
- создаёт SummaryRequest
- вызывает ClipMindApp
- сохраняет summary.txt через output_path
```

### `api.py`

HTTP-адаптер для будущего Chrome Extension. Отвечает за:

```text
- FastAPI app
- CORS
- GET /health
- POST /summarize
- Pydantic request model
- вызов ClipMindApp
- возврат JSON с summary
```

В текущем MVP endpoint называется `/summarize`. Для production/API versioning его можно перенести в `/api/v1/summarize`.

### `SummaryRequest`

Общий объект запроса для CLI и API:

```text
- youtube_url
- mode
- summary_language
- output_path, если нужно сохранить файл в CLI
```

### `ClipMindApp`

Главный application service. Он не работает напрямую с Gemini или YouTube, а координирует другие классы:

```text
1. просит YouTubeService получить transcript
2. просит PromptBuilder собрать prompt
3. просит SummaryService создать summary
4. при необходимости сохраняет файл
5. возвращает SummaryResult
```

### `YouTubeService`

Отвечает за YouTube-часть:

```text
- get_video_id()
- get_transcript()
```

Сервис сам выбирает доступную транскрипцию. Пользователь не выбирает язык транскрипции, потому что язык результата контролируется prompt-ом для Gemini.

### `PromptBuilder`

Функциональный слой в `prompts/builder.py`:

```text
build_summary_prompt(mode, language)
```

Логика:

```text
summary_language = ru → RU_PROMPTS[mode]
summary_language = en → EN_PROMPTS[mode]
```

Промпты лежат отдельно:

```text
prompts/ru.py
prompts/en.py
```

### `SummaryService`

Отвечает за работу с итоговым пересказом:

```text
- generate_summary()
- save_summary()
```

Сам не знает деталей Gemini API. Для генерации использует `GeminiClient`.

### `GeminiClient`

Integration layer для Gemini API через `google-genai`:

```text
- хранит model_name
- отправляет transcript + prompt в Gemini
- возвращает response.text
```

`GeminiClient` не знает про `short/mid/long` и `ru/en`. Эти решения уже заложены в prompt.

---

## Текущий поток данных

```text
1. Пользователь запускает CLI или frontend отправляет POST-запрос.
2. cli.py/api.py создаёт SummaryRequest.
3. ClipMindApp получает SummaryRequest.
4. YouTubeService получает transcript по YouTube URL.
5. PromptBuilder выбирает prompt по SummaryMode и SummaryLanguage.
6. SummaryService передаёт transcript + prompt в GeminiClient.
7. Gemini возвращает summary на выбранном языке.
8. CLI сохраняет summary.txt, API возвращает JSON.
```

---

## Интеграция с будущим frontend

Планируемый frontend — Chrome Extension:

```text
Chrome Extension:
  WXT + React + TypeScript + Tailwind

Backend:
  FastAPI + Uvicorn + Pydantic

Temporary storage:
  In-memory processing
  tempfile only if backend must create summary.txt
  auto cleanup after response

AI:
  google-genai на backend

Deploy:
  Nginx + HTTPS + systemd
```

### Схема frontend/backend-интеграции

```text
┌──────────────────────────────────────────────┐
│              Chrome Extension                │
│      WXT + React + TypeScript + Tailwind      │
│                                              │
│  ┌──────────────┐   ┌──────────────────────┐ │
│  │ Popup UI     │   │ Content Script        │ │
│  │              │   │                      │ │
│  │ - кнопка     │   │ - читает URL YouTube  │ │
│  │ - режим      │   │ - получает video_id   │ │
│  │ - язык       │   │ - передаёт данные     │ │
│  │ - summary    │   │                      │ │
│  └──────┬───────┘   └──────────┬───────────┘ │
│         │                      │             │
│         └──────────┬───────────┘             │
│                    ▼                         │
│        Background Service Worker             │
│        - отправляет запрос в backend         │
│        - получает summary                    │
│        - отдаёт результат popup              │
└────────────────────┬─────────────────────────┘
                     │
                     │ HTTPS request
                     ▼
┌──────────────────────────────────────────────┐
│                   Nginx                      │
│                                              │
│  - публичный вход                            │
│  - HTTPS                                     │
│  - reverse proxy к FastAPI                   │
└────────────────────┬─────────────────────────┘
                     │
                     │ proxy_pass
                     ▼
┌──────────────────────────────────────────────┐
│              FastAPI Backend                 │
│        FastAPI + Uvicorn + Pydantic           │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ API layer                              │  │
│  │ POST /api/v1/summarize                 │  │
│  └───────────────────┬────────────────────┘  │
│                      ▼                       │
│  ┌────────────────────────────────────────┐  │
│  │ Pydantic Schemas                       │  │
│  │ - SummaryRequest                       │  │
│  │ - SummaryResponse                      │  │
│  │ - QualityReport                        │  │
│  └───────────────────┬────────────────────┘  │
│                      ▼                       │
│  ┌────────────────────────────────────────┐  │
│  │ Services                               │  │
│  │ - VideoService                         │  │
│  │ - TranscriptService                    │  │
│  │ - SummaryService                       │  │
│  │ - QualityService                       │  │
│  └───────────────────┬────────────────────┘  │
│                      ▼                       │
│  ┌────────────────────────────────────────┐  │
│  │ Integrations                           │  │
│  │ - YouTube Transcript API               │  │
│  │ - Gemini Client через google-genai     │  │
│  └────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│              Temporary Storage               │
│                                              │
│  Основной вариант:                           │
│    transcript_text в памяти                  │
│    summary_text в памяти                     │
│                                              │
│  Если нужен файл на backend:                 │
│    /tmp/clipmindai/<request_id>/             │
│      transcript.txt                          │
│      summary.txt                             │
│                                              │
│    после ответа папка удаляется              │
└──────────────────────────────────────────────┘
```

### Описание схемы интеграции

### Chrome Extension

Расширение отвечает только за пользовательский интерфейс и отправку запроса в backend.

Компоненты:

```text
Popup UI
  - показывает кнопку запуска
  - даёт выбрать режим: short / mid / long
  - даёт выбрать язык пересказа: ru / en
  - показывает готовый summary

Content Script
  - работает на странице YouTube
  - читает текущий URL
  - при необходимости извлекает video_id
  - передаёт данные в background service worker

Background Service Worker
  - принимает события от popup/content script
  - отправляет HTTPS request в backend
  - получает summary JSON
  - передаёт результат обратно в popup
```

Пример request body:

```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "mode": "mid",
  "summary_language": "ru"
}
```

### Nginx

Nginx используется как публичный reverse proxy:

```text
- принимает HTTPS-запросы от Chrome Extension
- завершает TLS
- проксирует запросы в локальный FastAPI/Uvicorn
```

Пример production-потока:

```text
https://api.example.com/api/v1/summarize
  → Nginx
  → http://127.0.0.1:8000/summarize или /api/v1/summarize
  → FastAPI
```

### FastAPI Backend

Backend хранит всю чувствительную логику:

```text
- Gemini API key
- вызов google-genai
- получение YouTube transcript
- prompt selection
- summary generation
```

Gemini API key нельзя хранить в Chrome Extension, потому что код расширения доступен пользователю.

### Pydantic Schemas

Для API-запросов используются Pydantic-модели. В текущем MVP есть `SummaryHttpRequest` в `api.py`. В дальнейшем можно расширить API response:

```text
SummaryRequest
  - youtube_url
  - mode
  - summary_language

SummaryResponse
  - summary
  - mode
  - summary_language
  - optional metadata

QualityReport
  - keyword_overlap
  - suspicious_words
  - confirmed_words
```

`QualityReport` показан как будущий блок, если проверка качества будет возвращаться в frontend.

### Services

Текущий backend уже использует сервисный подход:

```text
YouTubeService
  - get_video_id
  - get_transcript

SummaryService
  - generate_summary
  - save_summary

ClipMindApp
  - application orchestration
```

В будущей версии можно разделить `YouTubeService` на:

```text
VideoService
  - get_video_id

TranscriptService
  - get_transcript
```

Для текущего небольшого проекта это не обязательно.

### Temporary Storage

Основной вариант хранения сейчас — in-memory:

```text
transcript_text хранится в переменной
summary_text хранится в переменной
API возвращает summary как JSON
```

Файлы на backend не создаются постоянно. Это уменьшает риск утечки данных и проблем при одновременных запросах.

Если backend должен вернуть файл `summary.txt`, тогда нужно использовать временную папку:

```text
/tmp/clipmindai/<request_id>/summary.txt
```

После ответа папка должна удаляться через `BackgroundTasks` или аналогичный cleanup-механизм.

---

## Почему язык пересказа реализован через prompts

Пользователь выбирает только язык результата:

```text
summary_language = ru / en
```

Дальше:

```text
summary_language = ru → prompts/ru.py → Gemini получает инструкцию сделать пересказ на русском
summary_language = en → prompts/en.py → Gemini получает инструкцию create a summary in English
```

LLM/Gemini умеет читать транскрипцию на одном языке и пересказывать на другом, поэтому отдельный сервис перевода в MVP не нужен.

---

## Deploy outline

Production-схема:

```text
Internet
  ↓
Nginx :443
  ↓ proxy_pass
Uvicorn 127.0.0.1:8000
  ↓
FastAPI app
  ↓
Gemini API / YouTube Transcript API
```

Рекомендуемые элементы deploy:

```text
Nginx
  - HTTPS
  - reverse proxy
  - request size/timeouts

systemd
  - автозапуск Uvicorn
  - restart on failure
  - journalctl logs

.env на backend
  - GEMINI_API_KEY
  - GEMINI_MODEL
  - CLIPMIND_ALLOWED_ORIGINS
```

Для Chrome Extension нужно настроить CORS и `host_permissions` на домен backend API.
