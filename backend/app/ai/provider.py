"""Provider boundary. All credentials and model requests remain on the server."""
import json
import math
from urllib.parse import quote
import httpx
from pydantic import BaseModel, ValidationError
from app.config import settings

DIMENSIONS = 768


class ModelUnavailable(Exception):
    pass


def model_enabled():
    return settings.llm_provider == 'ollama' or (settings.llm_provider == 'gemini' and bool(settings.gemini_api_key))


def embedding_key():
    return f'{settings.llm_provider}:{settings.embedding_model}:{DIMENSIONS}'


async def post_json(url, payload, headers=None):
    try:
        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            async with client.stream('POST', url, json=payload, headers=headers) as response:
                response.raise_for_status()
                raw = bytearray()
                async for part in response.aiter_bytes():
                    raw.extend(part)
                    if len(raw) > 4_000_000:
                        raise ModelUnavailable('Model response exceeded its size limit.')
                data = json.loads(raw)
                if not isinstance(data, dict):
                    raise ValueError()
                return data
    except (httpx.HTTPError, ValueError):
        # Provider responses and credential-bearing URLs must not reach client errors.
        raise ModelUnavailable('Model provider is unavailable or returned an invalid response.') from None


async def generate(system: str, payload: dict, schema: type[BaseModel]):
    if not model_enabled():
        raise ModelUnavailable('No model configured; returning evidence-only results.')
    prompt = json.dumps(payload, ensure_ascii=False)
    if settings.llm_provider == 'gemini':
        url = 'https://generativelanguage.googleapis.com/v1beta/models/' + quote(settings.llm_model, safe='') + ':generateContent'
        body = {'systemInstruction': {'parts': [{'text': system}]},
                'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
                'generationConfig': {'temperature': 0, 'maxOutputTokens': 4096,
                                     'responseMimeType': 'application/json', 'responseJsonSchema': schema.model_json_schema()}}
        data = await post_json(url, body, {'x-goog-api-key': settings.gemini_api_key})
        try:
            candidate = data['candidates'][0]
            if candidate.get('finishReason') != 'STOP':
                raise ValueError()
            raw = ''.join(part.get('text', '') for part in candidate['content']['parts'] if not part.get('thought'))
        except (KeyError, IndexError, TypeError, ValueError, AttributeError):
            raise ModelUnavailable('Model did not return a complete answer.') from None
    else:
        body = {'model': settings.llm_model, 'stream': False, 'format': schema.model_json_schema(),
                'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': prompt}],
                'options': {'temperature': 0, 'num_predict': 4096}}
        data = await post_json(settings.ollama_base_url.rstrip('/') + '/api/chat', body)
        try:
            if not data.get('done') or data.get('done_reason') == 'length':
                raise ValueError()
            raw = data['message']['content']
        except (KeyError, TypeError, ValueError):
            raise ModelUnavailable('Model returned an invalid answer.') from None
    try:
        return schema.model_validate_json(raw)
    except (ValidationError, TypeError):
        raise ModelUnavailable('Model output did not satisfy the response schema.') from None


async def embed(texts: list[str], *, query=False) -> list[list[float]]:
    if not model_enabled():
        raise ModelUnavailable('Embeddings unavailable; lexical retrieval is enabled.')
    if not texts or len(texts) > 64:
        raise ValueError('Embedding batches must contain 1–64 chunks.')
    if settings.llm_provider == 'gemini':
        model = 'models/' + settings.embedding_model
        requests = [{'model': model, 'content': {'parts': [{'text': text}]},
                     'taskType': 'RETRIEVAL_QUERY' if query else 'RETRIEVAL_DOCUMENT',
                     'outputDimensionality': DIMENSIONS} for text in texts]
        data = await post_json('https://generativelanguage.googleapis.com/v1beta/' + model + ':batchEmbedContents',
                               {'requests': requests}, {'x-goog-api-key': settings.gemini_api_key})
        try:
            vectors = [item['values'] for item in data['embeddings']]
        except (KeyError, TypeError, AttributeError):
            raise ModelUnavailable('Invalid embedding response.') from None
    else:
        data = await post_json(settings.ollama_base_url.rstrip('/') + '/api/embed',
                               {'model': settings.embedding_model, 'input': texts, 'dimensions': DIMENSIONS, 'truncate': False})
        vectors = data.get('embeddings', [])
    try:
        if len(vectors) != len(texts):
            raise ValueError()
        normalized = []
        for vector in vectors:
            if len(vector) != DIMENSIONS or not all(math.isfinite(v) for v in vector):
                raise ValueError()
            length = math.sqrt(sum(v*v for v in vector))
            if not length:
                raise ValueError()
            normalized.append([v / length for v in vector])
        return normalized
    except (ValueError, TypeError):
        raise ModelUnavailable('Embedding dimensions or values are invalid; expected 768 finite values.') from None
