import { Dataset, ArgoFloat, FishingVessel, ScientificCitation, ChatMessage } from '../types';

export const DATASETS: Dataset[] = [
  {
    id: 'copernicus-sst-l4',
    title: 'Global Sea Surface Temperature (SST) - L4 Blended',
    description: 'High-resolution gap-free daily foundation SST analysis based on satellite and in-situ observations.',
    domain: 'Physics',
    domainTag: 'Physics',
    region: 'Global Ocean',
    sourceAgency: 'NOAA NCEI',
    resolution: '0.05° ~5km',
    spatialResolution: '0.05° x 0.05°',
    frequency: 'Daily',
    sourceNode: 'NOAA CoastWatch / NCEI',
    status: 'indexed',
    doi: '10.48670/moi-00165',
    sourceUrl: 'https://data.marine.copernicus.eu/product/SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001/',
    format: 'NetCDF-4',
    lastUpdated: '2024-10-24 08:00Z',
    parameters: [
      { name: 'analysed_sst', standardName: 'sea_surface_foundation_temperature', unit: 'kelvin', validRange: '-2.0 to 45.0' },
      { name: 'analysis_error', standardName: 'sea_surface_foundation_temperature standard_error', unit: 'kelvin', validRange: '0.0 to 327.67' },
      { name: 'sea_ice_fraction', standardName: 'sea_ice_area_fraction', unit: 'fraction', validRange: '0.0 to 1.0' },
      { name: 'mask', standardName: 'sea_land_ice_bit_mask', unit: 'dimensionless', validRange: '1 to 31' }
    ]
  },
  {
    id: 'copernicus-biogeo-hindcast',
    title: 'Global Ocean Biogeochemistry Hindcast',
    description: '3D physical-biogeochemical model providing nutrients, plankton, and carbon cycle parameters.',
    domain: 'Biogeochemistry',
    domainTag: 'BioGeo',
    region: 'Global Ocean',
    sourceAgency: 'Copernicus Marine',
    resolution: '0.25° ~25km',
    spatialResolution: '0.25° x 0.25°',
    frequency: 'Weekly',
    sourceNode: 'Copernicus Marine Service',
    status: 'on-demand',
    doi: '10.48670/moi-00019',
    sourceUrl: 'https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_BGC_001_029/',
    format: 'NetCDF-4',
    lastUpdated: '2024-10-22 12:00Z',
    parameters: [
      { name: 'chl', standardName: 'mass_concentration_of_chlorophyll_a_in_sea_water', unit: 'mg/m3', validRange: '0.0 to 100.0' },
      { name: 'o2', standardName: 'mole_concentration_of_dissolved_molecular_oxygen_in_sea_water', unit: 'mmol/m3', validRange: '0.0 to 600.0' },
      { name: 'ph', standardName: 'sea_water_ph_reported_on_total_scale', unit: 'dimensionless', validRange: '6.5 to 9.0' },
      { name: 'nppv', standardName: 'net_primary_production_of_biomass_expressed_as_carbon', unit: 'mg/m3/day', validRange: '0.0 to 500.0' }
    ]
  },
  {
    id: 'oscar-surface-currents',
    title: 'Ocean Surface Current Velocity (OSCAR)',
    description: 'Ocean Surface Current Analysis Real-time derived from satellite altimeter and scatterometer.',
    domain: 'Physics',
    domainTag: 'Physics',
    region: 'Global Ocean',
    sourceAgency: 'NASA JPL',
    resolution: '0.33° ~33km',
    spatialResolution: '0.33° x 0.33°',
    frequency: '5-Day',
    sourceNode: 'NASA JPL PO.DAAC',
    status: 'indexed',
    doi: '10.5067/OSCAR-25M01',
    sourceUrl: 'https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_third-deg',
    format: 'NetCDF-4',
    lastUpdated: '2024-10-23 04:00Z',
    parameters: [
      { name: 'u', standardName: 'eastward_sea_water_velocity', unit: 'm/s', validRange: '-5.0 to 5.0' },
      { name: 'v', standardName: 'northward_sea_water_velocity', unit: 'm/s', validRange: '-5.0 to 5.0' },
      { name: 'um', standardName: 'magnitude_sea_water_velocity', unit: 'm/s', validRange: '0.0 to 8.0' }
    ]
  },
  {
    id: 'gfw-ais-vessels',
    title: 'Global Fishing Watch Pelagic AIS Telemetry',
    description: 'Global automatic identification system vessel positions, estimated fishing effort, and vessel classification.',
    domain: 'Fisheries',
    domainTag: 'Fisheries',
    region: 'Indo-Pacific',
    sourceAgency: 'Global Fishing Watch',
    resolution: '0.01° ~1km',
    spatialResolution: '0.01° x 0.01°',
    frequency: 'Hourly',
    sourceNode: 'GFW BigQuery Public Datasets',
    status: 'indexed',
    doi: '10.1126/science.aar4461',
    sourceUrl: 'https://globalfishingwatch.org/data-download/',
    format: 'GeoParquet',
    lastUpdated: '2024-10-24 10:30Z',
    parameters: [
      { name: 'mmsi', standardName: 'maritime_mobile_service_identity', unit: 'id', validRange: '100000000 to 999999999' },
      { name: 'apparent_fishing_hours', standardName: 'fishing_effort_hours', unit: 'hours', validRange: '0 to 24' },
      { name: 'vessel_gear', standardName: 'vessel_gear_classification', unit: 'categorical', validRange: 'trawler, longline, purse_seine' }
    ]
  },
  {
    id: 'argo-global-floats',
    title: 'Argo In-Situ Float Profiling Grid',
    description: 'Autonomous robotic floats profiling temperature, salinity, and biogeochemical parameters across 0-2000m depths.',
    domain: 'Physics',
    domainTag: 'Physics',
    region: 'Global Ocean',
    sourceAgency: 'NOAA NCEI',
    resolution: 'Point Sensor Array',
    spatialResolution: '3° nominal spacing',
    frequency: '10-Day Cycle',
    sourceNode: 'US GODAE / Coriolis DAC',
    status: 'indexed',
    doi: '10.17882/42182',
    sourceUrl: 'https://argo.ucsd.edu/data/',
    format: 'NetCDF',
    lastUpdated: '2024-10-24 09:15Z',
    parameters: [
      { name: 'TEMP', standardName: 'sea_water_temperature', unit: '°C', validRange: '-2.5 to 35.0' },
      { name: 'PSAL', standardName: 'sea_water_practical_salinity', unit: 'PSU', validRange: '2.0 to 42.0' },
      { name: 'PRES', standardName: 'sea_water_pressure', unit: 'dbar', validRange: '0 to 2000' }
    ]
  },
  {
    id: 'edna-marine-biodiversity',
    title: 'Ocean Marine Biodiversity eDNA Database',
    description: 'Environmental DNA spatial sequencing records tracking teleost fish, cetacean, and elasmobranch abundance.',
    domain: 'Biodiversity',
    domainTag: 'Biodiversity',
    region: 'Indo-Pacific',
    sourceAgency: 'Copernicus Marine',
    resolution: '0.1°',
    spatialResolution: '0.1° x 0.1°',
    frequency: 'Monthly',
    sourceNode: 'OBIS / Ocean Biodiversity Info',
    status: 'on-demand',
    doi: '10.1038/s41597-021-00898-w',
    sourceUrl: 'https://obis.org/',
    format: 'Darwin Core Archive',
    lastUpdated: '2024-10-15 00:00Z',
    parameters: [
      { name: 'species_richness', standardName: 'biological_taxa_richness', unit: 'species count', validRange: '0 to 450' },
      { name: 'shannon_index', standardName: 'shannon_wiener_diversity_index', unit: 'index', validRange: '0.0 to 5.0' }
    ]
  }
];

