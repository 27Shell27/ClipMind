from dataclasses import dataclass

from core.enums import SummaryLanguage, SummaryMode


@dataclass(slots=True)
class SummaryRequest:
    youtube_url: str
    mode: SummaryMode
    summary_language: SummaryLanguage
    output_path: str | None = None


@dataclass(slots=True)
class SummaryResult:
    summary: str
    mode: SummaryMode
    summary_language: SummaryLanguage
