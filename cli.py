import argparse

from app_factory import create_app
from core.enums import SummaryLanguage, SummaryMode
from core.schemas import SummaryRequest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="ClipMindAI YouTube summarizer"
    )

    parser.add_argument(
        "youtube_url",
        help="YouTube video URL",
    )

    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument("--short", action="store_true", help="Short summary")
    mode_group.add_argument("--mid", action="store_true", help="Medium summary")
    mode_group.add_argument("--long", action="store_true", help="Detailed summary")

    parser.add_argument(
        "--lang",
        choices=["ru", "en"],
        default="ru",
        help="Summary language: ru or en",
    )

    parser.add_argument(
        "--out",
        default="output/summary.txt",
        help="Output summary file path",
    )

    return parser.parse_args()


def resolve_mode(args: argparse.Namespace) -> SummaryMode:
    if args.short:
        return SummaryMode.SHORT

    if args.long:
        return SummaryMode.LONG

    return SummaryMode.MID


def run_cli() -> None:
    args = parse_args()
    app = create_app()

    request = SummaryRequest(
        youtube_url=args.youtube_url,
        mode=resolve_mode(args),
        summary_language=SummaryLanguage(args.lang),
        output_path=args.out,
    )

    result = app.summarize(request)

    print("Summary created successfully")
    print(f"Mode: {result.mode.value}")
    print(f"Summary language: {result.summary_language.value}")
    print(f"Saved to: {args.out}")
