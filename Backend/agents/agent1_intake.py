"""
Agent 1 — Content Intake Agent

Handles:
  - LinkedIn URL → Playwright browser extraction
  - Screenshot (PNG/JPEG) → Mistral OCR / Tesseract
  - PDF → pypdf text extraction
  - Plain text → direct passthrough

Output: structured post data in AgentState
"""

import base64
import json
import re
from typing import Optional

import structlog
from core.llm import llm_call
from agents.state import AgentState

logger = structlog.get_logger()


# ── Helpers ─────────────────────────────────────────────────

async def extract_from_url(url: str) -> dict:
    """Use Playwright to load a LinkedIn post and extract its content."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            # Set a realistic user agent
            await page.set_extra_http_headers({
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            })

            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2000)

            # Extract post content using page evaluation
            data = await page.evaluate("""
                () => {
                    // Try multiple selectors LinkedIn uses
                    const postTextSelectors = [
                        '.feed-shared-update-v2__description',
                        '.update-components-text',
                        '[data-test-id="main-feed-activity-card__commentary"]',
                    ];
                    let postText = '';
                    for (const sel of postTextSelectors) {
                        const el = document.querySelector(sel);
                        if (el) { postText = el.innerText; break; }
                    }

                    const authorEl = document.querySelector(
                        '.update-components-actor__name span[aria-hidden="true"]'
                    );
                    const likesEl = document.querySelector(
                        '.social-details-social-counts__reactions-count'
                    );
                    const commentsEl = document.querySelector(
                        '.social-details-social-counts__comments'
                    );

                    return {
                        post_text: postText || '',
                        author_name: authorEl ? authorEl.innerText : '',
                        likes: parseInt((likesEl?.innerText || '0').replace(/[^0-9]/g, '')) || 0,
                        comments_count: parseInt((commentsEl?.innerText || '0').replace(/[^0-9]/g, '')) || 0,
                    };
                }
            """)

            await browser.close()

            if not data.get("post_text"):
                # Fallback: get all visible text
                body_text = await page.inner_text("body")
                data["post_text"] = body_text[:5000]

            return data

    except Exception as e:
        logger.warning("playwright_extraction_failed", error=str(e))
        return {
            "post_text": "",
            "author_name": "",
            "likes": 0,
            "comments_count": 0,
            "error": str(e),
        }


async def extract_from_screenshot(image_data: str) -> str:
    """
    Use Mistral OCR (preferred) or Tesseract (fallback) to extract text
    from a base64-encoded image.
    """
    from core.config import settings

    # Try Mistral OCR first
    if settings.MISTRAL_API_KEY:
        try:
            from mistralai import Mistral
            client = Mistral(api_key=settings.MISTRAL_API_KEY)

            # Determine if data is already base64 or a path
            if image_data.startswith("data:"):
                image_url = image_data
            else:
                image_url = f"data:image/png;base64,{image_data}"

            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": image_url,
                        },
                        {
                            "type": "text",
                            "text": (
                                "Extract ALL text from this LinkedIn post screenshot. "
                                "Return only the post text, author name, and any visible "
                                "engagement numbers. Format as JSON: "
                                '{"post_text": "", "author_name": "", "likes": 0}'
                            ),
                        },
                    ],
                }
            ]

            response = client.chat.complete(
                model="pixtral-12b-2409",
                messages=messages,
            )
            raw = response.choices[0].message.content

            # Try to parse as JSON
            clean = raw.strip()
            if clean.startswith("```"):
                clean = re.sub(r"```json|```", "", clean).strip()
            parsed = json.loads(clean)
            return parsed.get("post_text", raw)

        except Exception as e:
            logger.warning("mistral_ocr_failed", error=str(e))

    # Fallback: Tesseract
    try:
        import pytesseract
        from PIL import Image
        import io

        if "," in image_data:
            image_data = image_data.split(",")[1]
        img_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(img_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()

    except Exception as e:
        logger.error("tesseract_ocr_failed", error=str(e))
        return ""


async def extract_from_pdf(pdf_data: str) -> str:
    """Extract text from a base64-encoded PDF."""
    try:
        import pypdf
        import io

        if "," in pdf_data:
            pdf_data = pdf_data.split(",")[1]
        pdf_bytes = base64.b64decode(pdf_data)
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))

        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)

        return "\n\n".join(text_parts)

    except Exception as e:
        logger.error("pdf_extraction_failed", error=str(e))
        return ""


async def clean_and_structure_text(raw_text: str) -> dict:
    """
    Use LLM to clean extracted text and identify post boundaries
    (especially useful for OCR output which may have noise).
    """
    prompt = f"""You are extracting content from a LinkedIn post.

