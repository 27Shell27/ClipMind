# ClipMindAI

ClipMindAI — Python CLI/API приложение для пересказа YouTube-видео. Приложение получает доступную транскрипцию видео, отправляет её в Gemini и создаёт короткий, умеренный или подробный пересказ на русском или английском языке.

## Установка

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

### Linux/macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Заполните `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
CLIPMIND_ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://YOUR_EXTENSION_ID
```

## CLI usage

Короткий пересказ на русском:

```bash
python main.py "https://www.youtube.com/watch?v=VIDEO_ID" --short --lang ru
```

Умеренный пересказ на английском:

```bash
python main.py "https://www.youtube.com/watch?v=VIDEO_ID" --mid --lang en
```

Подробный пересказ на русском с указанием файла:

```bash
python main.py "https://www.youtube.com/watch?v=VIDEO_ID" --long --lang ru --out output/my_summary.txt
```

Режимы:

```text
--short  короткий пересказ
--mid    умеренный пересказ, используется по умолчанию
--long   подробный пересказ
```

Язык:

```text
--lang ru  пересказ на русском
--lang en  summary in English
```

## API usage

Локальный запуск API:

```bash
python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

Или через экспорт из `main.py`:

```bash
python -m uvicorn main:api_app --reload --host 127.0.0.1 --port 8000
```

Проверка:

```bash
curl http://127.0.0.1:8000/health
```

Создание пересказа:

```bash
curl -X POST http://127.0.0.1:8000/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "mode": "mid",
    "summary_language": "ru"
  }'
```

Ответ:

```json
{
  "summary": "...",
  "mode": "mid",
  "summary_language": "ru"
}
```

## Интеграция с будущим frontend

Планируемый frontend — Chrome Extension на WXT + React + TypeScript + Tailwind. Расширение будет отправлять URL видео, режим пересказа и язык результата в FastAPI backend, а backend будет возвращать готовый summary как JSON.

Подробная схема интеграции описана в [Architecture.md](Architecture.md#интеграция-с-будущим-frontend).

## Deploy outline

Production-схема:

```text
Internet → Nginx :443 → 127.0.0.1:8000 → FastAPI/Uvicorn
```

Рекомендуемый deploy:

```text
Nginx + HTTPS
systemd service для Uvicorn
.env только на backend
Gemini API key не хранить в Chrome Extension
```
