import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from app_factory import create_app
from core.enums import SummaryLanguage, SummaryMode
from core.schemas import SummaryRequest


app = FastAPI(title="ClipMindAI API")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CLIPMIND_ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SummaryHttpRequest(BaseModel):
    youtube_url: HttpUrl
    mode: SummaryMode = SummaryMode.MID
    summary_language: SummaryLanguage = SummaryLanguage.RU


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/summarize")
def summarize(request: SummaryHttpRequest) -> dict[str, str]:
    clipmind_app = create_app()

    summary_request = SummaryRequest(
        youtube_url=str(request.youtube_url),
        mode=request.mode,
        summary_language=request.summary_language,
        output_path=None,
    )

    result = clipmind_app.summarize(summary_request)

    return {
        "summary": result.summary,
        "mode": result.mode.value,
        "summary_language": result.summary_language.value,
    }
