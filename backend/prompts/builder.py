from core.enums import SummaryLanguage, SummaryMode
from prompts.ru import RU_PROMPTS
from prompts.en import EN_PROMPTS


def build_summary_prompt(
    mode: SummaryMode,
    language: SummaryLanguage
) -> str:
    if language == SummaryLanguage.RU:
        return build_ru_prompt(mode)

    if language == SummaryLanguage.EN:
        return build_en_prompt(mode)

    raise ValueError(f"Unsupported summary language: {language}")


def build_ru_prompt(mode: SummaryMode) -> str:
    return RU_PROMPTS[mode]


def build_en_prompt(mode: SummaryMode) -> str:
    return EN_PROMPTS[mode]