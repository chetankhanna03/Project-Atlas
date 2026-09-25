import React from 'react';
import { ActiveTab } from '../../types';
import { OceanWorkspace } from './OceanWorkspace';
export const InteractiveMapView: React.FC<{ setActiveTab: (tab: ActiveTab) => void }> = () => <OceanWorkspace mode='map' />;