export const ARGO_FLOATS: ArgoFloat[] = [
  { id: 'F-2902144', wmoId: '2902144', lat: 8.45, lng: 73.12, topPct: 30, leftPct: 40, temp: 28.4, salinity: 34.8, depth: 1850, status: 'nominal', cycleNumber: 142, lastProfileDate: '2024-10-24 06:12 UTC' },
  { id: 'F-2903381', wmoId: '2903381', lat: -2.15, lng: 80.45, topPct: 45, leftPct: 55, temp: 29.1, salinity: 35.2, depth: 2000, status: 'warning', cycleNumber: 98, lastProfileDate: '2024-10-24 04:45 UTC' },
  { id: 'F-2901990', wmoId: '2901990', lat: 14.80, lng: 68.20, topPct: 60, leftPct: 35, temp: 27.9, salinity: 36.1, depth: 1420, status: 'nominal', cycleNumber: 215, lastProfileDate: '2024-10-23 22:30 UTC' },
  { id: 'F-2904102', wmoId: '2904102', lat: 11.20, lng: 88.60, topPct: 25, leftPct: 65, temp: 29.8, salinity: 33.4, depth: 1950, status: 'nominal', cycleNumber: 64, lastProfileDate: '2024-10-24 08:02 UTC' },
  { id: 'F-2900877', wmoId: '2900877', lat: 4.10, lng: 62.40, topPct: 52, leftPct: 28, temp: 28.2, salinity: 35.5, depth: 1900, status: 'nominal', cycleNumber: 180, lastProfileDate: '2024-10-24 01:18 UTC' }
];

