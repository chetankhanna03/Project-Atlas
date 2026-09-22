from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base


class ResearchDocument(Base):
    __tablename__ = 'research_documents'
    id = Column(String(64), primary_key=True)
    title = Column(String(300), nullable=False)
    source_url = Column(Text, nullable=False)
    authors = Column(JSON, nullable=False, default=list)
    year = Column(Integer)
    doi = Column(String(200))
    license = Column(String(200), nullable=False)
    content_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    chunks = relationship('ResearchChunk', cascade='all, delete-orphan', back_populates='document')


class ResearchChunk(Base):
    __tablename__ = 'research_chunks'
    id = Column(String(80), primary_key=True)
    document_id = Column(String(64), ForeignKey('research_documents.id'), nullable=False, index=True)
    ordinal = Column(Integer, nullable=False)
    page = Column(Integer)
    text = Column(Text, nullable=False)
    embedding_model = Column(String(200), index=True)
    embedding = Column(Vector(768).with_variant(JSON, 'sqlite'), nullable=True)
    document = relationship('ResearchDocument', back_populates='chunks')
