# Project Atlas — AI-Powered Unified Ocean Intelligence Platform 🌊

**Project Atlas** is an AI-powered scientific ocean intelligence platform built for marine scientists, oceanographers, fisheries experts, policymakers, and environmental organizations.

It integrates oceanographic telemetry, commercial fisheries landings, molecular eDNA biodiversity records, NOAA satellite remote sensing, WoRMS taxonomic resolution, and RAG-powered scientific literature search into a single unified platform.

---

## 🎨 Scientific Light Theme & Design Direction

- **Light Theme Only**: Clean white (`#FFFFFF`) & off-white slate (`#F8FAFC`) backgrounds with soft ocean blue (`#0284C7`), sky blue (`#0EA5E9`), and muted aqua accents.
- **Subtle Glassmorphism**: Glass-panel styling with soft borders (`border-slate-200`) and gentle shadows (`shadow-soft-blue`).
- **Clean Typography**: Inter font hierarchy with high readability for complex data tables and hydrographic charts.

---

## 🚀 Key Modules & Feature Highlights

1. **Startup Intro Sequence (`StartupIntro.jsx`)**:
   - Clean 2.5-second intro animation with flowing ocean wave particles, an expanding glowing aqua dot, circular ocean ripple, and animated title underline.
2. **Dashboard Overview (`OverviewView.jsx`)**:
   - 4 soft metric cards: *ARGO Profiles (6+)*, *Fisheries Records (Live)*, *Biodiversity Observations (Live)*, *Scientific Sources (Connected)*.
3. **Ocean Conditions (`OceanConditionsView.jsx`)**:
   - Sea Temperature (°C), Salinity (PSU), Depth (m), and Ocean Coverage ($km^2$) charts using Recharts with light backgrounds and muted blue/cyan tones.
4. **GIS Ocean Explorer (`GisExplorerView.jsx`)**:
   - Fullscreen map with layer controls (ARGO, Fisheries, Biodiversity), soft circular markers, detailed observation popups, location search, and fullscreen view.
5. **ARGO Float Network (`ArgoFloatsView.jsx`)**:
   - Network status metrics, searchable data table, CTD profile values, and *"View on Map"* action triggers.
6. **Fisheries Intelligence (`FisheriesIntelView.jsx`)**:
   - ICAR-CMFRI catch trends, species distribution pie/bar charts, and searchable landings records.
7. **Molecular Biodiversity (`BiodiversityIntelView.jsx`)**:
   - eDNA 16S rRNA / COI sequence barcodes, species detected, and habitat hotspots.
8. **FloatChat AI Assistant (`FloatChatView.jsx`)**:
   - Conversational AI assistant supporting text responses, telemetry cards, evidence citations, typing animations, and suggested prompt pills.
9. **AI Ocean Insights (`AiInsightsView.jsx`)**:
   - Anomaly detection cards with confidence indicators (92%–98%), short explanations, supporting data, and direct telemetry exploration buttons.
10. **Scientific Research / RAG (`ScientificResearchView.jsx`)**:
    - Literature search bar, DOI links, journal citations, RAG relevance score badges, and *"Ask Scientific AI"* integration.
11. **Dataset Upload Portal (`DataUploadView.jsx`)**:
    - Drag-and-drop file uploader for CSV, JSON, and Excel datasets with validation progress tracking and record ingestion confirmation.

---

## 🛠️ Tech Stack

- **Framework**: React 18 / Vite
- **Styling**: Tailwind CSS v4, Custom Light Glassmorphism utilities
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **GIS Mapping**: Leaflet & React-Leaflet (CARTO Voyager Scientific Light tiles)
- **Icons**: Lucide React

---

## 🔧 Setup & Installation

1. **Navigate to the project folder**:
   ```bash
   cd "C:\Users\A.K SINGH\.gemini\antigravity\scratch\project-atlas-frontend"
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```

3. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 🔗 API Integration Architecture

Centralized API client (`src/services/api.js`) configured for `http://127.0.0.1:8000`:
- `GET /api/argo/observations`, `POST /api/argo/observations`
- `GET /api/fisheries`, `POST /api/fisheries`
- `GET /api/biodiversity`, `POST /api/biodiversity`
- `POST /api/upload/argo`, `POST /api/upload/fisheries`, `POST /api/upload/biodiversity`
- `POST /api/agent/query`
- `POST /api/rag/query`