export const FISHING_VESSELS: FishingVessel[] = [
  { id: 'V-IND-4401', name: 'Blue Marlin IX', flag: 'India', type: 'Tuna Longliner', topPct: 34, leftPct: 44, speedKnots: 8.4, heading: 142, gearType: 'Pelagic Longline', status: 'active' },
  { id: 'V-LKA-1120', name: 'Ocean Pioneer 3', flag: 'Sri Lanka', type: 'Purse Seiner', topPct: 48, leftPct: 58, speedKnots: 3.2, heading: 210, gearType: 'Purse Seine', status: 'hauling' },
  { id: 'V-MDV-0892', name: 'Albatross II', flag: 'Maldives', type: 'Pole and Line', topPct: 28, leftPct: 38, speedKnots: 7.1, heading: 85, gearType: 'Pole & Line', status: 'active' },
  { id: 'V-UNKNOWN-7', name: 'Vessel AIS-Dark 88', flag: 'Unflagged', type: 'Industrial Trawler', topPct: 62, leftPct: 62, speedKnots: 2.1, heading: 330, gearType: 'Bottom Trawl', status: 'drifting' }
];

export const SCIENTIFIC_CITATIONS: ScientificCitation[] = [
  {
    refId: 'DOI:10.1038',
    title: 'Global severe marine heatwaves and their impacts on fisheries',
    publication: 'Nature (2021)',
    authors: 'Smith et al.',
    year: 2021,
    extractedInsight: 'Prolonged extreme temperature events resulted in a 22% average decline in regional commercial catch rates due to thermal stratification disruption and prey shift.',
    relevanceScore: 0.95
  },
  {
    refId: 'NOAA-TR',
    title: 'Pacific Thermocline Dynamics during El Niño and Indian Ocean Dipole',
    publication: 'NOAA Technical Report (2022)',
    authors: 'Harrison, V. & Chen, Y.',
    year: 2022,
    extractedInsight: 'The deepening of the mixed layer restricts nutrient upwelling, systematically starving the lower trophic levels and precipitating zooplankton migration.',
    relevanceScore: 0.82
  },
  {
    refId: 'FAO-REP',
    title: 'Vulnerability of Artisanal Fisheries to Climate Shocks in Indo-Pacific',
    publication: 'UN FAO Technical Series (2023)',
    authors: 'FAO Fisheries Committee',
    year: 2023,
    extractedInsight: 'Coastal fleets reported inability to adapt to the spatial shifting of traditional stocks during the 2020 anomaly, requiring 40% higher fuel expenditure.',
    relevanceScore: 0.78
  },
  {
    refId: 'ICES-JMS',
    title: 'Biomass displacement under anomalous warming regimes in pelagic waters',
    publication: 'ICES Journal of Marine Science (2023)',
    authors: 'O\'Connor, K. et al.',
    year: 2023,
    extractedInsight: 'Correlation between Sea Surface Temperature Anomalies (SSTA > +1.5°C) and CPUE decreases across yellowfin tuna schools with a 12-16 day latency window.',
    relevanceScore: 0.89
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    timestamp: '10:40:15 UTC',
    content: 'What are the current temperature trends in the Arabian Sea, and how might they impact regional fisheries over the next decade?'
  },
  {
    id: 'msg-2',
    sender: 'assistant',
    timestamp: '10:40:18 UTC',
    content: `Analysis of recent ARGO float telemetry and satellite SST data indicates an accelerated warming trend in the Arabian Sea.

This warming accelerates the depletion of dissolved oxygen in the mid-water column, expanding the Arabian Sea "Dead Zone" (Oxygen Minimum Zone). Consequently, key pelagic fisheries (e.g., tuna, mackerel) are likely to experience habitat compression, shifting closer to the surface or migrating poleward.`,
    agentChain: ['Planner Agent', 'Ocean Temp (RAG)', 'Fisheries Model'],
    inlineData: {
      title: 'Avg SST Anomaly (2020-2024)',
      value: '+1.2°C',
      confidence: '94% (Source: NOAA, Copernicus)',
      source: 'NOAA, Copernicus'
    },
    actions: [
      { label: 'View on Map', icon: 'map', actionType: 'map' },
      { label: 'Show Sources', icon: 'source', actionType: 'sources' },
      { label: 'Analyze Trend', icon: 'trending_up', actionType: 'analytics' }
    ]
  }
];