Raw extracted text:
{raw_text[:3000]}

Extract and return ONLY valid JSON with these fields:
{{
  "post_text": "the main post content, cleaned and complete",
  "author_name": "author name if visible, else empty string",
  "estimated_likes": 0,
  "estimated_comments": 0
}}

Rules:
- post_text should be the complete post body, no truncation
- Remove UI chrome like "Like", "Comment", "Share" buttons
- Keep hashtags and emojis
- Return ONLY the JSON, no other text"""

    response = await llm_call(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1500,
    )

    try:
        clean = response.strip()
        if clean.startswith("```"):
            clean = re.sub(r"```json|```", "", clean).strip()
        return json.loads(clean)
    except Exception:
        return {
            "post_text": raw_text,
            "author_name": "",
            "estimated_likes": 0,
            "estimated_comments": 0,
        }


# ── Main Agent Node ─────────────────────────────────────────

async def content_intake_agent(state: AgentState) -> AgentState:
    """
    Agent 1: Content Intake

    Reads state.input_source and state.input_data,
    populates: post_text, author_name, likes, comments_count
    """
    logger.info("agent1_content_intake_start", source=state["input_source"])

    source = state["input_source"]
    data = state["input_data"]

    try:
        if source == "url":
            extracted = await extract_from_url(data)
            post_text = extracted.get("post_text", "")

            # If playwright returned minimal content, use LLM to clean
            if len(post_text) < 50:
                post_text = data  # fallback to URL itself for error message

            state["post_text"] = post_text
            state["author_name"] = extracted.get("author_name", "")
            state["author_profile"] = data
            state["likes"] = extracted.get("likes", 0)
            state["comments_count"] = extracted.get("comments_count", 0)
            state["post_timestamp"] = ""

        elif source == "screenshot":
            raw_text = await extract_from_screenshot(data)
            structured = await clean_and_structure_text(raw_text)
            state["post_text"] = structured["post_text"]
            state["author_name"] = structured.get("author_name", "")
            state["author_profile"] = ""
            state["likes"] = structured.get("estimated_likes", 0)
            state["comments_count"] = structured.get("estimated_comments", 0)
            state["post_timestamp"] = ""

        elif source == "pdf":
            raw_text = await extract_from_pdf(data)
            structured = await clean_and_structure_text(raw_text)
            state["post_text"] = structured["post_text"]
            state["author_name"] = structured.get("author_name", "")
            state["author_profile"] = ""
            state["likes"] = 0
            state["comments_count"] = 0
            state["post_timestamp"] = ""

        elif source == "text":
            # Direct text — run through LLM cleanup
            structured = await clean_and_structure_text(data)
            state["post_text"] = structured["post_text"]
            state["author_name"] = structured.get("author_name", "")
            state["author_profile"] = ""
            state["likes"] = 0
            state["comments_count"] = 0
            state["post_timestamp"] = ""

        else:
            raise ValueError(f"Unknown input source: {source}")

        if not state.get("post_text"):
            raise ValueError("Could not extract post text from provided input")

        state["intake_error"] = None
        logger.info(
            "agent1_content_intake_complete",
            text_length=len(state["post_text"]),
            author=state.get("author_name"),
        )

    except Exception as e:
        logger.error("agent1_content_intake_error", error=str(e))
        state["intake_error"] = str(e)
        errors = state.get("errors", [])
        errors.append(f"Content Intake: {str(e)}")
        state["errors"] = errors

    return state