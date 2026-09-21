import json
import os

from openai import OpenAI


def analyze_ticket(subject: str, description: str):

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured"
        )

    client = OpenAI(
        api_key=api_key
    )

    prompt = f"""
You are an AI customer support ticket analyst.

Analyze the following customer support ticket.

Subject:
{subject}

Description:
{description}

Return ONLY valid JSON.

Use exactly these fields:

{{
    "category": "Billing | Technical | Account | General",
    "priority": "Low | Medium | High | Critical",
    "sentiment": "Positive | Neutral | Negative",
    "summary": "Short summary of the customer issue",
    "suggested_reply": "Professional reply to the customer"
}}

Do not add markdown.
Do not add ```json.
Return only JSON.
"""

    response = client.responses.create(
        model="gpt-5.6-luna",
        input=prompt
    )

    result = response.output_text.strip()

    # Remove accidental markdown if AI returns it
    if result.startswith("```json"):
        result = result[7:]

    if result.endswith("```"):
        result = result[:-3]

    result = result.strip()

    try:
        return json.loads(result)

    except json.JSONDecodeError:
        raise RuntimeError(
            "AI returned invalid JSON"
        )
