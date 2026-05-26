from functools import lru_cache

from core.config import Settings
from integrations.gemini_client import GeminiClient
from services.clipmind_app import ClipMindApp
from services.summary_service import SummaryService
from services.youtube_service import YouTubeService


@lru_cache(maxsize=1)
def create_app() -> ClipMindApp:
    settings = Settings()

    gemini_client = GeminiClient(
        api_key=settings.gemini_api_key,
        model_name=settings.gemini_model,
    )

    return ClipMindApp(
        youtube_service=YouTubeService(),
        summary_service=SummaryService(gemini_client),
    )
