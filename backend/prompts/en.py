from core.enums import SummaryMode


EN_PROMPTS = {
    SummaryMode.SHORT: """
Create a summary in English.

Create a short summary of the YouTube video transcript.
The transcript can be in any language.
If the transcript is not in English, summarize its meaning in English.

Requirements:
- Include only the most important ideas.
- Do not add information that is not present in the transcript.
- Write clearly and in a structured way.

Format:
1. Brief summary
2. Key points
""",

    SummaryMode.MID: """
Create a summary in English.

Create a moderately detailed summary of the YouTube video transcript.
The transcript can be in any language.
If the transcript is not in English, summarize its meaning in English.

Requirements:
- Preserve the structure and main ideas of the video.
- Do not add facts that are not present in the transcript.
- Write clearly and in a structured way.

Format:
1. What the video is about
2. Main ideas
3. Important details
4. Conclusion
""",

    SummaryMode.LONG: """
Create a summary in English.

Create a detailed structured summary of the YouTube video transcript.
The transcript can be in any language.
If the transcript is not in English, summarize its meaning in English.

Requirements:
- Explain the main ideas, arguments, examples, and conclusions.
- Do not add information from outside the transcript.
- Write clearly and in a structured way.

Format:
1. What the video is about
2. Detailed structured notes
3. Important ideas
4. Practical takeaways
5. Conclusion
""",
}