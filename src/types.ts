export type ActiveTab = 
  | 'landing' 
  | 'dashboard' 
  | 'floatchat' 
  | 'explore' 
  | 'analytics' 
  | 'map' 
  | 'sources' 
  | 'about';

export interface Dataset {
  id: string;
  title: string;
  description: string;
  domain: 'Physics' | 'Biogeochemistry' | 'Fisheries' | 'Biodiversity';
  domainTag: string;
  region: string;
  sourceAgency: string;
  resolution: string;
  spatialResolution: string;
  frequency: string;
  sourceNode: string;
  status: 'indexed' | 'on-demand';
  doi?: string;
  sourceUrl?: string;
  format?: string;
  lastUpdated?: string;
  parameters?: Array<{
    name: string;
    standardName: string;
    unit: string;
    validRange: string;
  }>;
}

export interface ArgoFloat {
  id: string;
  wmoId: string;
  lat: number;
  lng: number;
  topPct: number;
  leftPct: number;
  temp: number;
  salinity: number;
  depth: number;
  status: 'nominal' | 'warning' | 'calibrating';
  cycleNumber: number;
  lastProfileDate: string;
}

export interface FishingVessel {
  id: string;
  name: string;
  flag: string;
  type: string;
  topPct: number;
  leftPct: number;
  speedKnots: number;
  heading: number;
  gearType: string;
  status: 'active' | 'drifting' | 'hauling';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  agentChain?: string[];
  inlineData?: {
    title: string;
    value: string;
    confidence: string;
    source: string;
  };
  actions?: Array<{
    label: string;
    icon: string;
    actionType: 'map' | 'sources' | 'analytics' | 'export';
  }>;
}

export interface ScientificCitation {
  refId: string;
  title: string;
  publication: string;
  authors: string;
  year: number;
  extractedInsight: string;
  relevanceScore: number;
}
