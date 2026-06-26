from openai import AsyncOpenAI
from core.config import settings
import structlog

logger = structlog.get_logger()


def get_llm_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.LLM_API_KEY or "not-needed",
        base_url=settings.LLM_BASE_URL or None,
    )


async def llm_call(
    messages: list,
    model: str = None,
    temperature: float = 0.7,
    max_tokens: int = 2000,
    response_format: dict = None,
) -> str:
    """Central LLM call wrapper with logging."""
    client = get_llm_client()
    model = model or settings.LLM_MODEL

    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format:
        kwargs["response_format"] = response_format

    try:
        response = await client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content
        logger.info("llm_call_success", model=model, tokens=response.usage.total_tokens)
        return content
    except Exception as e:
        logger.error("llm_call_failed", error=str(e), model=model)
        raise