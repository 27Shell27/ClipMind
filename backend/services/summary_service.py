from pathlib import Path
from integrations.gemini_client import GeminiClient


class SummaryService:
    def __init__(self, gemini_client: GeminiClient):
        self.gemini_client = gemini_client

    def generate_summary(self, transcript: str, prompt: str) -> str:
        return self.gemini_client.generate(
            transcript=transcript,
            prompt=prompt
        )

    def save_summary(self, summary: str, output_path: str) -> None:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(summary, encoding="utf-8")