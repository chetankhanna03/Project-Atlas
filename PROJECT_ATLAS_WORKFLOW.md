# Project Atlas workflow

This describes the current MVP. Optional integrations require configuration; an unavailable source is reported rather than replaced with invented data.

## 1. Overall platform

```mermaid
flowchart TD
    U[User opens Atlas] --> H[Home]
    H --> E[Explore ocean data]
    H --> C[Ask Atlas]
    H --> L[Research library]

    E --> Q[Choose area, dates and sources]
    Q --> LOAD[Click Load data]
    LOAD --> API[FastAPI validates query]
    API --> AD[Query selected source adapters]
    AD --> QC[Normalize records and apply source quality checks]
    QC --> OUT[Return records, provenance and individual source statuses]
    OUT --> MAP[Map and source cards]
    OUT --> CH[Charts and inspectable records]
    OUT --> KG[Evidence graph]
    OUT --> AN[Optional descriptive analysis]
    MAP --> SC[Ask Atlas about this area]
    SC --> C

    C --> ROUTE{Answer mode and question intent}
    ROUTE -->|Conversation| GEN[General answer using recent chat context]
    ROUTE -->|Research or data| PLAN[Plan relevant domains and scope]
    PLAN --> AG[Run selected domain agents]
    AG --> EV[Collect observations and relevant passages]
    EV --> SYN[Compose and validate cited claims]
    SYN --> ANSWER[Answer with citations and limitations]
    GEN --> LABEL[Clearly labelled: not source-verified]

    L --> IMP[Authorized import of permitted documents]
    IMP --> STORE[Extract, chunk and store text with metadata]
    STORE --> EV
```

The library connection above represents later retrieval from stored passages, not automatic transmission of every imported document to the model.

## 2. Map exploration

```mermaid
flowchart TD
    START[Open Explore] --> AREA{Choose area method}
    AREA --> PRE[Preset region]
    AREA --> MAN[Manual coordinates]
    AREA --> DRAW[Draw rectangle with mouse or touch]
    AREA --> VIS[Use visible map area]
    PRE --> BBOX[West / South / East / North]
    MAN --> BBOX
    DRAW --> BBOX
    VIS --> BBOX
    BBOX --> FILTER[Choose dates, parameters and sources]
    FILTER --> WAIT[Selection ready: no automatic request]
    WAIT --> CLICK[User clicks Load data]
    CLICK --> VALID{Valid query?}
    VALID -->|No| FIX[Explain what to correct]
    FIX --> FILTER
    VALID -->|Yes| FETCH[Fetch selected sources independently]
    FETCH --> STATUS[Keep successful results and disclose source failures]
    STATUS --> RENDER[Update map, cards, charts and records]
    RENDER --> MORE{More records needed?}
    MORE -->|Yes| PAGE[Load next page and merge records]
    PAGE --> RENDER
    RENDER --> CLEAR[Clear Selection]
    CLEAR --> EMPTY[Cancel pending requests and clear loaded overlays/results]
    EMPTY --> BASE[Base map remains available]
```

- OBIS can use all recorded dates or the selected observation period.
- ARGO file discovery is paginated; a file can contain several profiles or no usable profiles after QC.
- A page size is not the total number of observations in the ocean.
- Map rendering is capped at 2,000 eligible loaded locations. Source totals, retrieved counts and displayed counts are different.

## 3. Source retrieval and quality

```mermaid
flowchart LR
    REQ[Validated request] --> SRC{Requested source}
    SRC --> ARGO[ARGO: local metadata index then selected NetCDF files]
    SRC --> OBIS[OBIS: occurrence pages]
    SRC --> GFW[GFW: apparent fishing-effort reports]
    SRC --> SST[SST: numerical ERDDAP point series]
    SRC --> COP[Copernicus: supported model point data]
    ARGO --> N[Normalize units, coordinates, dates and provenance]
    OBIS --> N
    GFW --> N
    SST --> N
    COP --> N
    N --> QUAL[Preserve and evaluate available quality metadata]
    QUAL --> RES[Records plus source status and limitations]
```

OBIS map eligibility:

