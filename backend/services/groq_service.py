import os
import json
import re
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

PRIMARY_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"

class GroqService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self._client = None
        if self.api_key and not self.api_key.startswith("your_"):
            try:
                from groq import Groq
                self._client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self._client = None

    def is_configured(self) -> bool:
        return self._client is not None and bool(self.api_key)

    def set_api_key(self, api_key: str):
        self.api_key = api_key.strip()
        if self.api_key:
            try:
                from groq import Groq
                self._client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to re-initialize Groq client: {e}")
                self._client = None

    def call_json_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> Dict[str, Any]:
        """Call Groq LLM and parse the response into structured JSON."""
        if not self._client:
            raise ValueError("Groq API key is not configured. Please set GROQ_API_KEY in your .env file.")

        models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL, "mixtral-8x7b-32768"]
        last_exception = None

        for model in models_to_try:
            try:
                response = self._client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                raw_content = response.choices[0].message.content or "{}"
                return self._parse_json(raw_content)
            except Exception as e:
                logger.warning(f"Groq API call with model {model} failed: {e}. Trying fallback...")
                last_exception = e
                # If json_object mode fails on some models, retry standard text and parse
                try:
                    response = self._client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system_prompt + "\nIMPORTANT: Return ONLY a valid JSON object. Do not include any explanations outside the JSON."},
                            {"role": "user", "content": user_prompt},
                        ],
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    raw_content = response.choices[0].message.content or "{}"
                    return self._parse_json(raw_content)
                except Exception as inner_e:
                    logger.warning(f"Groq plain text retry failed with {model}: {inner_e}")
                    last_exception = inner_e

        raise RuntimeError(f"All Groq model attempts failed. Last error: {last_exception}")

    def _parse_json(self, content: str) -> Dict[str, Any]:
        """Clean markdown wrapping and safely extract JSON object."""
        content = content.strip()
        # Remove markdown fences ```json ... ```
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        # Extract first { to last }
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            json_str = match.group(0)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError as err:
                logger.error(f"JSON regex decode error: {err} on content: {json_str[:200]}")

        return json.loads(content)

groq_service = GroqService()
