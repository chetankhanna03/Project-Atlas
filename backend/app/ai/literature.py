"""Optional, bounded OpenAlex abstract search. Never claims to have read full papers."""
from datetime import datetime, timezone
import httpx
from app.config import settings
from app.ai.schemas import Evidence
from app.ai.provider import ModelUnavailable


async def search_openalex(query):
    if not settings.openalex_enabled or not settings.openalex_api_key:
        raise ModelUnavailable('OpenAlex search is not configured. Search the curated library or configure OPENALEX_ENABLED and OPENALEX_API_KEY.')
    try:
        async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as client:
            response = await client.get('https://api.openalex.org/works',
                                        params={'search': query[:500], 'per_page': 5},
                                        headers={'Authorization': 'Bearer ' + settings.openalex_api_key})
            response.raise_for_status()
            if len(response.content) > 2_000_000:
                raise ValueError()
            data = response.json()
        results = data['results']
        if not isinstance(results, list):
            raise ValueError()
        evidence = []
        for work in results[:5]:
            if work.get('is_retracted'):
                continue
            index = work.get('abstract_inverted_index')
            if not isinstance(index, dict):
                continue
            words = {}
            for word, positions in index.items():
                for position in positions:
                    if isinstance(position, int) and 0 <= position < 2000:
                        words[position] = str(word)
            abstract = ' '.join(words[i] for i in sorted(words))[:6000]
            if not abstract:
                continue
            identifier = work['id'].rsplit('/', 1)[-1]
            if not identifier.startswith('W') or not identifier[1:].isdigit():
                continue
            evidence.append(Evidence(id='OA-' + identifier, domain='research', title=work.get('display_name') or identifier,
                                      text=abstract, source='OpenAlex abstract', kind='literature',
                                      url=work.get('doi') or 'https://openalex.org/' + identifier,
                                      doi=work.get('doi'), year=work.get('publication_year'),
                                      authors=[item['author']['display_name'] for item in work.get('authorships', [])[:10]],
                                      retrieved_at=datetime.now(timezone.utc).isoformat(),
                                      metadata={'coverage': 'abstract_only', 'openalex_id': work['id']}))
        return evidence
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        raise ModelUnavailable('OpenAlex unavailable or returned an invalid response; no papers were fabricated.') from None