```mermaid
flowchart TD
    ROW[Loaded OBIS record] --> CHECK{Source flags and location checks permit default mapping?}
    CHECK -->|Yes| PURPLE[Eligible purple marker]
    CHECK -->|Flagged or unchecked| HIDE[Hidden by default]
    HIDE --> REVIEW{User enables review toggle?}
    REVIEW -->|Yes| AMBER[Amber marker with original coordinates and warnings]
    REVIEW -->|No| KEEP[Retain raw record and counts for inspection]
```

If all loaded locations have `ON_LAND` flags, the card says **Locations flagged on land**. This relies on source QC; it is not an independent coastline survey. Occurrences include many taxa and do not measure fish abundance.

Charts use valid numerical rows, remove exact duplicate chart series and omit series with fewer than two points. The overview shows the widest loaded pressure range per float and measurement; other distinct profiles remain expandable. ARGO charts show value against pressure, not change over time.

## 4. Ask Atlas: conversation or evidence

```mermaid
flowchart TD
    MSG[Message + up to eight recent turns + optional selected scope] --> MODE{Selected answer mode}
    MODE -->|Conversation| CHAT[General conversational handler]
    MODE -->|Research| PIPE[Research and data workflow]
    MODE -->|Auto| INTENT{Application routing}
    INTENT -->|Simple questions and conversational follow-ups| CHAT
    INTENT -->|Data, sources, literature or selected documents| PIPE

    CHAT --> GREET{Simple greeting or thanks?}
    GREET -->|Yes| LOCAL[Local conversational response]
    GREET -->|No| LLM[Configured LLM with history and scope]
    LLM --> AVAIL{Response available?}
    AVAIL -->|Yes| GENERAL[General answer: not source-verified]
    AVAIL -->|No| ERR[Explain model unavailability]
    LOCAL --> GENERAL

    PIPE --> P[Planner determines domains and scope]
    P --> NEED{Clarification required?}
    NEED -->|Yes| CLARIFY[Ask a focused clarification]
    NEED -->|No| SELECT[Run only selected agents]
    SELECT --> EVID[Assemble relevant evidence]
    EVID --> COMPOSE[Generate and check cited claims]
    COMPOSE --> CITE[Answer, citations, limitations and evidence graph]
```

Auto routing is heuristic. The user can choose Research to request retrieved evidence explicitly. Conversation mode does not query data tools or selected papers, even if a geographic scope is present. Selected scope is context, not proof of current conditions.

## 5. Agent orchestration

```mermaid
flowchart TD
    PLAN[Validated plan] --> O[Ocean agent, if selected]
    PLAN --> F[Fisheries agent, if selected]
    PLAN --> B[Biodiversity agent, if selected]
    PLAN --> R[Research agent, if selected]

    O --> OS[ARGO / SST / supported Copernicus queries]
    F --> FS[GFW effort or separately labelled local landings]
    B --> BS[OBIS / GBIF / WoRMS / supported IUCN queries]
    R --> RS[Local library / optional OpenAlex / explicit dataset discovery]

    OS --> JOIN[Join selected agent outcomes]
    FS --> JOIN
    BS --> JOIN
    RS --> JOIN
    JOIN --> IDS[Evidence IDs, provenance and source limitations]
    IDS --> ANSWER[Answer composition and support checks]
```

LangGraph coordinates these bounded workflows. These are specialized application agents, not four independently trained models. Provider failures remain visible; successful evidence can still be used. NASA/NOAA catalog discovery returns metadata, not automatically downloaded scientific measurements.

## 6. Research library and RAG

```mermaid
flowchart TD
    DOC[Permitted PDF / text / Markdown] --> AUTH[Authorized import and validation]
    AUTH --> EXTRACT[Extract text; preserve PDF page context]
    EXTRACT --> CHUNK[Create passages with document metadata]
    CHUNK --> DB[Store in shared SQL library]
    DB --> OKF[Generate structured OKF passage concepts]

    QUESTION[Research query] --> CAND[Initial candidate retrieval]
    OKF --> CAND
    CAND --> TOP[Up to 32 candidates]
    TOP --> SEM[Local semantic and paper-topic reranking]
    SEM --> FILTER[Reject low relevance and redundant passages]
    FILTER --> PICK[At most four passages; at most two per source]
    PICK --> ENOUGH{Relevant evidence available?}
    ENOUGH -->|No| ABSTAIN[State insufficient evidence]
    ENOUGH -->|Yes| SYN[Configured LLM synthesizes cited claims]
    SYN --> VALIDATE[Validate citations, quantities and claim support]
    VALIDATE --> RESULT[Supported answer with traceable sources]
```

