from google import genai
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi


def get_video_id(url):
    """
    Достаёт ID видео из разных видов ссылок YouTube.
    """

    parsed_url = urlparse(url)

    # Обычная ссылка:
    # https://www.youtube.com/watch?v=VIDEO_ID
    if parsed_url.hostname in ["www.youtube.com", "youtube.com", "m.youtube.com"]:
        if parsed_url.path == "/watch":
            query = parse_qs(parsed_url.query)
            return query.get("v", [None])[0]

        # Shorts:
        # https://www.youtube.com/shorts/VIDEO_ID
        if parsed_url.path.startswith("/shorts/"):
            return parsed_url.path.split("/shorts/")[1].split("/")[0]

        # Embed:
        # https://www.youtube.com/embed/VIDEO_ID
        if parsed_url.path.startswith("/embed/"):
            return parsed_url.path.split("/embed/")[1].split("/")[0]

    # Короткая ссылка:
    # https://youtu.be/VIDEO_ID
    if parsed_url.hostname == "youtu.be":
        return parsed_url.path.lstrip("/")

    return None


def get_russian_transcript(video_id):
    """
    Получает только русскую транскрипцию.
    Если русских субтитров нет, будет ошибка.
    """

    ytt_api = YouTubeTranscriptApi()

    transcript = ytt_api.fetch(
        video_id,
        languages=["ru"]
    )

    return transcript


def save_transcript_to_file(transcript, filename="transcript.txt"):
    """
    Сохраняет транскрипцию в txt-файл.
    """

    with open(filename, "w", encoding="utf-8") as file:
        for snippet in transcript:
            minutes = int(snippet.start // 60)
            seconds = int(snippet.start % 60)

            time_code = f"[{minutes:02d}:{seconds:02d}]"
            text = snippet.text

            file.write(f"{time_code} {text}\n")


def input_link():
    url = input("Вставь ссылку на YouTube-видео: ")

    video_id = get_video_id(url)

    if not video_id:
        print("Ошибка: не удалось получить ID видео из ссылки.")
        return

    try:
        transcript = get_russian_transcript(video_id)
        save_transcript_to_file(transcript)

        print("Готово!")
        print("Транскрипция сохранена в файл transcript.txt")

    except Exception as error:
        print("Не удалось получить русскую транскрипцию.")
        print("Возможные причины:")
        print("- у видео нет русских субтитров;")
        print("- видео недоступно;")
        print("- YouTube заблокировал запрос;")
        print("- ссылка указана неверно.")
        print()
        print("Текст ошибки:")
        print(error)


GEMINI_API_KEY="AIzaSyDDg94cICkXsda4aM2xBcBU5Lji67_yGFo"
client = genai.Client(api_key=GEMINI_API_KEY)

def generate_summary_with_ai(
        input_file="transcript.txt",
        output_file="summary.txt"
):
    """
    Отправляет transcript.txt в Gemini
    и сохраняет пересказ в summary.txt
    """

    uploaded_file = client.files.upload(file=input_file)

    response = client.models.generate_content(
        model="gemini-2.5-flash",

        contents=[
            uploaded_file,

            "прочитай txt файл и оформи это как лекцию гайд по пунктам. "
            "не добавляй ничего лишнего. аккуратно сделай выжимку."
        ]
    )

    Path(output_file).write_text(
        response.text,
        encoding="utf-8"
    )

    print(f"Готово. Ответ сохранён в файл: {output_file}")

    return response.text