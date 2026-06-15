import os
import secrets

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app_factory import create_app
from core.enums import SummaryLanguage, SummaryMode
from core.schemas import SummaryRequest


app = FastAPI(title="ClipMindAI API")

# Безопасный дефолт CORS: без явно заданного списка origins доступ из браузера
# запрещён. Раньше дефолт был "*", что открывало API любому сайту.
allowed_origins = [
    origin.strip()
    for origin in os.getenv("CLIPMIND_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ограничение частоты запросов по IP — защита от злоупотребления и перерасхода
# квоты Gemini.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Необязательный токен доступа. Если CLIPMIND_API_TOKEN задан — эндпоинт
# /summarize требует заголовок X-API-Key с этим значением. Если не задан —
# проверка отключена (удобно для локальной разработки и CLI).
API_TOKEN = os.getenv("CLIPMIND_API_TOKEN", "")


def verify_token(x_api_key: str = Header(default="")) -> None:
    if not API_TOKEN:
        return
    if not secrets.compare_digest(x_api_key, API_TOKEN):
        raise HTTPException(status_code=401, detail="Unauthorized")


class SummaryHttpRequest(BaseModel):
    youtube_url: HttpUrl
    mode: SummaryMode = SummaryMode.MID
    summary_language: SummaryLanguage = SummaryLanguage.RU


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/summarize")
@limiter.limit("20/minute")
def summarize(
    request: Request,
    body: SummaryHttpRequest,
    _: None = Depends(verify_token),
) -> dict[str, str]:
    clipmind_app = create_app()

    summary_request = SummaryRequest(
        youtube_url=str(body.youtube_url),
        mode=body.mode,
        summary_language=body.summary_language,
        output_path=None,
    )

    result = clipmind_app.summarize(summary_request)

    return {
        "summary": result.summary,
        "mode": result.mode.value,
        "summary_language": result.summary_language.value,
    }
