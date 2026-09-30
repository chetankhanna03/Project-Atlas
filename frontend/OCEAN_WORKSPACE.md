Explore combines the map, query controls, charts and returned records in one workspace.
Primary destinations include Home, Explore, Ask Atlas, Knowledge graph, Analytics,
Fisheries, Biodiversity, Data catalog and Data operations.
Explore stays mounted while navigating so draft filters and returned results persist.
Dates, coordinates, parameters and species are under **Dates & advanced filters**.
After loading, **Ask Atlas about this area** carries the loaded bounding box, dates
and region, selected datasets, species and parameter into a draft chat question.
It does not automatically send a message.
Selected research papers carry from the library to chat. Chat's area context can
be cleared independently. The research library shows loading/unavailable states
instead of claiming that a pending or failed request returned zero papers.

Choose bounds (or use the visible map area), sources and dates, then **Load data**.
Changing controls does not relabel earlier results. Source failures remain visible.

Choose a preset region, type coordinates, use the visible map area, or click
**Draw Area** and drag with a mouse or one finger. Release to fill the coordinate
fields. The cyan rectangle is the selected area; the dashed rectangle is the last
loaded area. Selection never fetches observations. Click **Load data** when ready.
**Clear Selection** restores the last loaded bounds (or the initial bounds before
loading). Escape or **Cancel drawing** exits drawing mode. Map panning resumes
after drawing. Areas crossing the date line must be split into separate queries.

`node check-area-selection.mjs` checks mouse and touch interactions with isolated
mock responses, including coordinate propagation and explicit-only data loading.

- ARGO: three GDAC files per page, with matching-file totals and Load more; QC-approved measurements, not an exhaustive regional survey.
- OBIS: 100 occurrence records per page, with total matches and Load more. The visible
  OBIS observation-period selector defaults to all recorded dates (historical inventory).
  Choose Use selected date range to apply upstream event-date filters. Historical
  occurrences are not presented as contemporary matches to ocean/fishing observations.
- Satellite SST: latest seven available days at the area centre, not an area average.
- Fishing effort: regional AIS apparent fishing hours; no inferred vessel positions or heatmap.

Expand **Source and coverage** for provenance and limitations. Markers open record
details; charts and value tables use returned measurements. Export downloads the
query and raw returned data as JSON. OpenStreetMap supplies the basemap only.

Run `npm test`, `npm run lint`, and `npm run build` for checks. With both servers
running, `node check-ui.mjs` verifies live rendering and mobile navigation using
locally installed Microsoft Edge and saves desktop/mobile screenshots.
