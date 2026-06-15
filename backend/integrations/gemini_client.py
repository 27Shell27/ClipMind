from google import genai


class GeminiClient:
    def __init__(self, api_key: str, model_name: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name

    def generate(self, transcript: str, prompt: str) -> str:
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[prompt, transcript],
        )

        if not response.text:
            raise ValueError("Gemini returned an empty response")

        return response.text
