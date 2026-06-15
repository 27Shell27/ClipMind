from core.schemas import SummaryRequest, SummaryResult
from prompts.builder import build_summary_prompt
from services.summary_service import SummaryService
from services.youtube_service import YouTubeService


class ClipMindApp:
    def __init__(
        self,
        youtube_service: YouTubeService,
        summary_service: SummaryService,
    ):
        self.youtube_service = youtube_service
        self.summary_service = summary_service

    def summarize(self, request: SummaryRequest) -> SummaryResult:
        transcript = self.youtube_service.get_transcript(url=request.youtube_url)

        prompt = build_summary_prompt(
            mode=request.mode,
            language=request.summary_language,
        )

        summary = self.summary_service.generate_summary(
            transcript=transcript,
            prompt=prompt,
        )

        if request.output_path:
            self.summary_service.save_summary(
                summary=summary,
                output_path=request.output_path,
            )

        return SummaryResult(
            summary=summary,
            mode=request.mode,
            summary_language=request.summary_language,
        )
