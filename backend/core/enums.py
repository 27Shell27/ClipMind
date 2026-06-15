from enum import Enum


class SummaryMode(str, Enum):
    SHORT = "short"
    MID = "mid"
    LONG = "long"


class SummaryLanguage(str, Enum):
    RU = "ru"
    EN = "en"