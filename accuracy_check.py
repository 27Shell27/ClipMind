import re
from collections import Counter

import nltk
from langdetect import detect
from razdel import tokenize
from pymorphy3 import MorphAnalyzer
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer


nltk.download("stopwords")


morph_ru = MorphAnalyzer()
stemmer_en = SnowballStemmer("english")


RU_STOP_WORDS = {
    "и", "в", "во", "на", "с", "со", "к", "ко", "по", "из", "за",
    "для", "это", "как", "что", "чтобы", "а", "но", "или", "у",
    "от", "до", "при", "о", "об", "про", "его", "её", "их", "они",
    "он", "она", "мы", "вы", "я", "быть", "есть", "также"
}

EN_STOP_WORDS = set(stopwords.words("english"))

IMPORTANT_POS_RU = {
    "NOUN",
    "ADJF",
    "ADJS",
    "VERB",
    "INFN",
    "PRTF",
    "PRTS"
}


def detect_language(text):
    language = detect(text)

    if language == "ru":
        return "ru"

    if language == "en":
        return "en"

    return "unknown"


def extract_keywords_ru(text):
    words = []

    for token in tokenize(text):
        current_word = token.text.lower()

        if not re.match(r"^[а-яА-ЯёЁ-]+$", current_word):
            continue

        if current_word in RU_STOP_WORDS:
            continue

        parsed_word = morph_ru.parse(current_word)[0]

        if parsed_word.tag.POS not in IMPORTANT_POS_RU:
            continue

        normal_word = parsed_word.normal_form
        words.append(normal_word)

    return Counter(words)


def extract_keywords_en(text):
    words = []

    tokens = re.findall(r"[a-zA-Z]+", text.lower())

    for current_word in tokens:
        if current_word in EN_STOP_WORDS:
            continue

        if len(current_word) <= 2:
            continue

        normal_word = stemmer_en.stem(current_word)
        words.append(normal_word)

    return Counter(words)


def extract_keywords(text):
    language = detect_language(text)

    if language == "ru":
        return extract_keywords_ru(text), language

    if language == "en":
        return extract_keywords_en(text), language

    return Counter(), language


def check_summary(transcript_text, summary_text):
    transcript_keywords, transcript_language = extract_keywords(transcript_text)
    summary_keywords, summary_language = extract_keywords(summary_text)

    if transcript_language != summary_language:
        return {
            "status": "Ошибка: транскрипция и выжимка написаны на разных языках",
            "transcript_language": transcript_language,
            "summary_language": summary_language,
            "accuracy": 0,
            "confirmed_words": [],
            "suspicious_words": []
        }

    if transcript_language == "unknown":
        return {
            "status": "Ошибка: язык не поддерживается. Доступны только русский и английский",
            "language": transcript_language,
            "accuracy": 0,
            "confirmed_words": [],
            "suspicious_words": []
        }

    transcript_words = set(transcript_keywords.keys())
    summary_words = set(summary_keywords.keys())

    confirmed_words = summary_words & transcript_words
    suspicious_words = summary_words - transcript_words

    if len(summary_words) == 0:
        accuracy = 0
    else:
        accuracy = len(confirmed_words) / len(summary_words)

    if accuracy >= 0.70:
        status = "Выжимка качественная"
    elif accuracy >= 0.50:
        status = "Выжимка требует проверки"
    else:
        status = "Переделать выжимку"

    return {
        "status": status,
        "language": transcript_language,
        "accuracy": round(accuracy, 2),
        "confirmed_words": sorted(confirmed_words),
        "suspicious_words": sorted(suspicious_words)
    }


def run_quality_check():

    with open("transcript.txt", "r", encoding="utf-8") as file:
        transcript = file.read()

    with open("summary.txt", "r", encoding="utf-8") as file:
        summary = file.read()

    result = check_summary(transcript, summary)

    print("Статус:", result["status"])
    print("Язык:", result.get("language"))
    print("Точность:", result["accuracy"])

    print("\nПодтверждённые слова:")
    for word in result["confirmed_words"]:
        print("-", word)

    print("\nПодозрительные слова:")
    for word in result["suspicious_words"]:
        print("-", word)

    return result