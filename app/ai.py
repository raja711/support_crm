import json
import os

from google import genai
from google.genai import types


def analyze_ticket(subject: str, description: str):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured"
        )

    client = genai.Client(
        api_key=api_key
    )

    prompt = f"""
You are an AI customer support ticket analyst.

Analyze the following customer support ticket.

Subject:
{subject}

Description:
{description}

Return ONLY a valid JSON object.

Use exactly these fields:

{{
    "category": "Billing | Technical | Account | General",
    "priority": "Low | Medium | High | Critical",
    "sentiment": "Positive | Neutral | Negative",
    "summary": "Short summary of the customer issue",
    "suggested_reply": "Professional reply to the customer"
}}

Rules:

1. category must be exactly one of:
Billing, Technical, Account, General

2. priority must be exactly one of:
Low, Medium, High, Critical

3. sentiment must be exactly one of:
Positive, Neutral, Negative

4. summary must be short and clear.

5. suggested_reply must be professional, helpful,
and suitable for sending to the customer.

6. Do not add markdown.

7. Do not add ```json.

8. Return only the JSON object.
"""

    try:

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        result = response.text.strip()

        # Remove accidental markdown if returned
        if result.startswith("```json"):
            result = result[7:]

        if result.endswith("```"):
            result = result[:-3]

        result = result.strip()

        return json.loads(result)

    except json.JSONDecodeError:
        raise RuntimeError(
            "Gemini returned invalid JSON"
        )

    except Exception as e:
        raise RuntimeError(
            f"Gemini AI request failed: {str(e)}"
        )
