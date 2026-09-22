"""Explicit optional Neo4j schema initialization; never runs at server import."""
import asyncio
from app.ai.knowledge import configured, driver
from app.config import settings


async def main():
    if not configured():
        raise SystemExit('Configure NEO4J_URI, NEO4J_USER and NEO4J_PASSWORD first.')
    async with driver() as connection:
        await connection.execute_query('CREATE CONSTRAINT atlas_entity_id IF NOT EXISTS FOR (n:AtlasEntity) REQUIRE n.id IS UNIQUE',
                                        database_=settings.neo4j_database)
    print('Atlas evidence graph constraint initialized.')


if __name__ == '__main__':
    asyncio.run(main())
