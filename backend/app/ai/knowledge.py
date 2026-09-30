"""Evidence relationships only. No inferred ecological or causal graph edges."""
import asyncio
import hashlib
import json
from neo4j import AsyncGraphDatabase, Query
from neo4j.exceptions import Neo4jError, DriverError
from app.config import settings


def configured():
    return bool(settings.neo4j_uri and settings.neo4j_password)


def identity(kind, value):
    return kind + ':' + hashlib.sha256(value.encode()).hexdigest()[:24]


def build(evidence, scope):
    nodes, edges = {}, []
    def node(kind, label, key=None, **properties):
        node_id = identity(kind, key or label)
        nodes.setdefault(node_id, {'id': node_id, 'kind': kind, 'label': label[:300]}).update(properties)
        return node_id
    def edge(source, target, kind):
        edges.append({'source': source, 'target': target, 'kind': kind})
    for item in evidence:
        source = node('source', item.source)
        observation = node('evidence', item.title, item.source + item.text, citation_id=item.id, data=item.model_dump(mode='json'))
        edge(source, observation, 'PROVIDES')
        if item.document_id:
            document = node('document', item.title, item.document_id, document_id=item.document_id,
                            data={'doi': item.doi, 'url': item.url, 'authors': item.authors, 'year': item.year})
            edge(document, observation, 'HAS_PASSAGE')
        for kind, value in [('species', scope.species), ('location', scope.region)]:
            if value and value.lower() in item.text.lower():
                edge(observation, node(kind, value), 'MENTIONS')
        metadata = item.metadata
        for record in metadata.get('records', [])[:50]:
            if isinstance(record, dict) and record.get('scientific_name'):
                species = node('species', record['scientific_name'])
                nodes[species].setdefault('data', {}).setdefault('observations', []).append({**record, 'source': item.source, 'retrieved_at': item.retrieved_at})
                edge(observation, species, 'MENTIONS')
        if metadata.get('bbox'):
            edge(observation, node('location', scope.region or 'Selected area', json.dumps(metadata['bbox']), data={'bbox': metadata['bbox'], 'region': scope.region}), 'OBSERVED_AT')
        if metadata.get('variable'):
            edge(observation, node('parameter', metadata['variable'], data={'unit': metadata.get('unit'), 'pressure_unit': 'dbar'}), 'MEASURES')
        if metadata.get('time'):
            edge(observation, node('time', str(metadata['time'])), 'PERIOD_START')
        if metadata.get('parameter'):
            edge(observation, node('parameter', metadata['parameter']), 'MEASURES')
        if metadata.get('latitude') is not None and metadata.get('longitude') is not None:
            edge(observation, node('location', f"{metadata['latitude']}, {metadata['longitude']}"), 'OBSERVED_AT')
        for key in ('start', 'end'):
            if metadata.get(key):
                edge(observation, node('time', str(metadata[key])), 'PERIOD_' + key.upper())
    # Link known reported taxa to papers only when explicitly mentioned.
    species_nodes = [entry for entry in nodes.values() if entry['kind'] == 'species']
    for item in evidence:
        if item.kind == 'literature':
            for species in species_nodes:
                if species['label'].lower() in item.text.lower():
                    relation = {'source': identity('evidence', item.source + item.text), 'target': species['id'], 'kind': 'MENTIONS'}
                    if relation not in edges:
                        edges.append(relation)
    return {'nodes': list(nodes.values()), 'edges': edges, 'persistence': 'request_only',
            'limitations': ['Edges record source provenance and explicit mentions, not ecological causation.']}


def driver():
    return AsyncGraphDatabase.driver(settings.neo4j_uri, auth=(settings.neo4j_user, settings.neo4j_password),
                                      connection_timeout=3, connection_acquisition_timeout=4, max_transaction_retry_time=0)


async def persist(graph):
    if not configured() or not graph['nodes']:
        return graph
    async def write(tx):
        serializable = [{key: json.dumps(value) if isinstance(value, dict) else value for key, value in node.items()} for node in graph['nodes']]
        result = await tx.run(Query('UNWIND $nodes AS row MERGE (n:AtlasEntity {id: row.id}) SET n += row', timeout=4), nodes=serializable)
        await result.consume()
        result = await tx.run(Query('''UNWIND $edges AS row
            MATCH (a:AtlasEntity {id: row.source}), (b:AtlasEntity {id: row.target})
            MERGE (a)-[:ATLAS_LINK {kind: row.kind}]->(b)''', timeout=4), edges=graph['edges'])
        await result.consume()
    try:
        async with asyncio.timeout(6):
            async with driver() as connection:
                async with connection.session(database=settings.neo4j_database) as session:
                    await session.execute_write(write)
        graph['persistence'] = 'neo4j'
    except (Neo4jError, DriverError, OSError, asyncio.TimeoutError, ValueError):
        graph['persistence'] = 'unavailable'
        graph['limitations'].append('Neo4j unavailable; this response still contains its request-local evidence graph.')
    return graph


async def related_documents(scope):
    terms = [value.lower() for value in (scope.region, scope.species) if value]
    if not configured() or not terms:
        return [], None
    try:
        async with asyncio.timeout(6):
            async with driver() as connection:
                records, _, _ = await connection.execute_query(Query('''
                    MATCH (d:AtlasEntity {kind:'document'})-[:ATLAS_LINK {kind:'HAS_PASSAGE'}]->
                          (e:AtlasEntity)-[:ATLAS_LINK {kind:'MENTIONS'}]->(t:AtlasEntity)
                    WHERE toLower(t.label) IN $terms
                    RETURN DISTINCT d.document_id AS document_id LIMIT 10''', timeout=4),
                    terms=terms, database_=settings.neo4j_database, routing_='r')
        return [record['document_id'] for record in records if record['document_id']], None
    except (Neo4jError, DriverError, OSError, asyncio.TimeoutError, ValueError):
        return [], 'Graph context unavailable; direct document retrieval was used.'
