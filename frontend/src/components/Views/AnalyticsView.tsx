import React from 'react';
import { ActiveTab } from '../../types';
import { OceanWorkspace } from './OceanWorkspace';
export const AnalyticsView: React.FC<{ setActiveTab: (tab: ActiveTab) => void }> = () => <OceanWorkspace mode='analytics' />;
