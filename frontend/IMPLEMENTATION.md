# Atlas frontend coverage

The workspace now connects Home, Explore, Ask Atlas, Analytics, Fisheries,
Biodiversity, Data catalog and Data operations.

- Home shows source configuration and the last loaded query, not invented totals.
- Explore retains rectangle drawing, manual bounds, presets, visible-map bounds,
  explicit loading and export. ARGO, OBIS and fishing use the selected area;
  SST and Copernicus sample its centre, explicitly labelled as point/grid data.
- Fisheries separates apparent AIS effort from locally reported catch records.
- Biodiversity provides occurrence filtering, WoRMS name resolution and validated
  eDNA/otolith metadata imports. Imports require the server's ADMIN_API_KEY.
- Analytics aligns available SST and effort dates, or accepts attributed paired
  measurements. Pearson correlation is descriptive, with coverage limitations.
- Catalog filters source configuration and exposes the research library.
- Operations displays source readiness and exports the local OKF knowledge bundle.

Scientific capabilities still requiring further implementation/data: sequence
reference matching, otolith image segmentation/classification, validated EEZ
boundaries and specialist GIS overlays, automated ingestion schedules, and
sampling-adjusted abundance/diversity models. Specimen image inspection is local
preview only. Empty datasets remain empty; imports are never fabricated.

Copernicus needs configured account credentials. Private specimen imports need
an administrator key. The API exposes shared-library reads, so this is not a
tenant-isolated deployment. Provider configuration is not a live health check.

Validation: TypeScript, production build, Vitest; backend tests for imports,
comparison and OKF; Edge navigation and mouse/touch map-selection scripts.
Browser fixture data in check-area-selection.mjs is test-only.