Current retrieval uses OKF/BM25 candidate discovery followed by local semantic reranking with `BAAI/bge-base-en-v1.5`. The alternative hybrid path combines lexical and vector retrieval. OKF is a structured knowledge format, not a replacement language model. Local reranking does not require sending passages to a cloud model; synthesis and model-based support review can send selected passages externally.

## 7. Answer validation and fallback

```mermaid
flowchart TD
    CLAIMS[Generated claims and evidence IDs] --> BASIC[Schema, citation and quantity checks]
    BASIC --> SUPPORT[Local exact-sentence checks or separate model review]
    SUPPORT --> OUTCOME{Support outcome}
    OUTCOME -->|Supported| INCLUDE[Include claim with inline citations]
    OUTCOME -->|Unsupported or uncertain| REPAIR[Bounded repair attempt where applicable]
    REPAIR --> RECHECK{Repaired claim passes?}
    RECHECK -->|Yes| INCLUDE
    RECHECK -->|No| OMIT[Withhold claim]
    OMIT --> FALLBACK[Use verified provider summaries if available; disclose missing support]
    INCLUDE --> FINAL[Final answer and source details]
    FALLBACK --> FINAL
```

Citation checks and model review are fallible safeguards, not proof of scientific truth. A failed literature synthesis must not be presented as a successful answer by substituting unrelated raw passages.

## 8. Graph and analytics

```mermaid
flowchart LR
    DATA[Loaded observations or chat evidence] --> GRAPH[Typed sources, records, taxa, locations and periods]
    GRAPH --> UI[Interactive graph: inspect, expand, pan and zoom]
    UI --> TAX[Optional exact WoRMS name resolution]
    GRAPH --> NEO[Optional Neo4j persistence when configured]

    LOADED[Loaded ARGO and GFW samples] --> QC[Check bounds, QC and shallow pressure range]
    QC --> DAILY[Aggregate and match exact UTC dates]
    DAILY --> OVERLAP{Enough usable overlap?}
    OVERLAP -->|No| STOP[Explain insufficient data]
    OVERLAP -->|Yes| DESC[Descriptive comparison with sample size and limitations]
```

The graph records provenance and explicit relationships, not causal discoveries. The ARGO/GFW analysis uses shallow 0–10 dbar measurements and needs at least three overlapping dates; constant series do not yield a useful correlation. Fishing effort is not catch, and association does not establish mortality, population decline or causation.

## 9. Five-step presentation version

1. **Choose a question or area.** Use plain-language chat or geographic selection.
2. **Retrieve relevant evidence.** Query only the required providers and library passages.
3. **Check and organize it.** Preserve provenance, quality flags, relevance and limitations.
4. **Explain and visualize it.** Show maps, profiles, source records, graphs and appropriately labelled answers.
5. **Let the user investigate further.** Follow citations, load more records, inspect warnings or ask a follow-up.

**Presentation sentence:** Project Atlas connects a user's question or selected ocean area to relevant data and literature, then presents understandable results with traceable sources and explicit limits.

## 10. Operational boundary

- Frontend: React/TypeScript/Vite, normally on port 3000.
- Backend: FastAPI/Uvicorn, normally on port 8000.
- Default persistence: `backend/atlas-local.db`; ARGO discovery uses a separate metadata index.
- The current local research library contains 11 document entries and 674 chunks, as checked on 30 September 2026.
- External provider availability, credentials and model reliability affect results.
- eDNA and otolith workflows currently support metadata and limited validation, not automated species or image classification.
- Forecasting, exhaustive global ingestion and production multi-user infrastructure are outside this MVP workflow.

For full architecture, setup, API details and limitations, see [PROJECT_ATLAS_COMPLETE_GUIDE.txt](PROJECT_ATLAS_COMPLETE_GUIDE.txt).
