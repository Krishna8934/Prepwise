import os
import json
import re
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_MODELS = [
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "qwen/qwen3-32b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
]

class GroqService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self._client = None
        self.available_models: list = list(DEFAULT_MODELS)
        self.primary_model: str = DEFAULT_MODELS[0]

        if self.api_key and not self.api_key.startswith("your_"):
            try:
                from groq import Groq
                self._client = Groq(api_key=self.api_key)
                try:
                    models_resp = self._client.models.list()
                    available_ids = [m.id for m in getattr(models_resp, "data", [])]
                    self.available_models = self._select_models(available_ids)
                    if self.available_models:
                        self.primary_model = self.available_models[0]
                except Exception as e:
                    logger.warning(f"Could not fetch models list on init: {e}")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self._client = None

    def _select_models(self, available_ids: list) -> list:
        """Filter and rank models available in the account against preferred models."""
        chosen = [m for m in DEFAULT_MODELS if m in available_ids]
        if not chosen:
            # Fallback to any text/chat models that are not whisper, guard, or embeddings
            chosen = [
                m for m in available_ids
                if not any(x in m.lower() for x in ["whisper", "tts", "embed", "guard", "moderation", "vision-preview"])
            ]
        return chosen or list(DEFAULT_MODELS)

    def is_configured(self) -> bool:
        return self._client is not None and bool(self.api_key)

    def validate_and_set_api_key(self, api_key: str, persist_to_env: bool = True) -> Dict[str, Any]:
        """Validate key against Groq API using models.list(), then dynamically set best active model and persist it."""
        cleaned_key = api_key.strip()
        if not cleaned_key:
            raise ValueError("Groq API key cannot be empty.")

        try:
            from groq import Groq
            test_client = Groq(api_key=cleaned_key)
            # Query official models endpoint: verifies credentials without model deprecation risks
            models_resp = test_client.models.list()
            available_ids = [m.id for m in getattr(models_resp, "data", [])]
        except Exception as e:
            err_str = str(e)
            logger.error(f"Groq API key validation failed: {err_str}")
            if "401" in err_str or "invalid_api_key" in err_str.lower():
                raise ValueError("Groq rejected this API key (Invalid API Key). Please verify that you copied the complete key starting with 'gsk_'.")
            elif "No module named" in err_str:
                raise ValueError("Groq Python package is missing in the active environment. Please restart with 'backend/venv/bin/python3'.")
            else:
                raise ValueError(f"Groq verification failed: {err_str}")

        self.api_key = cleaned_key
        self._client = test_client
        self.available_models = self._select_models(available_ids)
        self.primary_model = self.available_models[0] if self.available_models else DEFAULT_MODELS[0]
        os.environ["GROQ_API_KEY"] = cleaned_key

        if persist_to_env:
            # Save to backend/.env
            env_path = Path(__file__).resolve().parent.parent / ".env"
            try:
                with open(env_path, "w") as f:
                    f.write(f"GROQ_API_KEY={cleaned_key}\n")
                logger.info(f"Persisted validated GROQ_API_KEY to {env_path}")
            except Exception as e:
                logger.warning(f"Could not write key to .env file: {e}")

        return {
            "valid": True,
            "model": self.primary_model,
            "message": f"Groq API key verified! Connected to {self.primary_model}."
        }

    def set_api_key(self, api_key: str):
        """Backwards-compatible setter that calls validate_and_set_api_key."""
        self.validate_and_set_api_key(api_key, persist_to_env=True)

    def call_json_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 2500,
    ) -> Dict[str, Any]:
        """Call Groq LLM and parse the response into structured JSON."""
        if not self.is_configured():
            raise ValueError(
                "Groq API key is not configured. An active Groq API key is required to power real interview generation and evaluation."
            )

        models_to_try = self.available_models if self.available_models else DEFAULT_MODELS
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
                logger.warning(f"Groq call with model {model} (json_object mode) failed: {e}. Trying fallback...")
                last_exception = e
                # Fallback to plain text prompt if json_object mode fails on some models
                try:
                    response = self._client.chat.completions.create(
                        model=model,
                        messages=[
                            {
                                "role": "system",
                                "content": system_prompt + "\nIMPORTANT: Return ONLY a valid JSON object. Do not include any explanations outside the JSON."
                            },
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

