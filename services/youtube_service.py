from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi


class YouTubeService:
    def __init__(self):
        self.api = YouTubeTranscriptApi()

    def get_video_id(self, url: str) -> str:
        parsed_url = urlparse(url)
        hostname = parsed_url.hostname or ""

        if hostname in ("www.youtube.com", "youtube.com", "m.youtube.com"):
            if parsed_url.path == "/watch":
                query = parse_qs(parsed_url.query)
                video_id = query.get("v", [None])[0]

                if video_id:
                    return video_id

            if parsed_url.path.startswith("/shorts/"):
                video_id = self._get_first_path_part(parsed_url.path, prefix="/shorts/")
                if video_id:
                    return video_id

            if parsed_url.path.startswith("/embed/"):
                video_id = self._get_first_path_part(parsed_url.path, prefix="/embed/")
                if video_id:
                    return video_id

        if hostname == "youtu.be":
            video_id = parsed_url.path.strip("/").split("/")[0]
            if video_id:
                return video_id

        raise ValueError("Invalid YouTube URL")

    def get_transcript(self, url: str) -> str:
        video_id = self.get_video_id(url)
        transcript_list = self.api.list(video_id)

        # First prefer manually created subtitles because they are usually more accurate.
        for transcript in transcript_list:
            if not transcript.is_generated:
                return self._join_transcript(transcript.fetch())

        # If there are no manual subtitles, use the first generated transcript.
        for transcript in transcript_list:
            return self._join_transcript(transcript.fetch())

        raise ValueError("No transcript found for this video")

    def _join_transcript(self, fetched_transcript) -> str:
        lines: list[str] = []

        for snippet in fetched_transcript:
            if isinstance(snippet, dict):
                text = snippet.get("text", "")
            else:
                text = getattr(snippet, "text", "")

            if text:
                lines.append(text)

        return "\n".join(lines)

    def _get_first_path_part(self, path: str, prefix: str) -> str | None:
        tail = path.removeprefix(prefix).strip("/")
        if not tail:
            return None

        return tail.split("/")[0]
